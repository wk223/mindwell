import { create } from "zustand";
import * as assessmentApi from "../api/assessment";
import type { ScaleInfo, ScaleDetail, AssessmentResult, Answer } from "../types/assessment";

interface AssessmentState {
  scales: ScaleInfo[];
  currentScale: ScaleDetail | null;
  currentAnswers: Record<number, number>;
  results: AssessmentResult[];
  currentResult: AssessmentResult | null;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  // Personality test flow
  selectedType: string | null;
  showTypeSelector: boolean;

  loadScales: () => Promise<void>;
  loadScaleDetail: (scaleType: string, typeCode?: string) => Promise<void>;
  setAnswer: (questionId: number, value: number) => void;
  submit: (scaleType: string, typeCode?: string) => Promise<void>;
  loadHistory: () => Promise<void>;
  loadResult: (id: string) => Promise<void>;
  resetCurrent: () => void;
  clearError: () => void;
  selectType: (typeCode: string) => void;
  startPersonalityTest: () => void;
}

export const useAssessmentStore = create<AssessmentState>((set, get) => ({
  scales: [],
  currentScale: null,
  currentAnswers: {},
  results: [],
  currentResult: null,
  isLoading: false,
  isSubmitting: false,
  error: null,
  selectedType: null,
  showTypeSelector: false,

  loadScales: async () => {
    if (get().scales.length > 0) return;
    set({ isLoading: true });
    try {
      const data = await assessmentApi.getScales();
      set({ scales: data.scales, isLoading: false });
    } catch (err: unknown) {
      set({ isLoading: false, error: err instanceof Error ? err.message : "加载失败" });
    }
  },

  loadScaleDetail: async (scaleType, typeCode) => {
    set({ isLoading: true, currentAnswers: {}, currentResult: null, showTypeSelector: false, error: null });
    try {
      const query = typeCode ? `?type_code=${typeCode}` : "";
      const detail = await assessmentApi.getScaleDetail(scaleType + query);
      set({ currentScale: detail, isLoading: false });
    } catch (err: unknown) {
      set({ isLoading: false, error: err instanceof Error ? err.message : "加载失败" });
    }
  },

  setAnswer: (questionId, value) => {
    set((s) => ({
      currentAnswers: { ...s.currentAnswers, [questionId]: value },
    }));
  },

  submit: async (scaleType, typeCode) => {
    const { currentAnswers, currentScale } = get();
    if (!currentScale) return;

    const answers: Answer[] = currentScale.questions.map((q) => ({
      question_id: q.id,
      value: currentAnswers[q.id] ?? 0,
    }));

    set({ isSubmitting: true, error: null });
    try {
      const result = await assessmentApi.submitAssessment(scaleType, answers, typeCode);
      set({ currentResult: result, isSubmitting: false });
    } catch (err: unknown) {
      set({ isSubmitting: false, error: err instanceof Error ? err.message : "提交失败" });
    }
  },

  loadHistory: async () => {
    if (get().results.length > 0) return;
    try {
      const data = await assessmentApi.getHistory();
      set({ results: data.assessments });
    } catch {
      // silent
    }
  },

  loadResult: async (id) => {
    set({ isLoading: true });
    try {
      const result = await assessmentApi.getAssessment(id);
      set({ currentResult: result, isLoading: false });
    } catch (err: unknown) {
      set({ isLoading: false, error: err instanceof Error ? err.message : "加载失败" });
    }
  },

  resetCurrent: () => {
    set({
      currentScale: null,
      currentAnswers: {},
      currentResult: null,
      showTypeSelector: false,
      selectedType: null,
    });
  },

  clearError: () => set({ error: null }),

  selectType: (typeCode) => {
    set({ selectedType: typeCode });
  },

  startPersonalityTest: () => {
    set({ showTypeSelector: true });
  },
}));
