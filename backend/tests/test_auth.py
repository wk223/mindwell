"""Auth API 测试 — 注册/登录/Token 验证"""
import pytest
from httpx import AsyncClient


class TestRegister:
    async def test_register_success(self, client: AsyncClient, unique_email, unique_nickname):
        resp = await client.post("/api/v1/auth/register", json={
            "nickname": unique_nickname,
            "email": unique_email,
            "password": "Test123456!",
        })
        assert resp.status_code == 201
        data = resp.json()
        assert "access_token" in data
        assert data["user"]["nickname"] == unique_nickname

    async def test_register_duplicate_email(self, client: AsyncClient, unique_nickname):
        email = "dup@test.com"
        await client.post("/api/v1/auth/register", json={
            "nickname": unique_nickname, "email": email, "password": "Test123456!",
        })
        resp = await client.post("/api/v1/auth/register", json={
            "nickname": "other_user", "email": email, "password": "Test123456!",
        })
        assert resp.status_code == 409

    async def test_register_duplicate_nickname(self, client: AsyncClient, unique_email):
        nick = "samenick"
        await client.post("/api/v1/auth/register", json={
            "nickname": nick, "email": f"a_{unique_email}", "password": "Test123456!",
        })
        resp = await client.post("/api/v1/auth/register", json={
            "nickname": nick, "email": f"b_{unique_email}", "password": "Test123456!",
        })
        assert resp.status_code == 409

    async def test_register_returns_valid_token(self, client: AsyncClient, unique_email, unique_nickname):
        resp = await client.post("/api/v1/auth/register", json={
            "nickname": unique_nickname,
            "email": unique_email,
            "password": "Test123456!",
        })
        token = resp.json()["access_token"]
        # 用该 token 访问需要认证的端点
        resp2 = await client.get("/api/v1/mood/today", headers={"Authorization": f"Bearer {token}"})
        # 可能 200（无数据）或 404，但不应该是 401
        assert resp2.status_code != 401


class TestLogin:
    async def test_login_success(self, client: AsyncClient, unique_email, unique_nickname):
        pwd = "Test123456!"
        await client.post("/api/v1/auth/register", json={
            "nickname": unique_nickname, "email": unique_email, "password": pwd,
        })
        resp = await client.post("/api/v1/auth/login", json={
            "email": unique_email, "password": pwd,
        })
        assert resp.status_code == 200
        assert "access_token" in resp.json()

    async def test_login_wrong_password(self, client: AsyncClient, unique_email, unique_nickname):
        await client.post("/api/v1/auth/register", json={
            "nickname": unique_nickname, "email": unique_email, "password": "Test123456!",
        })
        resp = await client.post("/api/v1/auth/login", json={
            "email": unique_email, "password": "WrongPass1!",
        })
        assert resp.status_code == 401

    async def test_login_nonexistent_user(self, client: AsyncClient):
        resp = await client.post("/api/v1/auth/login", json={
            "email": "noexist@test.com", "password": "Test123456!",
        })
        assert resp.status_code == 401

    async def test_login_returns_user_data(self, client: AsyncClient, unique_email, unique_nickname):
        pwd = "Test123456!"
        await client.post("/api/v1/auth/register", json={
            "nickname": unique_nickname, "email": unique_email, "password": pwd,
        })
        resp = await client.post("/api/v1/auth/login", json={
            "email": unique_email, "password": pwd,
        })
        data = resp.json()
        assert data["user"]["nickname"] == unique_nickname
        assert "id" in data["user"]


class TestTokenExpiry:
    async def test_expired_token_rejected(self):
        """使用过期 token 应返回 401"""
        from datetime import datetime, timedelta, timezone
        from jose import jwt
        from app.config import get_settings
        from app.main import app
        from httpx import ASGITransport, AsyncClient as AC
        import uuid as _uuid

        settings = get_settings()
        expire = datetime.now(timezone.utc) - timedelta(hours=1)
        token = jwt.encode(
            {"sub": str(_uuid.uuid4()), "exp": expire},
            settings.jwt_secret.get_secret_value(),
            algorithm=settings.jwt_algorithm,
        )
        transport = ASGITransport(app=app)
        async with AC(transport=transport, base_url="http://test") as ac:
            resp = await ac.get("/api/v1/mood/today",
                headers={"Authorization": f"Bearer {token}"})
            assert resp.status_code == 401
