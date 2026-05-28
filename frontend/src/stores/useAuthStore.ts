import { create } from "zustand";
import * as authApi from "../api/auth";
import { AUTH_EXPIRED_EVENT } from "../api/client";
import type { User } from "../api/auth";

// ── JWT helpers ──
function decodeJWTPayload(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

function isTokenExpired(token: string, bufferSec = 30): boolean {
  const payload = decodeJWTPayload(token);
  if (!payload || !payload.exp) return true;
  const expMs = (payload.exp as number) * 1000;
  return Date.now() >= expMs - bufferSec * 1000;
}

function getStoredToken(): string | null {
  const token = localStorage.getItem("mindwell_token");
  if (!token) return null;
  if (isTokenExpired(token)) {
    localStorage.removeItem("mindwell_token");
    return null;
  }
  return token;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (nickname: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isAuthenticated: !!getStoredToken(),

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const res = await authApi.login(email, password);
      set({ user: res.user, isAuthenticated: true, isLoading: false });
    } catch (e) {
      set({ isLoading: false });
      throw e;
    }
  },

  register: async (nickname, email, password) => {
    set({ isLoading: true });
    try {
      const res = await authApi.register(nickname, email, password);
      set({ user: res.user, isAuthenticated: true, isLoading: false });
    } catch (e) {
      set({ isLoading: false });
      throw e;
    }
  },

  logout: () => {
    authApi.logout();
    set({ user: null, isAuthenticated: false });
  },
}));

// ── Auto-logout on 401 responses ──
window.addEventListener(AUTH_EXPIRED_EVENT, () => {
  useAuthStore.getState().logout();
});
