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


@asynccontextmanager
async def lifespan(app: FastAPI):
    await get_redis()
    yield
    await close_redis()
    await close_llm_client()


app = FastAPI(
    title="MindWell API",
    version="0.1.0",
    description="Psychological Healing Platform Backend",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=_allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Observability middleware (order: outermost first) ──
app.add_middleware(RequestIDMiddleware)
app.add_middleware(RequestLogMiddleware)
app.add_middleware(RateLimitMiddleware)

# ── Global exception handler ──
app.add_exception_handler(Exception, global_exception_handler)

app.include_router(router)


@app.get("/health")
async def health_check():
    return {"status": "ok", "version": "0.1.0"}
