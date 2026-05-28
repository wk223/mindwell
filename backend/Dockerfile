FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends libpq5 curl && \
    rm -rf /var/lib/apt/lists/*

COPY backend/pyproject.toml .
RUN pip install --no-cache-dir \
    fastapi>=0.109.0 "uvicorn[standard]>=0.27.0" "sqlalchemy[asyncio]>=2.0.25" \
    asyncpg>=0.29.0 alembic>=1.13.0 pydantic>=2.5.0 pydantic-settings>=2.1.0 \
    "python-jose[cryptography]>=3.3.0" "passlib[bcrypt]>=1.7.4" \
    redis>=5.0.0 httpx>=0.26.0 jinja2>=3.1.0 pyyaml>=6.0 sse-starlette>=2.0.0

COPY backend/ .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers", "--forwarded-allow-ips", "*"]
