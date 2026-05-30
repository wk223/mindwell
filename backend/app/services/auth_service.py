import hashlib
from datetime import datetime, timedelta, timezone

from jose import jwt, JWTError
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models.user import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
settings = get_settings()


def _hash_email(email: str) -> str:
    return hashlib.sha256(email.strip().lower().encode()).hexdigest()


def _create_token(subject: str, expires_delta: timedelta | None = None) -> str:
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=settings.jwt_expire_minutes))
    return jwt.encode(
        {"sub": subject, "exp": expire},
        settings.jwt_secret.get_secret_value(),
        algorithm=settings.jwt_algorithm,
    )


def decode_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.jwt_secret.get_secret_value(), algorithms=[settings.jwt_algorithm])
    except JWTError:
        return None


async def register_user(db: AsyncSession, nickname: str, email: str, password: str) -> User | None:
    email_hash = _hash_email(email)

    existing = await db.execute(
        select(User).where((User.nickname == nickname) | (User.email_hash == email_hash))
    )
    if existing.scalars().first():
        return None

    user = User(
        nickname=nickname,
        email_hash=email_hash,
        password_hash=pwd_context.hash(password),
        avatar_seed=nickname,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def authenticate_user(db: AsyncSession, email: str, password: str) -> User | None:
    email_hash = _hash_email(email)
    result = await db.execute(select(User).where(User.email_hash == email_hash))
    user = result.scalars().first()
    if not user or not pwd_context.verify(password, user.password_hash):
        return None
    return user


def create_access_token(user: User) -> str:
    return _create_token(str(user.id))


async def get_user_by_id(db: AsyncSession, user_id: str) -> User | None:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalars().first()
