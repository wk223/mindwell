from datetime import date, timedelta
from uuid import UUID

from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.mood import MoodEntry
from app.models.base import beijing_today


MOOD_LABELS = [
    (1, "非常低落"),
    (2, "低落"),
    (3, "不太好"),
    (4, "有点差"),
    (5, "一般"),
    (6, "还行"),
    (7, "不错"),
    (8, "挺好"),
    (9, "很好"),
    (10, "非常好"),
]


class MoodService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def checkin(
        self,
        user_id: str,
        mood_score: int,
        mood_label: str | None = None,
        journal_text: str | None = None,
        tags: list[str] | None = None,
    ) -> dict:
        """Create a new mood entry. Always creates a new record to allow multiple check-ins per day."""
        today = beijing_today()

        entry = MoodEntry(
            user_id=UUID(user_id),
            mood_score=mood_score,
            mood_label=mood_label,
            journal_text=journal_text,
            tags=tags or [],
            recorded_at=today,
        )
        self.db.add(entry)
        await self.db.commit()
        await self.db.refresh(entry)
        return self._entry_to_dict(entry)

    async def get_today(self, user_id: str) -> dict | None:
        """Get the latest mood entry for today."""
        today = beijing_today()
        stmt = (
            select(MoodEntry)
            .where(
                and_(MoodEntry.user_id == user_id, MoodEntry.recorded_at == today)
            )
            .order_by(MoodEntry.created_at.desc())
            .limit(1)
        )
        result = await self.db.execute(stmt)
        entry = result.scalars().first()
        return self._entry_to_dict(entry) if entry else None

    async def get_today_entries(self, user_id: str) -> list[dict]:
        """Get all mood entries for today, ordered by creation time."""
        today = beijing_today()
        stmt = (
            select(MoodEntry)
            .where(
                and_(MoodEntry.user_id == user_id, MoodEntry.recorded_at == today)
            )
            .order_by(MoodEntry.created_at.asc())
        )
        result = await self.db.execute(stmt)
        entries = result.scalars().all()
        return [self._entry_to_dict(e) for e in entries]

    async def get_trends(
        self, user_id: str, range: str = "weekly"
    ) -> dict:
        """Get mood trend data for weekly or monthly view."""
        days = 7 if range == "weekly" else 30
        since = beijing_today() - timedelta(days=days)

        stmt = (
            select(MoodEntry)
            .where(
                and_(
                    MoodEntry.user_id == user_id,
                    MoodEntry.recorded_at >= since,
                )
            )
            .order_by(MoodEntry.recorded_at.asc())
        )
        result = await self.db.execute(stmt)
        entries = result.scalars().all()

        trend_points = [
            {
                "date": e.recorded_at.isoformat(),
                "score": float(e.mood_score),
                "label": e.mood_label,
            }
            for e in entries
        ]

        scores = [e.mood_score for e in entries]
        return {
            "entries": trend_points,
            "average": round(sum(scores) / len(scores), 1) if scores else 0,
            "highest": max(scores) if scores else 0,
            "lowest": min(scores) if scores else 0,
            "total_entries": len(entries),
        }

    async def get_stats(self, user_id: str) -> dict:
        """Get aggregated stats with streak calculation."""
        # Get all entries ordered by date
        stmt = (
            select(MoodEntry)
            .where(MoodEntry.user_id == user_id)
            .order_by(MoodEntry.recorded_at.desc())
        )
        result = await self.db.execute(stmt)
        entries = result.scalars().all()

        if not entries:
            return {
                "current_streak": 0,
                "longest_streak": 0,
                "total_checkins": 0,
                "average_score": 0,
                "most_common_label": None,
                "monthly_summary": [],
            }

        scores = [e.mood_score for e in entries]

        # Streak calculation
        current_streak, longest_streak = self._calculate_streaks(entries)

        # Most common label
        label_counts: dict[str, int] = {}
        for e in entries:
            if e.mood_label:
                label_counts[e.mood_label] = label_counts.get(e.mood_label, 0) + 1
        most_common = max(label_counts, key=label_counts.get) if label_counts else None

        # Monthly summary
        month_ago = beijing_today() - timedelta(days=30)
        monthly = [e for e in entries if e.recorded_at >= month_ago]
        monthly_summary = [
            {"date": e.recorded_at.isoformat(), "score": float(e.mood_score), "label": e.mood_label}
            for e in monthly
        ]

        return {
            "current_streak": current_streak,
            "longest_streak": longest_streak,
            "total_checkins": len(entries),
            "average_score": round(sum(scores) / len(scores), 1),
            "most_common_label": most_common,
            "monthly_summary": monthly_summary,
        }

    async def get_calendar(self, user_id: str, days: int = 28) -> list[dict]:
        """Get daily mood entries for calendar heatmap."""
        since = beijing_today() - timedelta(days=days)
        stmt = (
            select(MoodEntry)
            .where(
                and_(
                    MoodEntry.user_id == user_id,
                    MoodEntry.recorded_at >= since,
                )
            )
            .order_by(MoodEntry.recorded_at.asc())
        )
        result = await self.db.execute(stmt)
        entries = result.scalars().all()
        return [
            {"date": e.recorded_at.isoformat(), "score": e.mood_score, "label": e.mood_label}
            for e in entries
        ]

    async def get_recent_moods(self, user_id: str, days: int = 7) -> list[dict]:
        """Get recent moods for AI context injection."""
        since = beijing_today() - timedelta(days=days)
        stmt = (
            select(MoodEntry)
            .where(
                and_(
                    MoodEntry.user_id == user_id,
                    MoodEntry.recorded_at >= since,
                )
            )
            .order_by(MoodEntry.recorded_at.desc())
        )
        result = await self.db.execute(stmt)
        entries = result.scalars().all()
        return [self._entry_to_dict(e) for e in entries]

    def _calculate_streaks(self, entries: list[MoodEntry]) -> tuple[int, int]:
        """Calculate current and longest consecutive day streaks."""
        if not entries:
            return 0, 0

        dates = sorted({e.recorded_at for e in entries}, reverse=True)
        today = beijing_today()

        current_streak = 0
        check_date = today
        for d in dates:
            if d == check_date:
                current_streak += 1
                check_date = d - timedelta(days=1)
            elif d < check_date:
                break

        longest = 1
        current_run = 1
        for i in range(1, len(dates)):
            if (dates[i - 1] - dates[i]).days == 1:
                current_run += 1
                longest = max(longest, current_run)
            else:
                current_run = 1

        if len(dates) == 1:
            longest = 1

        return current_streak, longest

    def _entry_to_dict(self, entry: MoodEntry) -> dict:
        return {
            "id": str(entry.id),
            "mood_score": entry.mood_score,
            "mood_label": entry.mood_label,
            "journal_text": entry.journal_text,
            "tags": entry.tags or [],
            "recorded_at": entry.recorded_at.isoformat(),
            "created_at": entry.created_at.isoformat(),
        }
