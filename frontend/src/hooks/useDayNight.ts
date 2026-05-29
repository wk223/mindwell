import { useEffect, useState, useCallback } from "react";

export type DayNightMode = "day" | "night";

/**
 * 日夜双模式 hook
 * - day:   08:00 – 19:59 (温柔治愈)
 * - night: 20:00 – 07:59 (安静陪伴)
 *
 * 切换通过 <html> 的 .night-theme class 驱动，
 * CSS Variables 渐变过渡由 --transition-theme 控制 (≈1.8s)
 */
export function useDayNight() {
  const [mode, setMode] = useState<DayNightMode>(() => getMode());

  const sync = useCallback(() => {
    const next = getMode();
    setMode((prev) => (prev !== next ? next : prev));

    const root = document.documentElement;
    if (next === "night") {
      root.classList.add("night-theme");
    } else {
      root.classList.remove("night-theme");
    }
  }, []);

  useEffect(() => {
    sync();

    // 每分钟检查一次（覆盖跨时间段）
    const interval = setInterval(sync, 60_000);
    // 监听系统主题变化
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemChange = () => sync();
    mq.addEventListener("change", onSystemChange);

    return () => {
      clearInterval(interval);
      mq.removeEventListener("change", onSystemChange);
    };
  }, [sync]);

  const greeting = getGreeting(mode);

  return { mode, greeting };
}

function getMode(): DayNightMode {
  const hour = new Date().getHours();
  return hour >= 8 && hour < 20 ? "day" : "night";
}

function getGreeting(mode: DayNightMode): string {
  const hour = new Date().getHours();

  if (mode === "day") {
    if (hour < 12) return "早上好，今天也要照顾好自己。";
    if (hour < 18) return "下午好，阳光和你都在。";
    return "傍晚好，今天辛苦了。";
  }

  // night
  if (hour < 2) return "很多情绪会在夜里浮上来。";
  if (hour < 6) return "夜深了，世界终于安静了一点。";
  return "夜深了，我在呢。";
}
