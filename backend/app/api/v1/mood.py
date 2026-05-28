from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.mood import (
    MoodCheckinRequest,
    MoodEntryResponse,
    MoodTrendsResponse,
    MoodStatsResponse,
)
from app.services.mood_service import MoodService

router = APIRouter(prefix="/mood", tags=["mood"])


@router.post("/checkin", response_model=MoodEntryResponse)
async def checkin(
    body: MoodCheckinRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = MoodService(db)
    entry = await service.checkin(
        str(user.id),
        body.mood_score,
        body.mood_label,
        body.journal_text,
        body.tags,
    )
    return entry


@router.get("/today")
async def get_today(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = MoodService(db)
    entry = await service.get_today(str(user.id))
    if not entry:
        return {"entry": None}
    return {"entry": entry}


@router.get("/today/entries")
async def get_today_entries(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = MoodService(db)
    entries = await service.get_today_entries(str(user.id))
    return {"entries": entries}


@router.get("/trends", response_model=MoodTrendsResponse)
async def get_trends(
    range: str = Query("weekly", pattern="^(weekly|monthly)$"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = MoodService(db)
    data = await service.get_trends(str(user.id), range)
    return data


@router.get("/calendar")
async def get_calendar(
    days: int = Query(28, ge=7, le=90),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = MoodService(db)
    data = await service.get_calendar(str(user.id), days)
    return {"entries": data}


@router.get("/stats", response_model=MoodStatsResponse)
async def get_stats(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = MoodService(db)
    data = await service.get_stats(str(user.id))
    return data
