import { useEffect } from "react";
import { useMoodStore } from "../stores/useMoodStore";

export type MoodTheme = "anxious" | "calm" | "happy";

function mapScoreToTheme(score: number | undefined): MoodTheme {
  if (score === undefined || score === null) return "calm";
  if (score >= 7) return "happy";
  if (score >= 4) return "calm";
  return "anxious";
}

export function getMoodGreeting(theme: MoodTheme): string {
  const hour = new Date().getHours();
  const timePrefix = hour < 6 ? "夜深了" : hour < 12 ? "早上好" : hour < 18 ? "下午好" : "晚上好";

  switch (theme) {
    case "happy":
      return `${timePrefix}，今天看起来不错呢。`;
    case "anxious":
      return `${timePrefix}，没关系，慢慢来。我在呢。`;
    case "calm":
    default:
      return `${timePrefix}，此刻的平静很珍贵。`;
  }
}

export function useMoodTheme() {
  const todayEntry = useMoodStore((s) => s.todayEntry);
  const loadToday = useMoodStore((s) => s.loadToday);

  useEffect(() => {
    loadToday();
  }, [loadToday]);

  const theme = mapScoreToTheme(todayEntry?.mood_score);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("mood-anxious", "mood-calm", "mood-happy", "mood-neutral", "mood-sad");
    root.classList.add(`mood-${theme}`);
  }, [theme]);

  return { theme, todayEntry };
}
