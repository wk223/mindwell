from datetime import timedelta
from redis.asyncio import Redis

ESCALATION_THRESHOLD = 3  # Number of HIGH flags in 24h before escalation
CRISIS_WINDOW_HOURS = 24


class EscalationManager:
    def __init__(self, redis: Redis):
        self.redis = redis

    def _key(self, user_id: str) -> str:
        return f"active_crisis:{user_id}"

    async def record_flag(self, user_id: str, severity: str) -> int:
        """Record a safety flag. Returns the current crisis count in the window."""
        key = self._key(user_id)
        count = await self.redis.incr(key)
        # Set TTL on first flag in window
        if count == 1:
            await self.redis.expire(key, int(timedelta(hours=CRISIS_WINDOW_HOURS).total_seconds()))
        return count

    async def get_crisis_count(self, user_id: str) -> int:
        key = self._key(user_id)
        count = await self.redis.get(key)
        return int(count) if count else 0

    async def should_escalate(self, user_id: str, severity: str) -> bool:
        """Check if this flag should trigger escalation."""
        if severity == "critical":
            return True  # Always escalate critical

        count = await self.record_flag(user_id, severity)
        if severity == "high" and count >= ESCALATION_THRESHOLD:
            return True

        return False

    async def get_escalation_message(self, user_id: str) -> str | None:
        """Get escalation message if threshold exceeded."""
        count = await self.get_crisis_count(user_id)
        if count >= ESCALATION_THRESHOLD:
            return (
                "\n\n---\n\n"
                "我注意到在过去的24小时内你多次提到了让你非常痛苦的事情。"
                "我作为一个AI助手能力有限，强烈建议你联系专业心理咨询师获得更深入的帮助：\n\n"
                "- **全国心理援助热线**: 400-161-9995（24小时免费）\n"
                "- **简单心理**: jiandanxinli.com（可在线预约咨询师）\n"
                "- **壹心理**: xinli001.com\n\n"
                "寻求专业帮助是照顾自己的一种方式，你值得被好好对待。"
            )
        return None

    async def reset(self, user_id: str):
        await self.redis.delete(self._key(user_id))
