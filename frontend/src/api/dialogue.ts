import { apiRequest, getToken } from "./client";
import type { Conversation, Message } from "../types/dialogue";

export interface SendMessageCallbacks {
  onToken: (token: string) => void;
  onDone: (data: { message: string; conversation_id: string; safety_flags: unknown[] }) => void;
  onSafety: (event: { flags: unknown[]; crisis_response?: string }) => void;
  onOverride: (message: string) => void;
  onError: (error: Error) => void;
}

export function sendMessageStream(
  conversationId: string | null,
  message: string,
  callbacks: SendMessageCallbacks
): AbortController {
  const controller = new AbortController();
  const token = getToken();

  fetch("/api/v1/dialogue/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      conversation_id: conversationId,
      message,
      stream: true,
    }),
    signal: controller.signal,
  })
    .then(async (res) => {
      if (!res.ok) {
        if (res.status === 401) {
          window.dispatchEvent(new CustomEvent("mindwell:auth-expired"));
        }
        const body = await res.json().catch(() => ({ detail: res.statusText }));
        callbacks.onError(new Error(body.detail || res.statusText));
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        callbacks.onError(new Error("No response body"));
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;

          try {
            const event = JSON.parse(data);
            switch (event.type) {
              case "token":
                callbacks.onToken(event.content);
                break;
              case "safety":
                callbacks.onSafety(event);
                break;
              case "done":
                callbacks.onDone(event);
                break;
              case "override":
                callbacks.onOverride(event.message || "");
                break;
              case "error":
                callbacks.onError(new Error(event.detail));
                break;
            }
          } catch {
            // Ignore parse errors for non-JSON data
          }
        }
      }
    })
    .catch((err) => {
      if (err.name !== "AbortError") {
        callbacks.onError(err);
      }
    });

  return controller;
}

export async function getConversations(): Promise<Conversation[]> {
  const res = await apiRequest<{ conversations: Conversation[] }>("/dialogue/conversations");
  return res.conversations;
}

export async function getConversationHistory(
  conversationId: string
): Promise<{ conversation_id: string; messages: Message[] }> {
  return apiRequest(`/dialogue/conversations/${conversationId}`);
}

export async function deleteConversation(conversationId: string): Promise<void> {
  await apiRequest(`/dialogue/conversations/${conversationId}`, { method: "DELETE" });
}
