from sqlalchemy import String, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, new_uuid, utcnow

# Forward-referenced models must be imported before User mapper configures
import app.models.conversation  # noqa: F401
import app.models.mood  # noqa: F401
import app.models.assessment  # noqa: F401

import uuid
from datetime import datetime


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID]#告诉orm这个字段是uuid类型python中是UUID.uuid
     = mapped_column(primary_key=True, default=new_uuid)
    nickname: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    email_hash: Mapped[str] = mapped_column(String(64), unique=True, nullable=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    avatar_seed: Mapped[str] = mapped_column(String(20), nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(default=utcnow, onupdate=utcnow)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    timezone: Mapped[str] = mapped_column(String(50), default="UTC")
    #relationship 定义表之间的关联 
    conversations = relationship("Conversation", back_populates="user")
    mood_entries = relationship("MoodEntry", back_populates="user")
    assessments = relationship("Assessment", back_populates="user")
