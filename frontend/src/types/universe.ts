export type PlanetType = "calm" | "happy" | "sad" | "release" | "crisis" | "chat";

export interface PlanetData {
  id: string;
  type: PlanetType;
  size: number;        // 0.3 ~ 2.0
  color: string;       // hex
  orbitRadius: number; // 距中心距离 3~15
  orbitSpeed: number;  // 弧度/秒
  rotationSpeed: number;
  glowIntensity: number;
  angle: number;       // 当前公转角度 (初始随机)
  tilt: number;        // 轨道倾斜
  // 元数据
  sourceType: "mood" | "chat" | "crisis";
  sourceDate: string;
  sourceLabel: string;
  moodScore?: number;
  previewText?: string;
}

export interface UniverseStats {
  totalPlanets: number;
  dominantMood: string;
  universeAgeDays: number;
}

export interface UniverseData {
  planets: PlanetData[];
  stats: UniverseStats;
}
