from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.assessment import (
    AssessmentSubmitRequest,
    AssessmentResultResponse,
    AssessmentHistoryResponse,
)
from app.services.assessment_service import AssessmentService
from app.core.assessments.scales import ScoringEngine

router = APIRouter(prefix="/assessments", tags=["assessments"])


@router.get("/scales")
async def list_scales():
    return {"scales": ScoringEngine.get_available_scales()}


@router.get("/scales/{scale_type}")
async def get_scale(scale_type: str, type_code: str | None = None):
    scale = ScoringEngine.get_scale_questions(scale_type.upper(), type_code)
    if not scale:
        raise HTTPException(status_code=404, detail="Scale not found")
    return scale


@router.post("/submit", response_model=AssessmentResultResponse)
async def submit_assessment(
    body: AssessmentSubmitRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = AssessmentService(db)
    answers = [{"question_id": a.question_id, "value": a.value} for a in body.answers]
    result = await service.submit(
        str(user.id), body.scale_type.upper(), answers, body.type_code
    )
    return result


@router.get("/history", response_model=AssessmentHistoryResponse)
async def get_history(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = AssessmentService(db)
    return await service.get_history(str(user.id))


@router.get("/{assessment_id}", response_model=AssessmentResultResponse)
async def get_assessment(
    assessment_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = AssessmentService(db)
    result = await service.get_assessment(str(user.id), assessment_id)
    if not result:
        raise HTTPException(status_code=404, detail="Assessment not found")
    return result
