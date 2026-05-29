import { create } from "zustand";

export type DayNightMode = "day" | "night";

const LS_KEY = "mindwell_theme_override";

function getAutoMode(): DayNightMode {
  const hour = new Date().getHours();
  return hour >= 8 && hour < 20 ? "day" : "night";
}

function applyClass(mode: DayNightMode) {
  const root = document.documentElement;
  if (mode === "night") {
    root.classList.add("night-theme");
  } else {
    root.classList.remove("night-theme");
  }
}

interface ThemeState {
  mode: DayNightMode;
  isManualOverride: boolean;
  toggle: () => void;
  resetToAuto: () => void;
  sync: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: (() => {
    const saved = localStorage.getItem(LS_KEY);
    if (saved === "day" || saved === "night") return saved;
    return getAutoMode();
  })(),
  isManualOverride: localStorage.getItem(LS_KEY) !== null,

  toggle: () => {
    const next = get().mode === "day" ? "night" : "day";
    localStorage.setItem(LS_KEY, next);
    applyClass(next);
    set({ mode: next, isManualOverride: true });
    // 强制刷新确保所有 var() 和 color-mix() 重新计算
    setTimeout(() => window.location.reload(), 100);
  },

  resetToAuto: () => {
    localStorage.removeItem(LS_KEY);
    const auto = getAutoMode();
    applyClass(auto);
    set({ mode: auto, isManualOverride: false });
  },

  sync: () => {
    if (get().isManualOverride) return;
    const auto = getAutoMode();
    if (auto !== get().mode) {
      applyClass(auto);
      set({ mode: auto });
    }
  },
}));

// 初始化时应用 class
applyClass(useThemeStore.getState().mode);

// 每分钟自动同步
setInterval(() => {
  useThemeStore.getState().sync();
}, 60_000);

// 监听系统主题变化
if (typeof window !== "undefined") {
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    useThemeStore.getState().sync();
  });
}

/** 便捷获取问候语 */
export function getGreeting(mode: DayNightMode): string {
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
