FROM python:3.12-slim

WORKDIR /app

# Tsinghua PyPI mirror (China)
ENV PIP_INDEX_URL=https://pypi.tuna.tsinghua.edu.cn/simple
ENV PIP_TRUSTED_HOST=pypi.tuna.tsinghua.edu.cn

COPY . .

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

EXPOSE 8000

CMD ["sh", "-c", "python -m app.db.init_db && python -m app.db.seed && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
