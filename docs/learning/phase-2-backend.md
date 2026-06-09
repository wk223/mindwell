# Phase 2 — 后端基础设施

> 目标：理解 FastAPI 是怎么"接住"一个 HTTP 请求，经过中间件、路由、依赖注入，最终返回响应的。
> 预计时间：4-5 小时

---

## 2.1 入口文件：main.py

打开 `backend/app/main.py`。这是整个后端的起点。

```python
from fastapi import FastAPI
```

FastAPI 是一个 Python Web 框架。类比：Express（Node.js）、Flask（Python）、Gin（Go）。它最特别的是**自动生成 API 文档**（`/docs` 路径）和**类型驱动的参数校验**。

```python
app = FastAPI(
    title="MindWell API",
    version="0.1.0",
    description="Psychological Healing Platform Backend",
    lifespan=lifespan,  # ← 启动/关闭时的生命周期函数
)
```

**逐行解释**：
- `title`、`version`、`description` — 纯元数据，显示在自动生成的 API 文档页面上
- `lifespan=lifespan` — 关键！FastAPI 启动时会先执行 `lifespan` 函数里的 `yield` 之前的代码，关闭时执行 `yield` 之后的代码

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    await get_redis()    # ← 启动时：连接 Redis
    yield                # ← 应用运行期间停在这里
    await close_redis()  # ← 关闭时：断开 Redis
    await close_llm_client()  # ← 关闭时：断开 LLM 客户端
```

**为什么用 `asynccontextmanager`？** 这是 Python 的异步上下文管理器，`yield` 前面的代码在"进入"时执行，后面的在"退出"时执行。FastAPI 在启动时调用 `__aenter__`，关闭时调用 `__aexit__`。

接下来是中间件注册：

```python
app.add_middleware(CORSMiddleware, allow_origins=_cors_origins, ...)
app.add_middleware(RequestIDMiddleware)
app.add_middleware(RequestLogMiddleware)
app.add_middleware(RateLimitMiddleware)
app.add_exception_handler(Exception, global_exception_handler)
app.include_router(router)
```

**中间件执行顺序**：FastAPI 的中间件是**先进后出**的栈结构。一个请求进来时：

```
请求 → CORS → RequestID → RequestLog → RateLimit → 路由处理函数
                                                          ↓
响应 ← CORS ← RequestID ← RequestLog ← RateLimit ← 返回值
```

最后注册路由：

```python
app.include_router(router)
```

---

## 2.2 配置系统：config.py

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://..."
    jwt_secret: SecretStr = SecretStr("dev-secret-change-in-production")
    llm_api_key: SecretStr = SecretStr("")
    llm_model: str = "deepseek-chat"
    # ... 更多配置项 ...

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}
```

**逐行解释**：

- `BaseSettings` — Pydantic 的配置基类，自动从**环境变量**和 `.env` 文件读取值
- `SecretStr` — 一个特殊类型，打印或序列化时显示 `"**********"` 而非真实值。防止密钥泄露到日志
- `model_config` — Pydantic v2 的配置方式，`{"env_file": ".env"}` 告诉它从 `.env` 文件加载

**它是怎么工作的？**

1. 应用启动时，`get_settings()` 被调用
2. Pydantic 读取 `.env` 文件中的 `LLM_API_KEY=sk-xxx`
3. 自动映射到 `Settings.llm_api_key`，类型自动转换
4. 后续任何代码通过 `settings.llm_api_key.get_secret_value()` 获取真实密钥

```python
@lru_cache
def get_settings() -> Settings:
    return Settings()
```

`@lru_cache` 确保 `Settings()` 只初始化一次——全局单例。

---

## 2.3 路由系统：router.py + 7 个子路由

```python
# api/router.py
router = APIRouter(prefix="/api/v1")
router.include_router(auth.router)       # /api/v1/auth/register, /api/v1/auth/login
router.include_router(dialogue.router)   # /api/v1/dialogue/*
router.include_router(mood.router)       # /api/v1/mood/*
# ... 其他四个
```

每个子路由是一个独立的 Python 文件。以 `auth.py` 为例：

```python
# api/v1/auth.py
router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    user = await register_user(db, body.nickname, body.email, body.password)
    if user is None:
        raise HTTPException(status_code=409, detail="Nickname or email already registered")
    token = create_access_token(user)
    return TokenResponse(access_token=token, user=...)
```

**逐行解释**：

- `@router.post("/register")` — 注册一个 POST 端点。完整路径是 `/api/v1/auth/register`
- `response_model=TokenResponse` — FastAPI 自动把返回值序列化为 TokenResponse 格式，并在 API 文档中展示
- `body: RegisterRequest` — FastAPI 自动从请求体中解析 JSON，校验字段（nickname 2-50 字符、email 合法、password 8-128 字符）
- `db: AsyncSession = Depends(get_db)` — **依赖注入**。FastAPI 调用 `get_db()` 函数，返回一个数据库会话对象，注入到 `db` 参数中

---

## 2.4 依赖注入：dependencies.py

这是 FastAPI 最强大的特性之一。

```python
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    # 1. 从请求头提取 Bearer token
    payload = decode_token(credentials.credentials)

    # 2. 查数据库验证用户存在且活跃
    user = await get_user_by_id(db, payload["sub"])

    # 3. 设置 PostgreSQL 行级安全上下文
    try:
        await db.execute(text("SELECT set_config('app.current_user_id', :uid, false)"), {"uid": str(user.id)})
    except Exception:
        pass  # SQLite 不支持

    return user
```

**数据流**：

```
HTTP 请求头：Authorization: Bearer eyJhbGciOi...
    ↓
HTTPBearer() 自动提取 token
    ↓
decode_token() → JWT 解码 → {"sub": "user-uuid", "exp": 1234567890}
    ↓
get_user_by_id() → SQL: SELECT * FROM users WHERE id = '...'
    ↓
返回 User 对象 → 注入到路由函数参数中
```

在任何需要认证的路由中，只需加一行：

```python
@router.get("/mood/today")
async def get_today(user: User = Depends(get_current_user), db = Depends(get_db)):
    # user 已经是通过 JWT 验证的 User 对象
    # 不需要手动写任何认证代码！
```

---

## 2.5 数据库模型：models/

项目有 7 个数据库表，定义在 `models/` 目录。以 `User` 为例：

```python
# models/user.py
class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=new_uuid)
    nickname: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    conversations = relationship("Conversation", back_populates="user")
    mood_entries = relationship("MoodEntry", back_populates="user")
```

**关键概念**：

- `Mapped[uuid.UUID]` — SQLAlchemy 2.0 的类型注解。告诉 ORM："这个字段在数据库中是 UUID 类型，在 Python 中是 `uuid.UUID` 对象"
- `relationship()` — 定义表之间的关联。`User.conversations` 可以让你写 `user.conversations` 直接获取该用户的所有对话，SQLAlchemy 自动生成 JOIN 查询
- `default=new_uuid` — 每次插入新行时自动生成 UUID

**7 张表的 ER 关系**：

```
User (用户)
 ├── Conversation (对话) ── Message (消息) ── SafetyEvent (安全事件)
 ├── MoodEntry (情绪记录)
 ├── Assessment (测评结果)
 ├── Post (社区帖子) ── Comment (评论)
 └── UserMemory (记忆碎片)
```

---

## 2.6 自定义 UUID 类型：UniversalUuid

`models/base.py` 中有一个关键的自定义类型：

```python
class UniversalUuid(TypeDecorator):
    impl = CHAR(36)  # 底层存储为 36 字符的字符串

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(PG_UUID())  # PostgreSQL 用原生 UUID
        return dialect.type_descriptor(CHAR(36))       # SQLite 用 CHAR(36)

    def process_bind_param(self, value, dialect):
        # 插入/查询时：str → UUID（PostgreSQL）或 str → str（SQLite）
        if isinstance(value, str):
            return value if dialect.name != "postgresql" else uuid.UUID(value)
        # ...
```

**为什么需要这个？** 测试环境用 SQLite（不需要 PostgreSQL），但 SQLite 不支持 PostgreSQL 的 UUID 类型。`UniversalUuid` 让同一套模型代码在两种数据库上都能运行——PostgreSQL 用原生 UUID（性能好），SQLite 用字符串模拟。

---

## 2.7 中间件链

### RequestIDMiddleware

```python
class RequestIDMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        request.state.request_id = request_id          # 存到请求上下文
        response = await call_next(request)            # 调用下一个中间件
        response.headers["X-Request-ID"] = request_id  # 回写到响应头
        return response
```

**为什么需要？** 出问题时，通过日志中的 `request_id` 可以追踪一个请求的完整生命周期——从进入中间件到返回响应。

### RequestLogMiddleware

```python
class RequestLogMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        start = time.monotonic()
        response = await call_next(request)
        duration_ms = round((time.monotonic() - start) * 1000, 2)
        logger.info("%s %s → %s (%s ms)", request.method, request.url.path, response.status_code, duration_ms)
        return response
```

**为什么需要？** 生产环境中，这是唯一能告诉你"哪些接口慢、哪些接口报错"的手段。

### RateLimitMiddleware

```python
_AUTH_MAX = 5  # 登录/注册：5次/分钟

async def dispatch(self, request, call_next):
    if self._is_test:
        return await call_next(request)  # 测试环境不限流
    # ... 滑动窗口计数 ...
```

**为什么登录只有 5 次/分钟？** 防止暴力破解。5 次足够正常用户使用，但对自动化攻击形成瓶颈。

### GlobalExceptionHandler

```python
async def global_exception_handler(request, exc):
    logger.exception("Unhandled exception [%s] %s %s", rid, request.method, request.url.path)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})
```

作用：捕获所有未处理的异常，返回 500 而不是让请求直接挂掉。

---

## 2.8 Session + 数据库连接

```python
# db/session.py
engine = create_async_engine(settings.database_url, pool_size=10, max_overflow=20)
async_session_factory = async_sessionmaker(engine, expire_on_commit=False)

async def get_db():
    async with async_session_factory() as session:
        try:
            yield session
        finally:
            await session.close()
```

**关键参数**：

- `pool_size=10` — 维持 10 个常驻数据库连接（避免每次请求都重新连接）
- `max_overflow=20` — 高峰时可以额外创建最多 20 个临时连接（总共 30 个）
- `expire_on_commit=False` — 提交后不使对象过期，异步环境下必需
- `get_db()` 是一个生成器函数，FastAPI 的 `Depends` 会自动管理其生命周期

---

*Phase 2 完。下一章：[Phase 3 — AI 对话管线](./phase-3-ai-pipeline.md)*
