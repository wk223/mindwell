import { useEffect, useState, useCallback } from "react";

export type DayNightMode = "day" | "night";

const LS_KEY = "mindwell_theme_override";

/**
 * 日夜双模式 hook
 * - day:   08:00 – 19:59 (温柔治愈)
 * - night: 20:00 – 07:59 (安静陪伴)
 *
 * 支持手动覆盖（toggle）和自动恢复（resetToAuto），
 * 手动覆盖持久化到 localStorage。
 * 切换通过 <html> 的 .night-theme class 驱动。
 */
export function useDayNight() {
  const [mode, setMode] = useState<DayNightMode>(() => {
    const saved = localStorage.getItem(LS_KEY);
    if (saved === "day" || saved === "night") return saved;
    return getMode();
  });

  const [isManualOverride, setIsManualOverride] = useState(() => {
    return localStorage.getItem(LS_KEY) !== null;
  });

  const applyMode = useCallback((m: DayNightMode) => {
    const root = document.documentElement;
    if (m === "night") {
      root.classList.add("night-theme");
    } else {
      root.classList.remove("night-theme");
    }
  }, []);

  const sync = useCallback(() => {
    if (isManualOverride) return; // 手动模式下不自动切换
    const next = getMode();
    setMode((prev) => (prev !== next ? next : prev));
    applyMode(next);
  }, [isManualOverride, applyMode]);

  // 初始应用
  useEffect(() => {
    applyMode(mode);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    sync();
    const interval = setInterval(sync, 60_000);
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemChange = () => sync();
    mq.addEventListener("change", onSystemChange);
    return () => {
      clearInterval(interval);
      mq.removeEventListener("change", onSystemChange);
    };
  }, [sync]);

  /** 手动切换日夜（覆盖自动） */
  const toggle = useCallback(() => {
    setMode((prev) => {
      const next: DayNightMode = prev === "day" ? "night" : "day";
      localStorage.setItem(LS_KEY, next);
      applyMode(next);
      return next;
    });
    setIsManualOverride(true);
  }, [applyMode]);

  /** 恢复自动模式 */
  const resetToAuto = useCallback(() => {
    localStorage.removeItem(LS_KEY);
    setIsManualOverride(false);
    const auto = getMode();
    setMode(auto);
    applyMode(auto);
  }, [applyMode]);

  const greeting = getGreeting(mode);

  return { mode, greeting, toggle, resetToAuto, isManualOverride };
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

  if (hour < 2) return "很多情绪会在夜里浮上来。";
  if (hour < 6) return "夜深了，世界终于安静了一点。";
  return "夜深了，我在呢。";
}
