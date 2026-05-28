import { create } from "zustand";
import * as communityApi from "../api/community";
import type { Post, PostDetail, Comment } from "../types/community";

interface CommunityState {
  posts: Post[];
  currentPost: PostDetail | null;
  total: number;
  page: number;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;

  loadPosts: (page?: number) => Promise<void>;
  loadPost: (id: string) => Promise<void>;
  createPost: (
    displayName: string,
    title: string,
    content: string,
    labels?: string[],
    anon?: boolean
  ) => Promise<void>;
  addComment: (
    postId: string,
    displayName: string,
    content: string,
    anon?: boolean
  ) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
  reportPost: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useCommunityStore = create<CommunityState>((set, get) => ({
  posts: [],
  currentPost: null,
  total: 0,
  page: 1,
  isLoading: false,
  isSubmitting: false,
  error: null,

  loadPosts: async (page = 1) => {
    set({ isLoading: true });
    try {
      const data = await communityApi.getPosts(page);
      set({
        posts: page === 1 ? data.posts : [...get().posts, ...data.posts],
        total: data.total,
        page: data.page,
        isLoading: false,
      });
    } catch (err: unknown) {
      set({ isLoading: false, error: err instanceof Error ? err.message : "加载失败" });
    }
  },

  loadPost: async (id) => {
    set({ isLoading: true });
    try {
      const detail = await communityApi.getPost(id);
      set({ currentPost: detail, isLoading: false });
    } catch (err: unknown) {
      set({ isLoading: false, error: err instanceof Error ? err.message : "加载失败" });
    }
  },

  createPost: async (displayName, title, content, labels, anon) => {
    set({ isSubmitting: true, error: null });
    try {
      await communityApi.createPost(displayName, title, content, labels, anon);
      set({ isSubmitting: false });
      await get().loadPosts(1);
    } catch (err: unknown) {
      set({ isSubmitting: false, error: err instanceof Error ? err.message : "发布失败" });
    }
  },

  addComment: async (postId, displayName, content, anon) => {
    set({ isSubmitting: true, error: null });
    try {
      await communityApi.createComment(postId, displayName, content, anon);
      set({ isSubmitting: false });
      // Reload the post to get updated comments
      await get().loadPost(postId);
    } catch (err: unknown) {
      set({ isSubmitting: false, error: err instanceof Error ? err.message : "评论失败" });
    }
  },

  deletePost: async (id) => {
    try {
      await communityApi.deletePost(id);
      set((s) => ({
        posts: s.posts.filter((p) => p.id !== id),
        currentPost: s.currentPost?.id === id ? null : s.currentPost,
      }));
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : "删除失败" });
    }
  },

  reportPost: async (id) => {
    try {
      await communityApi.reportPost(id);
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : "举报失败" });
    }
  },

  clearError: () => set({ error: null }),
}));
