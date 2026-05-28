import { apiRequest, setToken, clearToken } from "./client";

export interface User {
  id: string;
  nickname: string;
  avatar_seed: string | null;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export async function register(
  nickname: string,
  email: string,
  password: string
): Promise<AuthResponse> {
  const res = await apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ nickname, email, password }),
  });
  setToken(res.access_token);
  return res;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setToken(res.access_token);
  return res;
}

export function logout() {
  clearToken();
}
