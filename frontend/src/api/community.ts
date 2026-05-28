import { apiRequest } from "./client";
import type { Post, PostDetail, PostList, Comment } from "../types/community";

export async function createPost(
  displayName: string,
  title: string,
  content: string,
  contentLabels: string[] = [],
  isAnonymous: boolean = true
): Promise<Post> {
  return apiRequest("/community/posts", {
    method: "POST",
    body: JSON.stringify({
      display_name: displayName,
      title,
      content,
      content_labels: contentLabels,
      is_anonymous: isAnonymous,
    }),
  });
}

export async function getPosts(page: number = 1, limit: number = 20): Promise<PostList> {
  return apiRequest(`/community/posts?page=${page}&limit=${limit}`);
}

export async function getPost(postId: string): Promise<PostDetail> {
  return apiRequest(`/community/posts/${postId}`);
}

export async function createComment(
  postId: string,
  displayName: string,
  content: string,
  isAnonymous: boolean = true
): Promise<Comment> {
  return apiRequest(`/community/posts/${postId}/comments`, {
    method: "POST",
    body: JSON.stringify({
      display_name: displayName,
      content,
      is_anonymous: isAnonymous,
    }),
  });
}

export async function deletePost(postId: string): Promise<void> {
  await apiRequest(`/community/posts/${postId}`, { method: "DELETE" });
}

export async function reportPost(postId: string): Promise<{ status: string }> {
  return apiRequest(`/community/posts/${postId}/report`, { method: "POST" });
}
