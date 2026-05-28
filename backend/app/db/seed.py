"""Seed script: create root admin user if not exists."""
import asyncio
import os

from sqlalchemy import select

from app.db.session import async_session_factory
from app.models import assessment, community, conversation, mood, user  # noqa: F401
from app.models.user import User
from app.services.auth_service import pwd_context, _hash_email


async def seed_root_user():
    email = os.getenv("ROOT_EMAIL", "root@mindwell.local")
    password = os.getenv("ROOT_PASSWORD", "RootAdmin123!")
    nickname = os.getenv("ROOT_NICKNAME", "Root")

    email_hash = _hash_email(email)

    async with async_session_factory() as db:
        result = await db.execute(
            select(User).where(User.email_hash == email_hash)
        )
        if result.scalars().first():
            print(f"Root user already exists (email_hash={email_hash[:12]}...)")
            return

        user = User(
            nickname=nickname,
            email_hash=email_hash,
            password_hash=pwd_context.hash(password),
            avatar_seed=nickname,
        )
        db.add(user)
        await db.commit()
        print(f"Root user created: {nickname} / {password}")


if __name__ == "__main__":
    asyncio.run(seed_root_user())
