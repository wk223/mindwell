import { create } from "zustand";
import type { PlanetData, UniverseStats } from "../types/universe";

// ── Mock 数据（Phase 1 开发用）──
const MOCK_PLANETS: PlanetData[] = [
  { id: "1", type: "calm",  size: 0.9,  color: "#7dd3fc", orbitRadius: 5,  orbitSpeed: 0.15, rotationSpeed: 0.3, glowIntensity: 0.6, angle: 0.2,  tilt: 0.05, sourceType: "mood",   sourceDate: "2025-07-10", sourceLabel: "平静",  moodScore: 6, previewText: "今天天气不错，心情挺好…" },
  { id: "2", type: "happy", size: 1.3,  color: "#fbbf24", orbitRadius: 9,  orbitSpeed: 0.10, rotationSpeed: 0.8, glowIntensity: 0.9, angle: 1.8,  tilt: -0.08,sourceType: "mood",   sourceDate: "2025-07-12", sourceLabel: "幸福",  moodScore: 9, previewText: "收到了一份意外的礼物！" },
  { id: "3", type: "sad",   size: 0.7,  color: "#8b5cf6", orbitRadius: 7,  orbitSpeed: 0.08, rotationSpeed: 0.2, glowIntensity: 0.4, angle: 3.5,  tilt: 0.12, sourceType: "mood",   sourceDate: "2025-07-08", sourceLabel: "忧伤",  moodScore: 3, previewText: "今天有点失落…" },
  { id: "4", type: "chat",  size: 1.0,  color: "#a78bfa", orbitRadius: 12, orbitSpeed: 0.06, rotationSpeed: 0.4, glowIntensity: 0.5, angle: 5.2,  tilt: -0.03,sourceType: "chat",   sourceDate: "2025-07-13", sourceLabel: "倾诉",  moodScore: 7, previewText: "我今天想聊聊关于未来的事情…" },
  { id: "5", type: "happy", size: 1.5,  color: "#facc15", orbitRadius: 6,  orbitSpeed: 0.18, rotationSpeed: 1.0, glowIntensity: 1.0, angle: 0.8,  tilt: 0.02, sourceType: "chat",   sourceDate: "2025-07-14", sourceLabel: "幸福",  moodScore: 8, previewText: "今天终于完成了那个项目" },
  { id: "6", type: "calm",  size: 0.8,  color: "#7dd3fc", orbitRadius: 10, orbitSpeed: 0.07, rotationSpeed: 0.25,glowIntensity: 0.5, angle: 4.0,  tilt: -0.06,sourceType: "mood",   sourceDate: "2025-07-11", sourceLabel: "平静",  moodScore: 5, previewText: "安静的一天" },
  { id: "7", type: "release",size: 0.6, color: "#e2e8f0", orbitRadius: 14, orbitSpeed: 0.04, rotationSpeed: 0.15,glowIntensity: 0.7, angle: 2.5,  tilt: 0.10, sourceType: "crisis", sourceDate: "2025-07-09", sourceLabel: "释怀",  moodScore: 6, previewText: "终于放下了…" },
  { id: "8", type: "chat",  size: 1.1,  color: "#c4b5fd", orbitRadius: 8,  orbitSpeed: 0.12, rotationSpeed: 0.5, glowIntensity: 0.6, angle: 6.0,  tilt: -0.04,sourceType: "chat",   sourceDate: "2025-07-14", sourceLabel: "倾诉",  moodScore: 6, previewText: "最近总觉得少了点什么" },
];

interface UniverseState {
  planets: PlanetData[];
  stats: UniverseStats;
  selectedPlanetId: string | null;
  isLoading: boolean;
  selectPlanet: (id: string | null) => void;
  loadPlanets: () => Promise<void>;
  updatePlanetAngle: (id: string, angle: number) => void;
}

export const useUniverseStore = create<UniverseState>((set, get) => ({
  planets: MOCK_PLANETS,
  stats: {
    totalPlanets: MOCK_PLANETS.length,
    dominantMood: "calm",
    universeAgeDays: 30,
  },
  selectedPlanetId: null,
  isLoading: false,

  selectPlanet: (id) => set({ selectedPlanetId: id }),

  loadPlanets: async () => {
    set({ isLoading: true });
    // TODO: 替换为真实 API 调用
    // const res = await apiRequest<UniverseData>("/universe/planets");
    // set({ planets: res.planets, stats: res.stats });
    await new Promise((r) => setTimeout(r, 500));
    set({ isLoading: false });
  },

  updatePlanetAngle: (id, angle) => {
    set((s) => ({
      planets: s.planets.map((p) => (p.id === id ? { ...p, angle } : p)),
    }));
  },
}));
