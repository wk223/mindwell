import uuid
from datetime import date, datetime, timezone, timedelta
from sqlalchemy import DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


def utcnow():
    return datetime.now(timezone.utc)


def new_uuid():
    return uuid.uuid4()


def beijing_today() -> date:
    return (datetime.now(timezone.utc) + timedelta(hours=8)).date()
