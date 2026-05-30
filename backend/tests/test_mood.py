"""Mood API 测试 — 打卡 / 趋势 / 日历 / 统计 / 边界"""
from httpx import AsyncClient


class TestMoodCheckin:
    async def test_checkin_success(self, client: AsyncClient):
        resp = await client.post("/api/v1/mood/checkin", json={
            "mood_score": 7, "mood_label": "不错",
            "journal_text": "今天心情不错", "tags": ["工作", "运动"],
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["mood_score"] == 7
        assert data["mood_label"] == "不错"
        assert "工作" in data["tags"]

    async def test_checkin_min_score(self, client: AsyncClient):
        resp = await client.post("/api/v1/mood/checkin", json={
            "mood_score": 1, "mood_label": "非常低落",
        })
        assert resp.status_code == 200

    async def test_checkin_max_score(self, client: AsyncClient):
        resp = await client.post("/api/v1/mood/checkin", json={
            "mood_score": 10, "mood_label": "非常好",
        })
        assert resp.status_code == 200

    async def test_checkin_invalid_score_zero(self, client: AsyncClient):
        resp = await client.post("/api/v1/mood/checkin", json={"mood_score": 0})
        assert resp.status_code == 422

    async def test_checkin_invalid_score_eleven(self, client: AsyncClient):
        resp = await client.post("/api/v1/mood/checkin", json={"mood_score": 11})
        assert resp.status_code == 422

    async def test_checkin_without_label(self, client: AsyncClient):
        resp = await client.post("/api/v1/mood/checkin", json={"mood_score": 5})
        assert resp.status_code == 200

    async def test_multiple_checkins_same_day(self, client: AsyncClient):
        await client.post("/api/v1/mood/checkin", json={"mood_score": 5})
        resp = await client.post("/api/v1/mood/checkin", json={"mood_score": 8})
        assert resp.status_code == 200

    async def test_checkin_requires_auth(self):
        """无 token 应被拒"""
        from httpx import ASGITransport, AsyncClient as AC
        from app.main import app
        transport = ASGITransport(app=app)
        async with AC(transport=transport, base_url="http://test") as ac:
            resp = await ac.post("/api/v1/mood/checkin", json={"mood_score": 5})
            assert resp.status_code in (401, 403)


class TestMoodToday:
    async def test_today_after_checkin(self, client: AsyncClient):
        await client.post("/api/v1/mood/checkin", json={
            "mood_score": 6, "mood_label": "还行",
        })
        resp = await client.get("/api/v1/mood/today")
        assert resp.status_code == 200
        data = resp.json()
        assert data is not None

    async def test_today_empty(self, client: AsyncClient):
        resp = await client.get("/api/v1/mood/today")
        assert resp.status_code in (200, 404)

    async def test_today_entries_multiple(self, client: AsyncClient):
        await client.post("/api/v1/mood/checkin", json={"mood_score": 4})
        await client.post("/api/v1/mood/checkin", json={"mood_score": 7})
        resp = await client.get("/api/v1/mood/today/entries")
        assert resp.status_code == 200
        data = resp.json()
        entries = data if isinstance(data, list) else data.get("entries", [])
        assert len(entries) >= 2


class TestMoodTrends:
    async def test_trends_weekly(self, client: AsyncClient):
        await client.post("/api/v1/mood/checkin", json={"mood_score": 5})
        resp = await client.get("/api/v1/mood/trends?range=weekly")
        assert resp.status_code == 200
        data = resp.json()
        assert "average" in data

    async def test_trends_monthly(self, client: AsyncClient):
        resp = await client.get("/api/v1/mood/trends?range=monthly")
        assert resp.status_code == 200


class TestMoodStats:
    async def test_stats_after_checkins(self, client: AsyncClient):
        await client.post("/api/v1/mood/checkin", json={"mood_score": 5, "mood_label": "一般"})
        resp = await client.get("/api/v1/mood/stats")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_checkins"] >= 1


class TestMoodCalendar:
    async def test_calendar(self, client: AsyncClient):
        await client.post("/api/v1/mood/checkin", json={"mood_score": 6})
        resp = await client.get("/api/v1/mood/calendar?days=14")
        assert resp.status_code == 200
        data = resp.json()
        entries = data if isinstance(data, list) else data.get("entries", [])
        if len(entries) > 0:
            assert "date" in entries[0]
