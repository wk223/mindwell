export interface MoodEntry {
  id: string;
  mood_score: number;
  mood_label: string | null;
  journal_text: string | null;
  tags: string[];
  recorded_at: string;
  created_at: string;
}

export interface MoodTrendPoint {
  date: string;
  score: number;
  label: string | null;
}

export interface MoodTrends {
  entries: MoodTrendPoint[];
  average: number;
  highest: number;
  lowest: number;
  total_entries: number;
}

export interface MoodStats {
  current_streak: number;
  longest_streak: number;
  total_checkins: number;
  average_score: number;
  most_common_label: string | null;
  monthly_summary: MoodTrendPoint[];
}

export interface MoodCalendarEntry {
  date: string;
  score: number;
  label: string | null;
}

export const MOOD_EMOJIS: Record<number, string> = {
  1: "😭",
  2: "😢",
  3: "😔",
  4: "😕",
  5: "😐",
  6: "🙂",
  7: "😊",
  8: "😄",
  9: "🥰",
  10: "🌟",
};

export const MOOD_LABELS: Record<number, string> = {
  1: "非常低落",
  2: "低落",
  3: "不太好",
  4: "有点差",
  5: "一般",
  6: "还行",
  7: "不错",
  8: "挺好",
  9: "很好",
  10: "非常好",
};
