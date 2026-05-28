import asyncio

from app.db.session import engine
from app.models.base import Base

# Import models so SQLAlchemy registers all tables before create_all runs.
from app.models import assessment, community, conversation, mood, user, user_memory  # noqa: F401


async def init_db() -> None:
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)


if __name__ == "__main__":
    asyncio.run(init_db())
