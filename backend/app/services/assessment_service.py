from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.assessment import Assessment
from app.core.assessments.scales import ScoringEngine, SCALES


class AssessmentService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.scoring = ScoringEngine()

    def get_available_scales(self) -> list[dict]:
        return self.scoring.get_available_scales()

    def get_scale_detail(self, scale_type: str) -> dict | None:
        return self.scoring.get_scale_questions(scale_type)

    async def submit(
        self, user_id: str, scale_type: str, answers: list[dict], type_code: str | None = None
    ) -> dict:
        """Score and save an assessment."""
        result = self.scoring.score(scale_type, answers, type_code)

        assessment = Assessment(
            user_id=UUID(user_id),
            scale_type=result["scale_type"],
            total_score=result["total_score"],
            severity_level=result["severity_level"],
            interpretation=result["interpretation"],
            answers=result.get("result_data", result["answers"]),
        )
        self.db.add(assessment)
        await self.db.commit()
        await self.db.refresh(assessment)

        return {
            "id": str(assessment.id),
            "scale_type": assessment.scale_type,
            "total_score": assessment.total_score,
            "max_score": result["max_score"],
            "severity_level": assessment.severity_level,
            "severity": result["severity"],
            "interpretation": assessment.interpretation,
            "answers": assessment.answers,
            "completed_at": assessment.completed_at.isoformat(),
        }

    async def get_history(self, user_id: str) -> dict:
        stmt = (
            select(Assessment)
            .where(Assessment.user_id == user_id)
            .order_by(Assessment.completed_at.desc())
        )
        result = await self.db.execute(stmt)
        assessments = result.scalars().all()

        scale_max = {k: v["scoring"]["range"][1] for k, v in SCALES.items()}

        return {
            "assessments": [
                {
                    "id": str(a.id),
                    "scale_type": a.scale_type,
                    "total_score": a.total_score,
                    "max_score": scale_max.get(a.scale_type, 0),
                    "severity_level": a.severity_level,
                    "severity": a.severity_level,
                    "interpretation": a.interpretation,
                    "answers": a.answers,
                    "completed_at": a.completed_at.isoformat(),
                }
                for a in assessments
            ],
            "total": len(assessments),
        }

    async def get_assessment(self, user_id: str, assessment_id: str) -> dict | None:
        stmt = select(Assessment).where(
            Assessment.id == assessment_id, Assessment.user_id == user_id
        )
        result = await self.db.execute(stmt)
        a = result.scalars().first()
        if not a:
            return None

        scale_max = {k: v["scoring"]["range"][1] for k, v in SCALES.items()}

        return {
            "id": str(a.id),
            "scale_type": a.scale_type,
            "total_score": a.total_score,
            "max_score": scale_max.get(a.scale_type, 0),
            "severity_level": a.severity_level,
            "severity": a.severity_level,
            "interpretation": a.interpretation,
            "answers": a.answers,
            "completed_at": a.completed_at.isoformat(),
        }
