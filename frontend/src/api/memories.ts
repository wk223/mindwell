import { apiRequest } from "./client";

export interface Memory {
  id: string;
  key: string;
  content: string;
  category: string | null;
  importance: number;
  source_quote: string | null;
  created_at: string;
  updated_at: string;
}

export interface MemoryListResponse {
  memories: Memory[];
  total: number;
}

export async function getMemories(params?: {
  category?: string;
  search?: string;
}): Promise<MemoryListResponse> {
  const query = new URLSearchParams();
  if (params?.category) query.set("category", params.category);
  if (params?.search) query.set("search", params.search);
  const qs = query.toString();
  return apiRequest(`/memories${qs ? `?${qs}` : ""}`);
}

export async function getMemory(id: string): Promise<Memory> {
  return apiRequest(`/memories/${id}`);
}

export async function createMemory(data: {
  key: string;
  content: string;
  category?: string;
  importance?: number;
}): Promise<Memory> {
  return apiRequest("/memories", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteMemory(id: string): Promise<{ status: string }> {
  return apiRequest(`/memories/${id}`, { method: "DELETE" });
}

export async function clearMemories(): Promise<{ status: string; deleted_count: number }> {
  return apiRequest("/memories", { method: "DELETE" });
}
