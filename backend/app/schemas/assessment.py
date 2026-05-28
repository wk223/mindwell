from pydantic import BaseModel, Field


class AnswerItem(BaseModel):
    question_id: int
    value: int = Field(ge=0, le=4)


class AssessmentSubmitRequest(BaseModel):
    scale_type: str
    answers: list[AnswerItem]
    type_code: str | None = None


class AssessmentResultResponse(BaseModel):
    id: str
    scale_type: str
    total_score: int
    max_score: int
    severity_level: str
    severity: str
    interpretation: str
    answers: list[dict] | dict
    completed_at: str


class ScaleInfo(BaseModel):
    id: str
    name: str
    description: str
    total_questions: int
    timeframe: str


class ScaleDetail(ScaleInfo):
    questions: list[dict]
    options: list[dict]


class AssessmentHistoryResponse(BaseModel):
    assessments: list[AssessmentResultResponse]
    total: int
