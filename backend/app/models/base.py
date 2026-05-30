import uuid
from datetime import date, datetime, timezone, timedelta
from sqlalchemy import DateTime, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.types import CHAR, TypeDecorator
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class UniversalUuid(TypeDecorator):
    """跨数据库 UUID — PostgreSQL 用原生 UUID，SQLite 用 CHAR(36)，接受 str/UUID 绑定"""
    impl = CHAR(36)
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(PG_UUID())
        return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, uuid.UUID):
            return str(value) if dialect.name != "postgresql" else value
        if isinstance(value, str):
            return value if dialect.name != "postgresql" else uuid.UUID(value)
        return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, uuid.UUID):
            return value
        return uuid.UUID(value)


class Base(DeclarativeBase):
    type_annotation_map = {
        uuid.UUID: UniversalUuid,
    }


def utcnow():
    return datetime.now(timezone.utc).replace(tzinfo=None)


def new_uuid():
    return uuid.uuid4()


def beijing_today() -> date:
    return (datetime.now(timezone.utc) + timedelta(hours=8)).date()
