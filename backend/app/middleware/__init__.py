"""Middleware layer: request IDs, structured logging, global error handling, rate limiting."""
import time
import uuid
import logging
from collections import defaultdict

from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("mindwell")


class RequestIDMiddleware(BaseHTTPMiddleware):
    """Inject X-Request-ID into every request/response for traceability."""

    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        request.state.request_id = request_id
        response: Response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response


class RequestLogMiddleware(BaseHTTPMiddleware):
    """Log method, path, status, and duration for every request."""

    async def dispatch(self, request: Request, call_next):
        start = time.monotonic()
        response: Response = await call_next(request)
        duration_ms = round((time.monotonic() - start) * 1000, 2)
        rid = getattr(request.state, "request_id", "-")
        logger.info(
            "%s %s → %s (%s ms) [%s]",
            request.method,
            request.url.path,
            response.status_code,
            duration_ms,
            rid,
        )
        return response


# ── Rate limiter (in-process, per-IP sliding-window) ──

_AUTH_PATHS = {"/api/v1/auth/login", "/api/v1/auth/register"}
_NORMAL_MAX = 300   # 普通接口：300次/分钟（前端并发 API 调用多）
_AUTH_MAX = 5       # 登录/注册：5次/分钟（防暴力破解）


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Simple in-process sliding-window rate limiter, stricter for auth."""

    def __init__(self, app):
        super().__init__(app)
        self._buckets: dict[str, list[float]] = defaultdict(list)
        # 测试环境不限流
        from app.config import get_settings
        self._is_test = get_settings().app_env in ("testing", "development")

    def _clean(self, ip: str, now: float, window_sec: float):
        cutoff = now - window_sec
        self._buckets[ip] = [t for t in self._buckets[ip] if t > cutoff]

    async def dispatch(self, request: Request, call_next):
        if request.url.path == "/health" or self._is_test:
            return await call_next(request)

        is_auth = request.url.path in _AUTH_PATHS
        max_req = _AUTH_MAX if is_auth else _NORMAL_MAX
        window = 60.0  # 统一 60 秒窗口

        ip = request.client.host if request.client else "unknown"
        now = time.monotonic()
        self._clean(ip, now, window)
        if len(self._buckets[ip]) >= max_req:
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Please slow down."},
            )
        self._buckets[ip].append(now)
        return await call_next(request)


# ── Global exception handler ──

async def global_exception_handler(request: Request, exc: Exception):
    """Catch unhandled exceptions and return a safe 500 response."""
    rid = getattr(request.state, "request_id", "-")
    logger.exception("Unhandled exception [%s] %s %s", rid, request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "request_id": rid},
    )
