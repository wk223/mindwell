import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import router
from app.config import get_settings
from app.db.redis import get_redis, close_redis
from app.core.llm.client import close_llm_client
from app.middleware import (
    RequestIDMiddleware,
    RequestLogMiddleware,
    RateLimitMiddleware,
    global_exception_handler,
)

settings = get_settings()

# ── Production safety guard ──
if settings.app_env == "production" and settings.jwt_secret.get_secret_value() == "dev-secret-change-in-production":
    sys.exit("FATAL: JWT_SECRET is still the dev default in production mode. Set JWT_SECRET env var.")

# ── CORS: credentials require explicit origins (not wildcard) ──
_cors_origins = settings.cors_origins
_allow_credentials = True
if _cors_origins == ["*"]:
    # Wildcard + credentials = browser will reject all credentialed requests
    _allow_credentials = False

#lifespan=lifespan,启动关闭的生命周期
@asynccontextmanager#异步上下文管理器
async def lifespan(app: FastAPI):
    await get_redis()#启动调用 关闭后执行yield后的
    yield
    await close_redis()#关闭时断开redis
    await close_llm_client()#关闭时断开llm


app = FastAPI(
    title="MindWell API",
    version="0.1.0",
    description="Psychological Healing Platform Backend",
    lifespan=lifespan,
)
#fastapi采用先进后出的进出栈结构 请求>corsm>ID>Log>ratelim>路由处理函数
#响应为响应<corsm<ID<Log<ratelim<返回值 最后注册路由
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=_allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注入 X-Request-ID 记录请求日志 限流
app.add_middleware(RequestIDMiddleware)
app.add_middleware(RequestLogMiddleware)
app.add_middleware(RateLimitMiddleware)

# ── Global exception handler ── 异常兜底

app.add_exception_handler(Exception, global_exception_handler)
#注册路由
app.include_router(router)


@app.get("/health")
async def health_check():
    return {"status": "ok", "version": "0.1.0"}
