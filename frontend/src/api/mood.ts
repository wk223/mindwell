import { apiRequest } from "./client";
import type { MoodEntry, MoodTrends, MoodStats, MoodCalendarEntry } from "../types/mood";

export async function checkin(
  moodScore: number,
  moodLabel?: string,
  journalText?: string,
  tags?: string[]
): Promise<MoodEntry> {
  return apiRequest("/mood/checkin", {
    method: "POST",
    body: JSON.stringify({
      mood_score: moodScore,
      mood_label: moodLabel,
      journal_text: journalText || null,
      tags: tags || [],
    }),
  });
}

export async function getToday(): Promise<{ entry: MoodEntry | null }> {
  return apiRequest("/mood/today");
}

export async function getTodayEntries(): Promise<{ entries: MoodEntry[] }> {
  return apiRequest("/mood/today/entries");
}

export async function getTrends(range: "weekly" | "monthly" = "weekly"): Promise<MoodTrends> {
  return apiRequest(`/mood/trends?range=${range}`);
}

export async function getStats(): Promise<MoodStats> {
  return apiRequest("/mood/stats");
}

export async function getCalendar(days: number = 28): Promise<{ entries: MoodCalendarEntry[] }> {
  return apiRequest(`/mood/calendar?days=${days}`);
}
