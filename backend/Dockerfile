FROM python:3.12-slim

WORKDIR /app

# ── 系统依赖（层 1 — 极少变化）──
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

# ── PyPI 镜像 ──
ENV PIP_INDEX_URL=https://pypi.tuna.tsinghua.edu.cn/simple
ENV PIP_TRUSTED_HOST=pypi.tuna.tsinghua.edu.cn

# ── Python 依赖（层 2 — pyproject.toml 变化时才重建）──
COPY pyproject.toml .
RUN pip install --no-cache-dir \
    "fastapi[standard]" \
    "sqlalchemy[asyncio]" \
    asyncpg \
    aiosqlite \
    alembic \
    pydantic \
    pydantic-settings \
    "python-jose[cryptography]" \
    "passlib[bcrypt]==1.7.4" \
    "bcrypt==4.0.1" \
    redis \
    httpx \
    jinja2 \
    pyyaml \
    sse-starlette

# ── 源码（层 3 — 最频繁变化，放最后）──
COPY . .

EXPOSE 8000
CMD ["sh", "-c", "python -m app.db.init_db && python -m app.db.seed && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
