import asyncio

from app.db.session import engine
from app.models.base import Base

# Import models so SQLAlchemy registers all tables before create_all runs.
# Order matters: dependencies first
import app.models.user_memory  # noqa: F401
import app.models.mood  # noqa: F401
import app.models.assessment  # noqa: F401
import app.models.community  # noqa: F401
import app.models.user  # noqa: F401 (refs MoodEntry, Assessment, Conversation)
import app.models.conversation  # noqa: F401 (refs User)

# Force immediate resolution of all forward references
Base.registry.configure()


async def init_db() -> None:
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)


if __name__ == "__main__":
    asyncio.run(init_db())
