"""
Pytest 全局配置 — 测试数据库 + 异步客户端 + 依赖覆盖
运行: pytest -v
"""
import asyncio
import os
import uuid
from typing import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

# 禁用 Redis 连接（测试环境不需要）
os.environ.setdefault("REDIS_URL", "redis://localhost:9999/0")
os.environ.setdefault("APP_ENV", "testing")
os.environ.setdefault("JWT_SECRET", "test-secret-for-testing-only")

# ── Test DB engine (SQLite 内存，无需本地 PostgreSQL) ──
TEST_DB_URL = "sqlite+aiosqlite:///./test.db"
test_engine = create_async_engine(TEST_DB_URL, echo=False)
TestSessionFactory = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)


@pytest.fixture
def rule_engine():
    """Safety RuleEngine fixture（旧测试兼容）"""
    from app.core.safety.rule_engine import RuleEngine
    return RuleEngine()


@pytest.fixture(scope="session", autouse=True)
def patch_external():
    """全局替换 Redis + LLM + Safety — 避免外部依赖"""
    from unittest.mock import AsyncMock, MagicMock, patch

    mock_redis = AsyncMock()
    mock_redis.ping.return_value = True

    # Mock LLM client
    mock_llm = AsyncMock()
    mock_llm.chat = AsyncMock(return_value="这是一条测试回复。")

    # Mock rule engine
    mock_engine = MagicMock()
    mock_engine.detect.return_value = []
    mock_engine.get_crisis_response.return_value = None

    with patch("app.db.redis.get_redis", return_value=mock_redis), \
         patch("app.db.redis.close_redis", new_callable=AsyncMock), \
         patch("app.core.llm.client.get_llm_client", return_value=mock_llm), \
         patch("app.core.safety.rule_engine.get_rule_engine", return_value=mock_engine):
        yield


@pytest.fixture(scope="session")
def event_loop():
    """session 级 event loop"""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    """每次测试前重建所有表"""
    from app.models.base import Base
    import app.models.user  # noqa
    import app.models.mood  # noqa
    import app.models.conversation  # noqa
    import app.models.assessment  # noqa
    import app.models.community  # noqa
    import app.models.user_memory  # noqa

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    # 插入测试用户
    async with TestSessionFactory() as session:
        from app.models.user import User
        test_user = User(
            id=uuid.UUID("a0000000-0000-0000-0000-000000000001"),
            nickname="testuser",
            email_hash="test_hash",
            password_hash="fake",
            is_active=True,
        )
        session.add(test_user)
        await session.commit()
    yield


@pytest_asyncio.fixture
async def db() -> AsyncGenerator[AsyncSession, None]:
    """每个测试独立的 DB session"""
    async with TestSessionFactory() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture
async def client(db: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """异步 HTTP 测试客户端（覆盖 get_db + get_current_user + get_redis）"""
    from app.main import app
    from app.db.session import get_db
    from app.db.redis import get_redis
    from app.dependencies import get_current_user

    TEST_USER_ID = uuid.UUID("a0000000-0000-0000-0000-000000000001")

    # 绕过 JWT 认证
    async def override_get_current_user():
        from app.models.user import User
        return User(
            id=TEST_USER_ID,
            nickname="testuser",
            email_hash="test_hash",
            password_hash="fake",
            is_active=True,
        )

    async def override_get_db():
        yield db

    async def override_get_redis():
        # 测试不需要 Redis，但某些中间件/服务可能调用
        class FakeRedis:
            async def get(self, key): return None
            async def set(self, key, val, ex=None): pass
            async def incr(self, key): return 1
            async def expire(self, key, ttl): pass
            async def delete(self, *keys): pass
            async def keys(self, pattern="*"): return []
            async def lrange(self, key, start, end): return []
            async def rpush(self, key, *vals): pass
            async def ltrim(self, key, start, end): pass
            async def hset(self, key, mapping): pass
            async def hget(self, key, field): return None
            async def close(self): pass
            async def ping(self): return True
        return FakeRedis()

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user
    app.dependency_overrides[get_redis] = override_get_redis

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def auth_client(db: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """已认证客户端（通过真实注册获取 token）"""
    from app.main import app
    from app.db.session import get_db

    async def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 注册用户
        email = f"test_{uuid.uuid4().hex[:8]}@test.com"
        resp = await ac.post("/api/v1/auth/register", json={
            "nickname": f"user_{uuid.uuid4().hex[:6]}",
            "email": email,
            "password": "Test123456!",
        })
        assert resp.status_code == 201, f"Register failed: {resp.text}"
        token = resp.json()["access_token"]
        ac.headers["Authorization"] = f"Bearer {token}"
        yield ac

    app.dependency_overrides.clear()


@pytest.fixture
def unique_email():
    """生成唯一邮箱"""
    return f"test_{uuid.uuid4().hex[:8]}@test.com"


@pytest.fixture
def unique_nickname():
    """生成唯一昵称"""
    return f"user_{uuid.uuid4().hex[:6]}"
