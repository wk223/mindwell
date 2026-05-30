"""Mood API 测试 — 打卡 / 趋势 / 日历 / 统计 / 边界"""
import pytest
from httpx import AsyncClient


class TestMoodCheckin:
    async def test_checkin_success(self, auth_client: AsyncClient):
        resp = await auth_client.post("/api/v1/mood/checkin", json={
            "mood_score": 7,
            "mood_label": "不错",
            "journal_text": "今天心情不错",
            "tags": ["工作", "运动"],
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["mood_score"] == 7
        assert data["mood_label"] == "不错"
        assert "工作" in data["tags"]

    async def test_checkin_min_score(self, auth_client: AsyncClient):
        resp = await auth_client.post("/api/v1/mood/checkin", json={
            "mood_score": 1,
            "mood_label": "非常低落",
        })
        assert resp.status_code == 200
        assert resp.json()["mood_score"] == 1

    async def test_checkin_max_score(self, auth_client: AsyncClient):
        resp = await auth_client.post("/api/v1/mood/checkin", json={
            "mood_score": 10,
            "mood_label": "非常好",
        })
        assert resp.status_code == 200
        assert resp.json()["mood_score"] == 10

    async def test_checkin_invalid_score_zero(self, auth_client: AsyncClient):
        resp = await auth_client.post("/api/v1/mood/checkin", json={"mood_score": 0})
        assert resp.status_code == 422

    async def test_checkin_invalid_score_eleven(self, auth_client: AsyncClient):
        resp = await auth_client.post("/api/v1/mood/checkin", json={"mood_score": 11})
        assert resp.status_code == 422

    async def test_checkin_without_label(self, auth_client: AsyncClient):
        resp = await auth_client.post("/api/v1/mood/checkin", json={"mood_score": 5})
        assert resp.status_code == 200

    async def test_multiple_checkins_same_day(self, auth_client: AsyncClient):
        await auth_client.post("/api/v1/mood/checkin", json={"mood_score": 5})
        resp = await auth_client.post("/api/v1/mood/checkin", json={"mood_score": 8})
        assert resp.status_code == 200
        # 两次都成功（支持同一天多次打卡）
        assert resp.json()["mood_score"] == 8

    async def test_checkin_requires_auth(self, client: AsyncClient):
        resp = await client.post("/api/v1/mood/checkin", json={"mood_score": 5})
        assert resp.status_code == 403  # no auth header


class TestMoodToday:
    async def test_today_after_checkin(self, auth_client: AsyncClient):
        await auth_client.post("/api/v1/mood/checkin", json={
            "mood_score": 6, "mood_label": "还行",
        })
        resp = await auth_client.get("/api/v1/mood/today")
        assert resp.status_code == 200
        data = resp.json()
        assert data is not None
        assert data["mood_score"] == 6

    async def test_today_empty(self, auth_client: AsyncClient):
        resp = await auth_client.get("/api/v1/mood/today")
        # 无数据时应返回 null 或 200 null body
        assert resp.status_code in (200, 404)

    async def test_today_entries_multiple(self, auth_client: AsyncClient):
        await auth_client.post("/api/v1/mood/checkin", json={"mood_score": 4})
        await auth_client.post("/api/v1/mood/checkin", json={"mood_score": 7})
        resp = await auth_client.get("/api/v1/mood/today/entries")
        assert resp.status_code == 200
        entries = resp.json()
        assert len(entries) == 2


class TestMoodTrends:
    async def test_trends_weekly(self, auth_client: AsyncClient):
        await auth_client.post("/api/v1/mood/checkin", json={"mood_score": 5})
        resp = await auth_client.get("/api/v1/mood/trends?range=weekly")
        assert resp.status_code == 200
        data = resp.json()
        assert "average" in data
        assert "entries" in data
        assert data["total_entries"] >= 1

    async def test_trends_monthly(self, auth_client: AsyncClient):
        resp = await auth_client.get("/api/v1/mood/trends?range=monthly")
        assert resp.status_code == 200


class TestMoodStats:
    async def test_stats_after_checkins(self, auth_client: AsyncClient):
        await auth_client.post("/api/v1/mood/checkin", json={"mood_score": 5, "mood_label": "一般"})
        resp = await auth_client.get("/api/v1/mood/stats")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_checkins"] >= 1
        assert "current_streak" in data


class TestMoodCalendar:
    async def test_calendar(self, auth_client: AsyncClient):
        await auth_client.post("/api/v1/mood/checkin", json={"mood_score": 6})
        resp = await auth_client.get("/api/v1/mood/calendar?days=14")
        assert resp.status_code == 200
        entries = resp.json()
        assert len(entries) >= 1
        assert "date" in entries[0]
        assert "score" in entries[0]
