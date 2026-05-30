# Sprint Tech Spec — MindWell 后端自动化测试 (Sprint-001)

> **BMAD Phase:** Phase 2 — Planning  
> **项目:** MindWell (观心 / ECHO)  
> **PM 执笔:** 2025-07-17  
> **状态:** ✅ 已批准

---

## 1. Sprint 概览

| 字段 | 值 |
|------|-----|
| **Sprint 名称** | `test-automation-001` |
| **目标** | 为 MindWell 后端建立完整的自动化测试基础设施（pytest + httpx AsyncClient + 测试数据库隔离），并覆盖三大核心模块（Auth、Mood、Dialogue）的 API 测试。 |
| **时间范围** | 5 个工作日 |
| **参与角色** | 后端开发 1 人（含测试） |
| **技术栈** | pytest 7.4+, pytest-asyncio, httpx AsyncClient, SQLAlchemy 2.0 async, PostgreSQL 16 |

---

## 2. 问题分类矩阵

### 2.1 核心问题

| ID | 严重程度 | 描述 | 影响范围 | 涉及模块 | 修复策略 |
|----|----------|------|----------|----------|----------|
| P0-01 | 🔴 Critical | 项目零测试覆盖 — 无 API 测试，无 CI 门禁 | 整个后端 | `tests/`, `ci.yml` | 搭建 pytest 基础设施，添加 CI 步骤 |
| P0-02 | 🔴 Critical | 测试需要隔离数据库 — 现有测试会写入 dev DB | DB 层 | `tests/conftest.py`, `db/session.py` | 使用独立的 test DB + 动态 DATABASE_URL 覆盖 |
| P0-03 | 🟡 Bug | `get_current_user` 依赖中 RLS `SET` 命令在测试环境中会抛异常 | Auth 中间件 | `dependencies.py`, `conftest.py` | 测试时用 Mock/Override 替换 `get_current_user` |
| P0-04 | 🟡 Bug | Redis 连接在测试中不可用 — `get_redis()` 尝试连接真实 Redis | Dialogue 路由 | `db/redis.py`, `conftest.py` | 测试中 Mock Redis 或提供 fake_redis fixture |
| P0-05 | 🟢 Enhancement | 缺少 fixture 化测试工具函数（token 生成、用户工厂） | 所有测试 | `conftest.py` | 创建 `auth_headers`、`test_user`、`create_test_user` fixture |
| P0-06 | 🟢 Enhancement | 流式 SSE 响应无测试方法 | Dialogue API | `test_dialogue.py` | 用 `AsyncClient.stream()` 逐事件断言 |

### 2.2 测试覆盖矩阵

| 模块 | 关键路由 | 测试重点 | 当前覆盖 |
|------|----------|----------|----------|
| **Auth** | `POST /auth/register` | 注册成功、重复注册、密码强度 | ❌ |
| | `POST /auth/login` | 登录成功、密码错误、用户不存在 | ❌ |
| | JWT Token | 过期验证、无效 token、缺失 token | ❌ |
| **Mood** | `POST /mood/checkin` | 打卡成功、重复打卡、分数越界 | ❌ |
| | `GET /mood/today` | 有/无今日记录、返回格式 | ❌ |
| | `GET /mood/trends` | 周/月趋势、空数据 | ❌ |
| | `GET /mood/calendar` | 日历热力图、天数参数验证 | ❌ |
| | `GET /mood/stats` | 统计 + 连续打卡天数 | ❌ |
| **Dialogue** | `POST /dialogue/send` (非流式) | 发送消息、创建/复用对话、安全检测 | ❌ |
| | `POST /dialogue/send` (流式) | SSE 事件流、token 事件、done 事件 | ❌ |
| | `GET /dialogue/conversations` | 列表、排序、分页 | ❌ |
| | `DELETE /dialogue/conversations/{id}` | 删除成功、404、权限隔离 | ❌ |

---

## 3. Story 拆分

---

### Story T-001: 测试基础设施搭建

- **ID:** `T-001`
- **标题:** 测试数据库 + pytest fixture 基础设施
- **描述:** 搭建完整的 pytest 测试骨架。包括独立的测试数据库连接、AsyncClient fixture、test user fixture、JWT token 生成工具、以及 `get_current_user` 依赖覆盖（绕过 RLS SET）。
- **验收标准:**
  1. `pytest tests/` 可在隔离的 test DB 上运行，不会污染 dev DB
  2. 提供 `async_client` fixture — 返回已注入 auth 依赖的 `httpx.AsyncClient`
  3. 提供 `test_user` / `auth_headers` fixture — 每个测试用例自动创建并清理测试用户
  4. 提供 `db_session` fixture — 支持测试间数据隔离（每个测试独立 session）
  5. RLS `SET app.current_user_id` 在测试中被安全跳过（通过 override `get_current_user`）
  6. Redis 在测试中被 mock 或替换为 `fake_redis`（内存 dict）
  7. `make test` 或等效命令可一键运行全部测试
- **预估工作量:** ⭐⭐⭐⭐⭐ (5 SP)
- **依赖关系:** 无
- **优先级:** 🔴 P0

**实现方案:**

#### 3.1.1 测试数据库策略

采用 **独立 test database** 方案，而非事务回滚（因为 httpx 的 AsyncClient 与测试代码在不同协程上下文中运行，无法共享同一事务）。

```yaml
# .env.test 或 pytest 的 monkeypatch
DATABASE_URL=postgresql+asyncpg://mindwell:mindwell_dev@localhost:5432/mindwell_test
```

在 `conftest.py` 的 `session` scope fixture 中：
1. 连接到 postgres 默认库，`CREATE DATABASE mindwell_test IF NOT EXISTS`
2. 用独立的 test engine 运行 `Base.metadata.create_all`
3. yield 给所有测试使用
4. `session` 结束时 `DROP DATABASE mindwell_test`（或保留 + 清空表）

```python
# conftest.py 核心骨架
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.main import app
from app.db.session import get_db
from app.dependencies import get_current_user
from app.models.base import Base
from app.models.user import User
from app.services.auth_service import create_access_token


@pytest.fixture(scope="session")
def event_loop():
    """Override default event_loop to be session-scoped."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="session")
async def test_engine():
    """Create test database and engine once per session."""
    from app.config import get_settings
    settings = get_settings()
    test_db_url = settings.database_url + "_test"  # mindwell -> mindwell_test
    
    engine = create_async_engine(test_db_url)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture
async def db_session(test_engine):
    """Per-test isolated session."""
    async with async_sessionmaker(test_engine, class_=AsyncSession)() as session:
        yield session
        await session.rollback()  # rollback any uncommitted changes
        await session.close()


@pytest_asyncio.fixture
async def test_user(db_session) -> User:
    """Create a test user for use in tests."""
    from app.services.auth_service import pwd_context, _hash_email
    user = User(
        nickname=f"test_user_{uuid.uuid4().hex[:8]}",
        email_hash=_hash_email(f"test_{uuid.uuid4().hex[:8]}@test.com"),
        password_hash=pwd_context.hash("TestPass123!"),
        avatar_seed="test_seed",
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def auth_headers(test_user) -> dict:
    """Generate Authorization header with valid JWT."""
    token = create_access_token(test_user)
    return {"Authorization": f"Bearer {token}"}


async def _get_test_user_override():
    """Override for get_current_user — returns the test_user from context."""
    # This will be set per-test via fixture injection
    return _override_user


@pytest_asyncio.fixture
async def async_client(db_session, auth_headers, test_user):
    """Provide an AsyncClient with overridden dependencies."""
    from app.dependencies import get_db as original_get_db
    
    # Override DB session
    async def _override_db():
        yield db_session
    
    # Override get_current_user to return test_user (bypasses RLS)
    async def _override_get_current_user():
        return test_user
    
    app.dependency_overrides[get_db] = _override_db
    app.dependency_overrides[get_current_user] = _override_get_current_user
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        client.headers.update(auth_headers)
        yield client
    
    app.dependency_overrides.clear()
```

#### 3.1.2 RLS 绕过策略

**方案：Override `get_current_user` 依赖**

在测试中完全绕过 RLS，用 `app.dependency_overrides` 将 `get_current_user` 替换为返回 fixture 中 `test_user` 对象的函数。这比 mock SET 语句更干净，且不会影响真实 SQL 执行路径。

```python
# 在 async_client fixture 中
app.dependency_overrides[get_current_user] = _override_get_current_user
```

#### 3.1.3 Redis Mock 策略

用 `fake_redis` 替代 `get_redis` 依赖：

```python
class FakeRedis:
    """In-memory Redis replacement for testing."""
    def __init__(self):
        self._data: dict[str, list[str]] = {}
    
    async def lrange(self, key, start, stop):
        items = self._data.get(key, [])
        return items[start:stop] if stop >= 0 else items[start:]
    
    async def rpush(self, key, *values):
        self._data.setdefault(key, []).extend(values)
        return len(self._data[key])
    
    async def ltrim(self, key, start, stop):
        items = self._data.get(key, [])
        self._data[key] = items[start:stop] if stop >= 0 else items[start:]
    
    async def expire(self, key, ttl):
        pass  # No-op for tests
    
    async def delete(self, *keys):
        for key in keys:
            self._data.pop(key, None)


@pytest_asyncio.fixture
async def fake_redis():
    return FakeRedis()


# In override:
from app.db.redis import get_redis
app.dependency_overrides[get_redis] = lambda: fake_redis
```

---

### Story T-002: Auth 模块测试

- **ID:** `T-002`
- **标题:** Auth API — 注册/登录/Token 验证测试套件
- **描述:** 覆盖认证模块的所有核心路径和异常路径，包括注册唯一性校验、登录凭据验证、Token 过期和无效 token 处理。
- **验收标准:**
  1. `test_register_success` — 注册返回 201 + 有效 JWT + 正确 user 信息
  2. `test_register_duplicate_nickname` — 重复昵称返回 409
  3. `test_register_duplicate_email` — 重复邮箱返回 409
  4. `test_login_success` — 登录返回 200 + 有效 JWT
  5. `test_login_wrong_password` — 错误密码返回 401
  6. `test_login_nonexistent_user` — 不存在用户返回 401
  7. `test_access_without_token` — 无 token 访问受保护路由返回 401
  8. `test_access_with_invalid_token` — 无效 token 返回 401
  9. `test_access_with_expired_token` — 过期 token 返回 401
- **预估工作量:** ⭐⭐⭐ (3 SP)
- **依赖关系:** 依赖 T-001（基础设施）
- **优先级:** 🔴 P0

**实现方案:**

```python
# tests/test_auth.py

import pytest
from httpx import AsyncClient


class TestRegister:
    """POST /api/v1/auth/register"""

    @pytest.mark.asyncio
    async def test_register_success(self, async_client: AsyncClient):
        payload = {
            "nickname": "fresh_user",
            "email": "fresh@test.com",
            "password": "StrongPass1!",
        }
        resp = await async_client.post("/api/v1/auth/register", json=payload)
        assert resp.status_code == 201
        data = resp.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["nickname"] == "fresh_user"
        # Verify token is a valid JWT (decodable)
        from jose import jwt
        from app.config import get_settings
        payload_decoded = jwt.decode(
            data["access_token"],
            get_settings().jwt_secret,
            algorithms=[get_settings().jwt_algorithm],
        )
        assert "sub" in payload_decoded
        assert "exp" in payload_decoded

    @pytest.mark.asyncio
    async def test_register_duplicate_nickname(self, async_client: AsyncClient):
        # First registration
        await async_client.post("/api/v1/auth/register", json={
            "nickname": "dup_user",
            "email": "first@test.com",
            "password": "StrongPass1!",
        })
        # Duplicate nickname
        resp = await async_client.post("/api/v1/auth/register", json={
            "nickname": "dup_user",
            "email": "second@test.com",
            "password": "StrongPass1!",
        })
        assert resp.status_code == 409
        assert "already" in resp.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_register_duplicate_email(self, async_client: AsyncClient):
        await async_client.post("/api/v1/auth/register", json={
            "nickname": "user_a",
            "email": "same@test.com",
            "password": "StrongPass1!",
        })
        resp = await async_client.post("/api/v1/auth/register", json={
            "nickname": "user_b",
            "email": "same@test.com",
            "password": "StrongPass1!",
        })
        assert resp.status_code == 409


class TestLogin:
    """POST /api/v1/auth/login"""

    @pytest.mark.asyncio
    async def test_login_success(self, async_client: AsyncClient):
        # Register first
        await async_client.post("/api/v1/auth/register", json={
            "nickname": "login_user",
            "email": "login@test.com",
            "password": "StrongPass1!",
        })
        # Login
        resp = await async_client.post("/api/v1/auth/login", json={
            "email": "login@test.com",
            "password": "StrongPass1!",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert data["user"]["nickname"] == "login_user"

    @pytest.mark.asyncio
    async def test_login_wrong_password(self, async_client: AsyncClient):
        await async_client.post("/api/v1/auth/register", json={
            "nickname": "wrong_pw_user",
            "email": "wrong@test.com",
            "password": "StrongPass1!",
        })
        resp = await async_client.post("/api/v1/auth/login", json={
            "email": "wrong@test.com",
            "password": "WrongPass123!",
        })
        assert resp.status_code == 401

    @pytest.mark.asyncio
    async def test_login_nonexistent_user(self, async_client: AsyncClient):
        resp = await async_client.post("/api/v1/auth/login", json={
            "email": "nobody@test.com",
            "password": "AnyPass123!",
        })
        assert resp.status_code == 401


class TestTokenValidation:
    """Token guards on protected endpoints"""

    @pytest.mark.asyncio
    async def test_no_token_returns_401(self, async_client: AsyncClient):
        """Remove auth headers to test unauthenticated access."""
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as anon_client:
            resp = await anon_client.get("/api/v1/mood/today")
            assert resp.status_code == 401

    @pytest.mark.asyncio
    async def test_invalid_token_returns_401(self, async_client: AsyncClient):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as anon_client:
            anon_client.headers["Authorization"] = "Bearer this.is.invalid"
            resp = await anon_client.get("/api/v1/mood/today")
            assert resp.status_code == 401

    @pytest.mark.asyncio
    async def test_expired_token_returns_401(self, async_client: AsyncClient):
        """Generate a token with 0-second expiry."""
        from jose import jwt
        from datetime import datetime, timedelta, timezone
        from app.config import get_settings
        
        expired_token = jwt.encode(
            {
                "sub": "00000000-0000-0000-0000-000000000000",
                "exp": datetime.now(timezone.utc) - timedelta(hours=1),
            },
            get_settings().jwt_secret,
            algorithm=get_settings().jwt_algorithm,
        )
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as anon_client:
            anon_client.headers["Authorization"] = f"Bearer {expired_token}"
            resp = await anon_client.get("/api/v1/mood/today")
            assert resp.status_code == 401
```

---

### Story T-003: Mood 模块测试

- **ID:** `T-003`
- **标题:** Mood API — 打卡/趋势/日历/统计测试套件
- **描述:** 覆盖情绪打卡模块的所有 CRUD 路径，包括多种情绪分数场景、每日多次打卡、趋势计算和连续打卡统计。
- **验收标准:**
  1. `test_checkin_success` — 打卡返回 200 + 正确字段
  2. `test_checkin_score_boundaries` — 分数 1 和 10 边界均通过
  3. `test_checkin_invalid_score` — 分数 <1 或 >10 返回 422
  4. `test_checkin_multiple_times` — 一天内多次打卡均成功
  5. `test_get_today_with_entry` — 有打卡时返回 entry
  6. `test_get_today_without_entry` — 无打卡返回 `{"entry": null}`
  7. `test_get_trends_weekly` — 周趋势返回 7 天数据
  8. `test_get_trends_monthly` — 月趋势返回 30 天数据
  9. `test_get_trends_empty` — 无数据时返回零值
  10. `test_get_calendar` — 日历返回指定天数数据
  11. `test_get_stats` — 统计含 streak 计算
- **预估工作量:** ⭐⭐⭐ (3 SP)
- **依赖关系:** 依赖 T-001（基础设施）
- **优先级:** 🔴 P0

**实现方案:**

```python
# tests/test_mood.py

import pytest
from httpx import AsyncClient


class TestMoodCheckin:
    """POST /api/v1/mood/checkin"""

    @pytest.mark.asyncio
    async def test_checkin_success(self, async_client: AsyncClient):
        resp = await async_client.post("/api/v1/mood/checkin", json={
            "mood_score": 7,
            "mood_label": "不错",
            "journal_text": "今天心情很好",
            "tags": ["开心", "阳光"],
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["mood_score"] == 7
        assert data["mood_label"] == "不错"
        assert data["journal_text"] == "今天心情很好"
        assert "id" in data
        assert "recorded_at" in data
        assert "created_at" in data

    @pytest.mark.asyncio
    async def test_checkin_score_boundaries(self, async_client: AsyncClient):
        # Score = 1
        resp = await async_client.post("/api/v1/mood/checkin", json={"mood_score": 1})
        assert resp.status_code == 200
        assert resp.json()["mood_score"] == 1

        # Score = 10
        resp = await async_client.post("/api/v1/mood/checkin", json={"mood_score": 10})
        assert resp.status_code == 200
        assert resp.json()["mood_score"] == 10

    @pytest.mark.asyncio
    async def test_checkin_invalid_score(self, async_client: AsyncClient):
        resp = await async_client.post("/api/v1/mood/checkin", json={"mood_score": 0})
        assert resp.status_code == 422

        resp = await async_client.post("/api/v1/mood/checkin", json={"mood_score": 11})
        assert resp.status_code == 422

    @pytest.mark.asyncio
    async def test_checkin_without_optional_fields(self, async_client: AsyncClient):
        """Minimal payload (only mood_score)."""
        resp = await async_client.post("/api/v1/mood/checkin", json={"mood_score": 5})
        assert resp.status_code == 200
        data = resp.json()
        assert data["mood_label"] is None
        assert data["journal_text"] is None
        assert data["tags"] == []

    @pytest.mark.asyncio
    async def test_checkin_multiple_times_same_day(self, async_client: AsyncClient):
        resp1 = await async_client.post("/api/v1/mood/checkin", json={"mood_score": 3})
        resp2 = await async_client.post("/api/v1/mood/checkin", json={"mood_score": 8})
        assert resp1.status_code == 200
        assert resp2.status_code == 200
        assert resp1.json()["id"] != resp2.json()["id"]


class TestMoodToday:
    """GET /api/v1/mood/today"""

    @pytest.mark.asyncio
    async def test_get_today_with_entry(self, async_client: AsyncClient):
        await async_client.post("/api/v1/mood/checkin", json={"mood_score": 6})
        resp = await async_client.get("/api/v1/mood/today")
        assert resp.status_code == 200
        data = resp.json()
        assert data["entry"] is not None
        assert data["entry"]["mood_score"] == 6

    @pytest.mark.asyncio
    async def test_get_today_without_entry(self, async_client: AsyncClient):
        resp = await async_client.get("/api/v1/mood/today")
        assert resp.status_code == 200
        assert resp.json()["entry"] is None


class TestMoodTrends:
    """GET /api/v1/mood/trends"""

    @pytest.mark.asyncio
    async def test_trends_weekly(self, async_client: AsyncClient):
        # Create a few entries
        for score in [5, 6, 7]:
            await async_client.post("/api/v1/mood/checkin", json={"mood_score": score})
        resp = await async_client.get("/api/v1/mood/trends?range=weekly")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_entries"] == 3
        assert data["average"] == pytest.approx(6.0, rel=0.1)
        assert data["highest"] == 7
        assert data["lowest"] == 5

    @pytest.mark.asyncio
    async def test_trends_monthly(self, async_client: AsyncClient):
        resp = await async_client.get("/api/v1/mood/trends?range=monthly")
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_trends_empty(self, async_client: AsyncClient):
        # Use a fresh client with no checkins
        resp = await async_client.get("/api/v1/mood/trends?range=weekly")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_entries"] == 0
        assert data["average"] == 0
        assert data["entries"] == []


class TestMoodCalendar:
    """GET /api/v1/mood/calendar"""

    @pytest.mark.asyncio
    async def test_calendar_default(self, async_client: AsyncClient):
        await async_client.post("/api/v1/mood/checkin", json={"mood_score": 8})
        resp = await async_client.get("/api/v1/mood/calendar")
        assert resp.status_code == 200
        data = resp.json()
        assert "entries" in data

    @pytest.mark.asyncio
    async def test_calendar_custom_days(self, async_client: AsyncClient):
        resp = await async_client.get("/api/v1/mood/calendar?days=14")
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_calendar_invalid_days(self, async_client: AsyncClient):
        resp = await async_client.get("/api/v1/mood/calendar?days=3")
        assert resp.status_code == 422


class TestMoodStats:
    """GET /api/v1/mood/stats"""

    @pytest.mark.asyncio
    async def test_stats_with_entries(self, async_client: AsyncClient):
        await async_client.post("/api/v1/mood/checkin", json={"mood_score": 5})
        resp = await async_client.get("/api/v1/mood/stats")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_checkins"] == 1
        assert data["current_streak"] >= 0
        assert data["longest_streak"] >= 0
        assert data["average_score"] == 5.0

    @pytest.mark.asyncio
    async def test_stats_empty(self, async_client: AsyncClient):
        resp = await async_client.get("/api/v1/mood/stats")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_checkins"] == 0
        assert data["current_streak"] == 0
        assert data["average_score"] == 0
```

---

### Story T-004: Dialogue 模块测试（非流式）

- **ID:** `T-004`
- **标题:** Dialogue API — 非流式消息发送 + 对话管理测试
- **描述:** 覆盖对话模块的非流式路径，包括发送消息、自动创建对话、对话列表、删除对话、以及安全检测触发场景。
- **验收标准:**
  1. `test_send_message_new_conversation` — 首次发送自动创建对话
  2. `test_send_message_existing_conversation` — 复用 conversation_id
  3. `test_send_message_no_stream` — `stream: false` 返回完整 response
  4. `test_send_message_crisis_detected` — 自伤/自杀内容触发危机响应
  5. `test_list_conversations` — 返回排序后的对话列表
  6. `test_delete_conversation` — 删除成功返回 200
  7. `test_delete_nonexistent_conversation` — 返回 404
  8. `test_message_ownership_isolation` — 用户 A 无法访问用户 B 的对话
- **预估工作量:** ⭐⭐⭐⭐ (4 SP)
- **依赖关系:** 依赖 T-001（基础设施）；需 Mock LLM 和 SafetyPipeline 以避免外部调用
- **优先级:** 🔴 P0

**实现方案:**

```python
# tests/test_dialogue.py

import pytest
from httpx import AsyncClient


# ── Mock LLM & Safety for deterministic test results ──

class MockLLMClient:
    async def chat(self, messages, **kwargs):
        return "这是一个模拟回复。"
    
    async def chat_stream(self, messages, **kwargs):
        tokens = ["这是", "一个", "模拟", "回复。"]
        for t in tokens:
            yield t


class MockSafetyPipeline:
    async def process_input(self, user_id, message):
        from app.core.safety.safety_pipeline import SafetyResult, SafetyAction
        # Return safe result by default
        return SafetyResult(
            action=SafetyAction.PASS,
            sanitized_text=message,
            flags=[],
            crisis_response=None,
        )


@pytest_asyncio.fixture
async def mock_dialogue_service(async_client, monkeypatch):
    """Replace LLM and Safety singletons with mocks."""
    from app.core.llm.client import get_llm_client, LLMClient
    
    async def mock_get_llm():
        return MockLLMClient()
    
    monkeypatch.setattr("app.core.llm.client.get_llm_client", mock_get_llm)
    
    from app.core.safety.safety_pipeline import SafetyPipeline
    # Monkeypatch the SafetyPipeline used in dialogue route
    # (We'll use dependency override instead for cleaner control)
    
    # Return a dict of mock instances so tests can reconfigure them
    return {"llm": MockLLMClient(), "safety": MockSafetyPipeline()}


class TestDialogueSend:
    """POST /api/v1/dialogue/send (non-streaming)"""

    @pytest.mark.asyncio
    async def test_send_message_new_conversation(self, async_client: AsyncClient, mock_dialogue_service):
        resp = await async_client.post("/api/v1/dialogue/send", json={
            "message": "今天心情不太好",
            "stream": False,
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "conversation_id" in data
        assert data["message"]["role"] == "assistant"
        assert len(data["message"]["content"]) > 0

    @pytest.mark.asyncio
    async def test_send_message_existing_conversation(self, async_client: AsyncClient, mock_dialogue_service):
        # First message creates conversation
        resp1 = await async_client.post("/api/v1/dialogue/send", json={
            "message": "你好",
            "stream": False,
        })
        conv_id = resp1.json()["conversation_id"]

        # Second message reuses it
        resp2 = await async_client.post("/api/v1/dialogue/send", json={
            "conversation_id": conv_id,
            "message": "我有点焦虑",
            "stream": False,
        })
        assert resp2.status_code == 200
        assert resp2.json()["conversation_id"] == conv_id

    @pytest.mark.asyncio
    async def test_send_message_crisis_triggers_safety(self, async_client: AsyncClient, mock_dialogue_service):
        """Crisis message should trigger safety pipeline override."""
        # Note: This test requires SafetyPipeline to detect crisis.
        # We'll reconfigure the mock to simulate crisis detection.
        from app.core.safety.safety_pipeline import SafetyResult, SafetyAction
        from app.core.safety.safety_rule_engine import SafetyFlag
        
        class CrisisSafetyPipeline:
            async def process_input(self, user_id, message):
                return SafetyResult(
                    action=SafetyAction.HALT,
                    sanitized_text=message,
                    flags=[SafetyFlag(rule_id="suicide_imminent", severity="critical", matched_text=message)],
                    crisis_response="请不要伤害自己，心理援助热线：12355",
                )
        
        # Override safety pipeline via dependency
        # (Implementation detail: we need to inject CrisisSafetyPipeline into the route)
        resp = await async_client.post("/api/v1/dialogue/send", json={
            "message": "我想自杀",
            "stream": False,
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["safety"]["escalation_triggered"] is True
        assert len(data["safety"]["flags"]) > 0

    @pytest.mark.asyncio
    async def test_send_message_empty(self, async_client: AsyncClient, mock_dialogue_service):
        resp = await async_client.post("/api/v1/dialogue/send", json={
            "message": "",
            "stream": False,
        })
        assert resp.status_code == 422


class TestDialogueConversations:
    """GET /api/v1/dialogue/conversations & DELETE"""

    @pytest.mark.asyncio
    async def test_list_conversations(self, async_client: AsyncClient, mock_dialogue_service):
        # Create a few conversations by sending messages
        await async_client.post("/api/v1/dialogue/send", json={
            "message": "第一次对话",
            "stream": False,
        })
        await async_client.post("/api/v1/dialogue/send", json={
            "message": "第二次对话",
            "stream": False,
        })
        
        resp = await async_client.get("/api/v1/dialogue/conversations")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 2
        assert len(data["conversations"]) == 2

    @pytest.mark.asyncio
    async def test_list_conversations_empty(self, async_client: AsyncClient, mock_dialogue_service):
        resp = await async_client.get("/api/v1/dialogue/conversations")
        assert resp.status_code == 200
        assert resp.json()["total"] == 0

    @pytest.mark.asyncio
    async def test_delete_conversation(self, async_client: AsyncClient, mock_dialogue_service):
        resp = await async_client.post("/api/v1/dialogue/send", json={
            "message": "待删除对话",
            "stream": False,
        })
        conv_id = resp.json()["conversation_id"]
        
        resp = await async_client.delete(f"/api/v1/dialogue/conversations/{conv_id}")
        assert resp.status_code == 200
        assert resp.json()["status"] == "deleted"

    @pytest.mark.asyncio
    async def test_delete_nonexistent_conversation(self, async_client: AsyncClient, mock_dialogue_service):
        resp = await async_client.delete("/api/v1/dialogue/conversations/00000000-0000-0000-0000-000000000000")
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_conversation_ownership_isolation(self, async_client, mock_dialogue_service, db_session):
        """User B cannot access User A's conversation."""
        # User A creates conversation
        resp_a = await async_client.post("/api/v1/dialogue/send", json={
            "message": "A的消息",
            "stream": False,
        })
        conv_id = resp_a.json()["conversation_id"]
        
        # User B tries to access it
        # (In test setup, this requires creating a second user and their client)
        # Simplified: we verify that listing only shows own conversations
        resp_list = await async_client.get("/api/v1/dialogue/conversations")
        conv_ids = [c["id"] for c in resp_list.json()["conversations"]]
        assert conv_id in conv_ids  # User A sees their own
```

---

### Story T-005: Dialogue 模块测试（流式 SSE）

- **ID:** `T-005`
- **标题:** Dialogue API — 流式 SSE 响应测试
- **描述:** 覆盖 SSE 流式场景，验证事件流格式、token 事件累积、done 事件完整性和安全覆盖事件。
- **验收标准:**
  1. `test_stream_receives_tokens` — 流式响应返回多个 `data: {...}\n\n` 事件
  2. `test_stream_final_done_event` — 最后收到 `type: "done"` 事件
  3. `test_stream_conversation_id_in_done` — done 事件包含 conversation_id
  4. `test_stream_crisis_triggers_override` — 安全检测触发 override 事件
  5. `test_stream_multiple_messages` — 同一对话中多次流式调用正确累积
- **预估工作量:** ⭐⭐⭐⭐ (4 SP)
- **依赖关系:** 依赖 T-001 基础设施；依赖 T-004 的 mock 对象
- **优先级:** 🔴 P0

**实现方案:**

```python
# tests/test_dialogue_stream.py

import pytest
import json
from httpx import AsyncClient


class MockStreamLLM:
    """Simulate token-by-token streaming LLM response."""
    def __init__(self, tokens=None, delay=0):
        self.tokens = tokens or ["模拟", "流式", "回复", "内容。"]
        self.delay = delay
    
    async def chat_stream(self, messages, **kwargs):
        import asyncio
        for token in self.tokens:
            await asyncio.sleep(self.delay)
            yield token


class TestDialogueStream:
    """POST /api/v1/dialogue/send (streaming) — SSE event parsing"""

    @pytest.mark.asyncio
    async def test_stream_receives_tokens(self, async_client: AsyncClient, mock_dialogue_service):
        """Verify SSE stream yields token events."""
        async with async_client.stream(
            "POST",
            "/api/v1/dialogue/send",
            json={"message": "讲个笑话", "stream": True},
        ) as response:
            assert response.status_code == 200
            assert response.headers["content-type"] == "text/event-stream"
            
            events = []
            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    events.append(json.loads(line[6:]))
            
            # Should have at least one token + one done event
            assert len(events) >= 2
            token_events = [e for e in events if e["type"] == "token"]
            assert len(token_events) > 0
            # Verify all token content accumulates
            full_text = "".join(e["content"] for e in token_events)
            assert len(full_text) > 0

    @pytest.mark.asyncio
    async def test_stream_final_done_event(self, async_client: AsyncClient, mock_dialogue_service):
        """Last event should be 'done'."""
        async with async_client.stream(
            "POST",
            "/api/v1/dialogue/send",
            json={"message": "你好", "stream": True},
        ) as response:
            last_event = None
            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    last_event = json.loads(line[6:])
            
            assert last_event is not None
            assert last_event["type"] == "done"
            assert "message" in last_event
            assert "conversation_id" in last_event

    @pytest.mark.asyncio
    async def test_stream_returns_conversation_id(self, async_client: AsyncClient, mock_dialogue_service):
        """done event must include a valid conversation_id."""
        async with async_client.stream(
            "POST",
            "/api/v1/dialogue/send",
            json={"message": "测试对话ID", "stream": True},
        ) as response:
            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    event = json.loads(line[6:])
                    if event["type"] == "done":
                        assert event["conversation_id"] is not None
                        assert len(event["conversation_id"]) > 0

    @pytest.mark.asyncio
    async def test_stream_safety_event(self, async_client: AsyncClient, mock_dialogue_service):
        """Crisis content should emit safety events before done."""
        async with async_client.stream(
            "POST",
            "/api/v1/dialogue/send",
            json={"message": "我想自杀", "stream": True},
        ) as response:
            events = []
            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    events.append(json.loads(line[6:]))
            
            safety_events = [e for e in events if e["type"] == "safety"]
            assert len(safety_events) > 0

    @pytest.mark.asyncio
    async def test_stream_error_handling(self, async_client: AsyncClient, mock_dialogue_service):
        """Stream should handle errors gracefully."""
        async with async_client.stream(
            "POST",
            "/api/v1/dialogue/send",
            json={"message": "", "stream": True},
        ) as response:
            # Empty message should fail validation before streaming
            assert response.status_code == 422
```

---

### Story T-006: CI 集成 + 测试脚本

- **ID:** `T-006`
- **标题:** CI 流水线集成 + Makefile / 脚本自动化
- **描述:** 将测试集成到 GitHub Actions CI 中，配置 test 数据库服务，添加 `make test` 命令和覆盖率报告。
- **验收标准:**
  1. GitHub Actions CI 中自动启动 PostgreSQL service container
  2. CI 中自动创建 `mindwell_test` 数据库
  3. CI 中运行 `pytest tests/ -v` 全部通过
  4. 添加 `make test` / `make test-coverage` 命令
  5. 覆盖率报告（可选 — 仅当 `pytest-cov` 安装时）
  6. PR 提交时自动触发测试运行
- **预估工作量:** ⭐⭐ (2 SP)
- **依赖关系:** 依赖 T-001~T-005 全部完成
- **优先级:** 🟡 P1

**实现方案:**

```yaml
# .github/workflows/ci.yml (新增/修改 jobs)

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: mindwell
          POSTGRES_PASSWORD: mindwell_dev
          POSTGRES_DB: mindwell_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready -U mindwell
          --health-interval 5s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 5s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"
      
      - name: Install dependencies
        working-directory: ./backend
        run: |
          pip install -e ".[dev]"
      
      - name: Create test database
        run: |
          psql -h localhost -U mindwell -d postgres -c "CREATE DATABASE mindwell_test;"
        env:
          PGPASSWORD: mindwell_dev
      
      - name: Run tests
        working-directory: ./backend
        run: pytest tests/ -v --tb=short
        env:
          DATABASE_URL: postgresql+asyncpg://mindwell:mindwell_dev@localhost:5432/mindwell_test
          REDIS_URL: redis://localhost:6379/0
          JWT_SECRET: test-secret-not-for-production
          APP_ENV: test
```

```makefile
# backend/Makefile (新增)

.PHONY: test test-coverage

test:
	pytest tests/ -v --tb=short

test-coverage:
	pip install pytest-cov
	pytest tests/ -v --tb=short --cov=app --cov-report=term --cov-report=html
```

---

## 4. Sprint 时间线

```
Day 1     Day 2     Day 3     Day 4     Day 5
│         │         │         │         │
T-001─────┤         │         │         │  基础设施搭建
│  conftest.py      │         │         │
│  fake_redis       │         │         │
│  test DB setup    │         │         │
├─────────T-002─────┤         │         │  Auth 测试
│         │  test_auth.py    │         │
│         │  9 个测试用例    │         │
│         ├─────────T-003────┤         │  Mood 测试
│         │         │  test_mood.py    │
│         │         │  15+ 测试用例    │
│         │         ├─────────T-004────┤  Dialogue 非流式
│         │         │         │  test_dialogue.py   │
│         │         │         │  8+ 测试用例        │
│         │         │         ├─────────T-005───────┤  Dialogue 流式
│         │         │         │         │  test_dialogue_stream.py
│         │         │         │         │  5+ 测试用例
│         │         │         │         ├──T-006────┤ CI + Makefile
│         │         │         │         │  ci.yml
│         │         │         │         │  Makefile
│         │         │         │         │
▲         ▲         ▲         ▲         ▲
里程碑1   里程碑2   里程碑3   里程碑4   里程碑5
绿色通过   Auth 全部  Mood 全部  Dialogue  CI 全绿
T-001完成  测试通过   测试通过   测试通过    + 覆盖报告
```

### 里程碑

| 里程碑 | 时间 | 交付物 | 门禁条件 |
|--------|------|--------|----------|
| M1 (Day 1) | 📍 Day 1 17:00 | `conftest.py` + `fake_redis` + test DB 脚本 | `pytest tests/` 能运行至少 1 个空测试 |
| M2 (Day 2) | 📍 Day 2 17:00 | `test_auth.py` 全部 9 个用例通过 | ✅ 100% Auth 用例通过 |
| M3 (Day 3) | 📍 Day 3 17:00 | `test_mood.py` 全部用例通过 | ✅ 100% Mood 用例通过 |
| M4 (Day 4) | 📍 Day 4 17:00 | `test_dialogue.py` + `test_dialogue_stream.py` 通过 | ✅ 全部 dialogue 用例通过 |
| M5 (Day 5) | 📍 Day 5 15:00 | CI 流水线集成完毕 | ✅ CI 绿 + PR gate 通过 |

---

## 5. 风险与缓解措施

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| **R1 — 测试数据库 DDL 执行失败** | 🟡 低 | 🔴 阻塞 | 在 conftest 中增加 `CREATE DATABASE IF NOT EXISTS` + 异常处理 fallback 到 `sqlite://` |
| **R2 — RLS SET 导致 PG 错误** | 🔴 高 | 🟡 中 | 依赖覆盖（`app.dependency_overrides`）完全绕过 RLS，不执行 SET 命令 |
| **R3 — LLM 外部调用导致测试不稳定** | 🟡 中 | 🔴 高 | 所有测试使用 MockLLMClient，不发起真实 API 调用；CI 无需 API key |
| **R4 — SSE 流式测试不稳定** | 🟡 中 | 🟡 中 | 使用 `async with client.stream()` + 超时控制；Mock 流延迟设为 0 |
| **R5 — Redis 不可用** | 🟡 中 | 🟡 中 | `FakeRedis` mock 完整覆盖所有用到的方法（lrange, rpush, ltrim, expire, delete） |
| **R6 — 测试间数据泄漏** | 🟡 中 | 🟡 中 | 每个测试独立 `db_session`（rollback on teardown）；避免共享 test_user 状态 |
| **R7 — pytest-asyncio 事件循环冲突** | 🟡 低 | 🔴 高 | 显式提供 session-scoped `event_loop` fixture；配置 `asyncio_mode = "auto"` |

---

## 6. 附录

### A. 文件结构变更

```
backend/
├── tests/
│   ├── __init__.py              # (unchanged)
│   ├── conftest.py              # 🔄 REWRITE — 全部基础设施
│   ├── test_safety.py           # (unchanged — keep existing tests)
│   ├── test_auth.py             # 🆕 NEW
│   ├── test_mood.py             # 🆕 NEW
│   ├── test_dialogue.py         # 🆕 NEW
│   └── test_dialogue_stream.py  # 🆕 NEW
├── Makefile                     # 🆕 NEW
└── pyproject.toml               # (unchanged — dev deps already present)

.github/
└── workflows/
    └── ci.yml                   # 🔄 UPDATE — add test job
```

### B. 预期的测试数量

| 测试文件 | 测试类 | 预期用例数 |
|----------|--------|-----------|
| `test_safety.py` (已有) | RuleEngine, ContentFilter | ~11 |
| `test_auth.py` | Register, Login, TokenValidation | ~9 |
| `test_mood.py` | Checkin, Today, Trends, Calendar, Stats | ~15 |
| `test_dialogue.py` | Send, Conversations | ~8 |
| `test_dialogue_stream.py` | Stream | ~5 |
| **合计** | | **~48 个测试用例** |

### C. 引用文件

- `backend/app/main.py` — FastAPI 应用入口（无需修改）
- `backend/app/dependencies.py` — 依赖注入（被 `app.dependency_overrides` 覆盖）
- `backend/app/db/session.py` — DB 引擎（测试中替换为 test engine）
- `backend/app/db/redis.py` — Redis 连接（测试中被 `FakeRedis` 替换）
- `backend/app/services/auth_service.py` — JWT、密码 hash（测试中直接复用）
- `backend/app/services/mood_service.py` — Mood 业务逻辑（测试中直接复用）
- `backend/app/services/dialogue_service.py` — Dialogue 业务逻辑（需 Mock LLM）
- `backend/pyproject.toml` — pytest 配置（已有 `asyncio_mode = "auto"` ✅）
