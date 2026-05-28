import { useEffect } from "react";
import { useMoodStore } from "../stores/useMoodStore";

export type MoodTheme = "happy" | "calm" | "sad" | "neutral";

function mapScoreToTheme(score: number | undefined): MoodTheme {
  if (score === undefined || score === null) return "neutral";
  if (score >= 8) return "happy";
  if (score >= 5) return "calm";
  return "sad";
}

export function getMoodGreeting(theme: MoodTheme): string {
  const hour = new Date().getHours();
  const timePrefix = hour < 6 ? "夜深了" : hour < 12 ? "早上好" : hour < 18 ? "下午好" : "晚上好";

  switch (theme) {
    case "happy":
      return `${timePrefix}，今天看起来不错呢。有什么开心的事想分享吗？`;
    case "calm":
      return `${timePrefix}，此刻的平静很珍贵。我在呢。`;
    case "sad":
      return `${timePrefix}，没关系，我在这里陪着你。慢慢来。`;
    default:
      return `${timePrefix}，我是小智，你的心理支持陪伴者。`;
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
    root.classList.remove("mood-happy", "mood-calm", "mood-sad", "mood-neutral");
    root.classList.add(`mood-${theme}`);
  }, [theme]);

  return { theme, todayEntry };
}
