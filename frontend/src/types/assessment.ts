export interface ScaleInfo {
  id: string;
  name: string;
  description: string;
  total_questions: number;
  timeframe: string;
}

export interface ScaleDetail extends ScaleInfo {
  questions: Question[];
  options: ScaleOption[];
  type_code?: string;
  type_group?: string;
}

export interface Question {
  id: number;
  text: string;
  dimension?: string;
}

export interface ScaleOption {
  value: number;
  label: string;
}

export interface DimensionScore {
  raw: number;
  max_raw: number;
  normalized: number;
  weighted: number;
  base_adjustment: number;
  final: number;
}

export interface PersonalityResultData {
  type_code: string;
  type_name: string;
  type_group: string;
  stage_id: string;
  dimension_scores: Record<string, DimensionScore>;
  stage_quote: string;
}

export interface AssessmentResult {
  id: string;
  scale_type: string;
  total_score: number;
  max_score: number;
  severity_level: string;
  severity: string;
  interpretation: string;
  answers: Answer[] | PersonalityResultData;
  completed_at: string;
}

export interface Answer {
  question_id: number;
  value: number;
}

export const SEVERITY_COLORS: Record<string, string> = {
  minimal: "bg-emerald-50 text-emerald-700 border-emerald-200",
  mild: "bg-yellow-50 text-yellow-700 border-yellow-200",
  moderate: "bg-orange-50 text-orange-700 border-orange-200",
  moderately_severe: "bg-red-50 text-red-700 border-red-200",
  severe: "bg-red-100 text-red-800 border-red-300",
  // Personality stages
  unawakened: "bg-gray-100 text-gray-700 border-gray-300",
  low: "bg-blue-50 text-blue-700 border-blue-200",
  medium: "bg-emerald-50 text-emerald-700 border-emerald-200",
  high: "bg-amber-50 text-amber-700 border-amber-200",
};

export const STAGE_LABELS: Record<string, string> = {
  unawakened: "未觉醒",
  low: "低阶",
  medium: "中阶",
  high: "高阶",
};

// 16 personality type info
export const TYPE_GROUPS: { label: string; types: string[]; color: string }[] = [
  { label: "分析家", types: ["INTJ", "INTP", "ENTJ", "ENTP"], color: "purple" },
  { label: "外交家", types: ["INFJ", "INFP", "ENFJ", "ENFP"], color: "green" },
  { label: "守卫者", types: ["ISTJ", "ISFJ", "ESTJ", "ESFJ"], color: "blue" },
  { label: "探险家", types: ["ISTP", "ISFP", "ESTP", "ESFP"], color: "yellow" },
];
