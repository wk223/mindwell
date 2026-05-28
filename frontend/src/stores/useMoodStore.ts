import { create } from "zustand";
import * as moodApi from "../api/mood";
import type { MoodEntry, MoodTrends, MoodStats, MoodCalendarEntry } from "../types/mood";

interface MoodState {
  todayEntry: MoodEntry | null;
  todayEntries: MoodEntry[];
  trends: MoodTrends | null;
  stats: MoodStats | null;
  calendar: MoodCalendarEntry[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;

  loadToday: () => Promise<void>;
  loadTodayEntries: () => Promise<void>;
  loadTrends: (range?: "weekly" | "monthly") => Promise<void>;
  loadStats: () => Promise<void>;
  loadCalendar: (days?: number) => Promise<void>;
  submitCheckin: (
    score: number,
    label?: string,
    journal?: string,
    tags?: string[]
  ) => Promise<void>;
  clearError: () => void;
}

export const useMoodStore = create<MoodState>((set) => ({
  todayEntry: null,
  todayEntries: [],
  trends: null,
  stats: null,
  calendar: [],
  isLoading: false,
  isSubmitting: false,
  error: null,

  loadToday: async () => {
    set({ isLoading: true });
    try {
      const data = await moodApi.getToday();
      set({ todayEntry: data.entry, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  loadTodayEntries: async () => {
    try {
      const data = await moodApi.getTodayEntries();
      set({ todayEntries: data.entries });
    } catch {
      // silent
    }
  },

  loadTrends: async (range = "weekly") => {
    try {
      const data = await moodApi.getTrends(range);
      set({ trends: data });
    } catch {
      // silent
    }
  },

  loadStats: async () => {
    try {
      const data = await moodApi.getStats();
      set({ stats: data });
    } catch {
      // silent
    }
  },

  loadCalendar: async (days = 28) => {
    try {
      const data = await moodApi.getCalendar(days);
      set({ calendar: data.entries });
    } catch {
      // silent
    }
  },

  submitCheckin: async (score, label, journal, tags) => {
    set({ isSubmitting: true, error: null });
    try {
      const entry = await moodApi.checkin(score, label, journal, tags);
      set({ todayEntry: entry, isSubmitting: false });
    } catch (err: unknown) {
      set({
        isSubmitting: false,
        error: err instanceof Error ? err.message : "提交失败",
      });
    }
  },

  clearError: () => set({ error: null }),
}));
