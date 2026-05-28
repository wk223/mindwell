import { apiRequest } from "./client";
import type { ScaleInfo, ScaleDetail, AssessmentResult, Answer } from "../types/assessment";

export async function getScales(): Promise<{ scales: ScaleInfo[] }> {
  return apiRequest("/assessments/scales");
}

export async function getScaleDetail(scaleTypeWithQuery: string): Promise<ScaleDetail> {
  return apiRequest(`/assessments/scales/${scaleTypeWithQuery}`);
}

export async function submitAssessment(
  scaleType: string,
  answers: Answer[],
  typeCode?: string
): Promise<AssessmentResult> {
  const body: Record<string, unknown> = { scale_type: scaleType, answers };
  if (typeCode) {
    body.type_code = typeCode;
  }
  return apiRequest("/assessments/submit", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getHistory(): Promise<{ assessments: AssessmentResult[]; total: number }> {
  return apiRequest("/assessments/history");
}

export async function getAssessment(id: string): Promise<AssessmentResult> {
  return apiRequest(`/assessments/${id}`);
}
