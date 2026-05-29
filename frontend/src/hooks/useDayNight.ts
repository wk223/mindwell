import { useThemeStore, getGreeting, type DayNightMode } from "../stores/useThemeStore";

export type { DayNightMode };

/**
 * 日夜双模式 hook（Zustand store 包装器）
 * 所有组件共享同一状态，toggle 全局生效。
 */
export function useDayNight() {
  const mode = useThemeStore((s) => s.mode);
  const isManualOverride = useThemeStore((s) => s.isManualOverride);
  const toggle = useThemeStore((s) => s.toggle);
  const resetToAuto = useThemeStore((s) => s.resetToAuto);

  return {
    mode,
    greeting: getGreeting(mode),
    toggle,
    resetToAuto,
    isManualOverride,
  };
}
