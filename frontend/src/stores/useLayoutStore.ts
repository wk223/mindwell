import { create } from "zustand";

interface LayoutState {
  isMobile: boolean;
  manualOverride: boolean;
  toggle: () => void;
  setMobile: (v: boolean) => void;
}

export const useLayoutStore = create<LayoutState>((set) => ({
  isMobile: window.innerWidth < 1024,
  manualOverride: false,
  toggle: () =>
    set((s) => {
      const next = !s.isMobile;
      return { isMobile: next, manualOverride: true };
    }),
  setMobile: (v: boolean) => {
    set((s) => {
      if (s.manualOverride) return {};
      return { isMobile: v };
    });
  },
}));
