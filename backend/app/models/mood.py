import uuid
from datetime import date, datetime
from sqlalchemy import String, Integer, Text, Date, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, new_uuid, utcnow, beijing_today


class MoodEntry(Base):
    __tablename__ = "mood_entries"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=new_uuid)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    mood_score: Mapped[int] = mapped_column(Integer, nullable=False)
    mood_label: Mapped[str] = mapped_column(String(30), nullable=True)
    journal_text: Mapped[str] = mapped_column(Text, nullable=True)
    tags: Mapped[list] = mapped_column(JSON, default=list)
    recorded_at: Mapped[date] = mapped_column(Date, default=beijing_today)
    created_at: Mapped[datetime] = mapped_column(default=utcnow)

    user = relationship("User", back_populates="mood_entries")
