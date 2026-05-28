from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from app.config import get_settings

settings = get_settings()

# echo=True floods stdout with SQL in dev; only enable when explicitly debugging
_echo_sql = settings.app_debug and settings.app_env == "development"

engine = create_async_engine(
    settings.database_url,
    echo=_echo_sql,
    pool_size=10,
    max_overflow=20,
)

async_session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db() -> AsyncSession:
    async with async_session_factory() as session:
        try:
            yield session
        finally:
            await session.close()
