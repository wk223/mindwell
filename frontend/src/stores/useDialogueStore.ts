import { create } from "zustand";
import * as dialogueApi from "../api/dialogue";
import type { Conversation, Message, SafetyFlag } from "../types/dialogue";

interface DialogueState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Message[];
  isStreaming: boolean;
  streamingContent: string;
  safetyFlags: SafetyFlag[];
  crisisActive: boolean;
  crisisResponse: string | null;
  error: string | null;
  abortController: AbortController | null;

  loadConversations: () => Promise<void>;
  createNewChat: () => void;
  selectConversation: (id: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  stopStreaming: () => void;
  deleteConversation: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useDialogueStore = create<DialogueState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: [],
  isStreaming: false,
  streamingContent: "",
  safetyFlags: [],
  crisisActive: false,
  crisisResponse: null,
  error: null,
  abortController: null,

  loadConversations: async () => {
    try {
      const conversations = await dialogueApi.getConversations();
      set({ conversations });
    } catch {
      // Silently fail — conversations will load on next try
    }
  },

  createNewChat: () => {
    set({
      activeConversationId: null,
      messages: [],
      safetyFlags: [],
      crisisActive: false,
      crisisResponse: null,
      error: null,
    });
  },

  selectConversation: async (id: string) => {
    try {
      const data = await dialogueApi.getConversationHistory(id);
      set({
        activeConversationId: id,
        messages: data.messages || [],
        crisisActive: false,
        crisisResponse: null,
      });
    } catch {
      set({ error: "加载对话失败" });
    }
  },

  sendMessage: async (content: string) => {
    const state = get();
    if (state.isStreaming || !content.trim()) return;

    // Add user message immediately
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };

    set({
      messages: [...state.messages, userMsg],
      isStreaming: true,
      streamingContent: "",
      error: null,
      safetyFlags: [],
      crisisActive: false,
      crisisResponse: null,
    });

    const controller = dialogueApi.sendMessageStream(state.activeConversationId, content.trim(), {
      onToken: (token) => {
        set((s) => ({ streamingContent: s.streamingContent + token }));
      },
      onDone: (data) => {
        const aiMsg: Message = {
          id: `ai-${Date.now()}`,
          role: "assistant",
          content: data.message,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({
          messages: [...s.messages, aiMsg],
          isStreaming: false,
          streamingContent: "",
          activeConversationId: data.conversation_id,
          safetyFlags: (data.safety_flags as SafetyFlag[]) || [],
        }));

        // Reload conversation list
        get().loadConversations();
      },
      onSafety: (event) => {
        if (event.crisis_response) {
          set({
            crisisActive: true,
            crisisResponse: event.crisis_response,
          });
        } else if (event.flags?.length > 0) {
          set({ safetyFlags: event.flags as SafetyFlag[] });
        }
      },
      onOverride: (safeMessage) => {
        // Replace streaming content with safe override message
        set({ streamingContent: safeMessage });
      },
      onError: (err) => {
        set({
          isStreaming: false,
          streamingContent: "",
          error: err.message || "发送失败，请重试",
        });
      },
    });

    set({ abortController: controller });
  },

  stopStreaming: () => {
    const { abortController } = get();
    if (abortController) {
      abortController.abort();
    }
    set({ isStreaming: false, streamingContent: "", abortController: null });
  },

  deleteConversation: async (id: string) => {
    try {
      await dialogueApi.deleteConversation(id);
      set((s) => ({
        conversations: s.conversations.filter((c) => c.id !== id),
        activeConversationId: s.activeConversationId === id ? null : s.activeConversationId,
        messages: s.activeConversationId === id ? [] : s.messages,
      }));
    } catch {
      set({ error: "删除失败" });
    }
  },

  clearError: () => set({ error: null }),
}));
