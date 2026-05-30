const API_BASE = "/api/v1";

// ── 401 auto-logout event ──
export const AUTH_EXPIRED_EVENT = "mindwell:auth-expired";

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

// ── Token 安全存储（Base64 混淆，短期缓解 XSS；长期改 httpOnly cookie）──
const TOKEN_KEY = "mindwell_token";
const PREFIX = "mw_";

function getToken(): string | null {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    // 新格式：mw_ + Base64
    if (raw.startsWith(PREFIX)) {
      return atob(raw.slice(PREFIX.length));
    }
    // 旧格式向后兼容：明文 token → 自动迁移到新格式
    if (raw.startsWith("eyJ")) {  // JWT 通常以 eyJ 开头
      setToken(raw);
      return raw;
    }
    return null;
  } catch { return null; }
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, PREFIX + btoa(token));
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    if (res.status === 401) {
      window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));
    }
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new ApiError(body.detail || res.statusText, res.status);
  }

  return res.json();
}

export function apiStream(
  endpoint: string,
  body: unknown,
  onToken: (token: string) => void,
  onDone: (data: unknown) => void,
  onError: (err: Error) => void
): AbortController {
  const controller = new AbortController();
  const token = getToken();

  fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
    signal: controller.signal,
  })
    .then(async (res) => {
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ detail: res.statusText }));
        onError(new ApiError(errBody.detail || res.statusText, res.status));
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        onError(new Error("No response body"));
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
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.type === "token") {
                onToken(parsed.content);
              } else if (parsed.type === "done") {
                onDone(parsed);
              } else if (parsed.type === "safety") {
                // Safety event — handled by store
                onToken(""); // placeholder
              }
            } catch {
              // Non-JSON data, treat as raw token
              onToken(data);
            }
          }
        }
      }
    })
    .catch((err) => {
      if (err.name !== "AbortError") {
        onError(err);
      }
    });

  return controller;
}
