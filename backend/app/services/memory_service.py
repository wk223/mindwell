import re
from uuid import UUID

from sqlalchemy import select, delete, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user_memory import UserMemory


class MemoryService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_memories(
        self, user_id: str, category: str | None = None, search: str | None = None
    ) -> dict:
        stmt = select(UserMemory).where(UserMemory.user_id == user_id)
        if category:
            stmt = stmt.where(UserMemory.category == category)
        if search:
            stmt = stmt.where(
                UserMemory.key.ilike(f"%{search}%")
                | UserMemory.content.ilike(f"%{search}%")
            )
        stmt = stmt.order_by(UserMemory.importance.desc(), UserMemory.updated_at.desc())

        result = await self.db.execute(stmt)
        memories = result.scalars().all()

        return {
            "memories": [
                {
                    "id": str(m.id),
                    "key": m.key,
                    "content": m.content,
                    "category": m.category,
                    "importance": m.importance,
                    "source_quote": m.source_quote,
                    "created_at": m.created_at.isoformat(),
                    "updated_at": m.updated_at.isoformat(),
                }
                for m in memories
            ],
            "total": len(memories),
        }

    async def get_memory(self, user_id: str, memory_id: str) -> dict | None:
        stmt = select(UserMemory).where(
            UserMemory.id == memory_id, UserMemory.user_id == user_id
        )
        result = await self.db.execute(stmt)
        m = result.scalars().first()
        if not m:
            return None
        return {
            "id": str(m.id),
            "key": m.key,
            "content": m.content,
            "category": m.category,
            "importance": m.importance,
            "source_quote": m.source_quote,
            "created_at": m.created_at.isoformat(),
            "updated_at": m.updated_at.isoformat(),
        }

    async def create_memory(
        self,
        user_id: str,
        key: str,
        content: str,
        category: str | None = None,
        importance: int = 1,
        conversation_id: str | None = None,
        source_quote: str | None = None,
    ) -> dict:
        # Deduplicate: if same key exists, update it
        stmt = select(UserMemory).where(
            UserMemory.user_id == user_id, UserMemory.key == key
        )
        result = await self.db.execute(stmt)
        existing = result.scalars().first()

        if existing:
            existing.content = content
            existing.importance = max(existing.importance, importance)
            if category:
                existing.category = category
            if source_quote:
                existing.source_quote = source_quote
            await self.db.commit()
            await self.db.refresh(existing)
            return {
                "id": str(existing.id),
                "key": existing.key,
                "content": existing.content,
                "category": existing.category,
                "importance": existing.importance,
                "source_quote": existing.source_quote,
                "created_at": existing.created_at.isoformat(),
                "updated_at": existing.updated_at.isoformat(),
            }

        memory = UserMemory(
            user_id=UUID(user_id),
            conversation_id=UUID(conversation_id) if conversation_id else None,
            key=key,
            content=content,
            category=category,
            importance=importance,
            source_quote=source_quote,
        )
        self.db.add(memory)
        await self.db.commit()
        await self.db.refresh(memory)

        return {
            "id": str(memory.id),
            "key": memory.key,
            "content": memory.content,
            "category": memory.category,
            "importance": memory.importance,
            "source_quote": memory.source_quote,
            "created_at": memory.created_at.isoformat(),
            "updated_at": memory.updated_at.isoformat(),
        }

    async def delete_memory(self, user_id: str, memory_id: str) -> bool:
        stmt = delete(UserMemory).where(
            UserMemory.id == memory_id, UserMemory.user_id == user_id
        )
        result = await self.db.execute(stmt)
        await self.db.commit()
        return result.rowcount > 0

    async def clear_all(self, user_id: str) -> int:
        stmt = delete(UserMemory).where(UserMemory.user_id == user_id)
        result = await self.db.execute(stmt)
        await self.db.commit()
        return result.rowcount

    async def build_memory_context(self, user_id: str, limit: int = 10) -> str:
        """Build a context string of user memories for AI prompt injection."""
        memories_data = await self.list_memories(user_id)
        memories = memories_data["memories"]
        if not memories:
            return ""

        lines = ["## 用户关键记忆（来自之前的对话）"]
        for m in memories[:limit]:
            cat_tag = f"[{m['category']}]" if m.get("category") else ""
            lines.append(f"- {cat_tag} {m['key']}: {m['content']}")
        return "\n".join(lines)

    # ---- Lightweight auto-extraction from user messages ----

    MEMORY_PATTERNS = [
        # (regex, category, extract_key)
        (r"(?:我|我的)(?:工作|职业|上班)(?:是|在|做).{2,30}(?:的|。|，)", "工作", "工作信息"),
        (r"(?:我|我的)(?:家庭|家人|爸妈?|父母|孩子|老公|老婆|对象|男朋友|女朋友).{2,50}", "关系", "家庭关系"),
        (r"(?:我|最近|一直|总是)(?:感到?|觉得?|很|非常|特别)(.{2,30})(?:了|。|，)", "情绪", None),
        (r"(?:我的|我有|我得了|被诊断)(?:抑郁症|焦虑症|失眠|强迫症|创伤|心理问题).{0,30}", "健康", "心理健康状态"),
        (r"(?:我想|我希望|我打算|我的目标是?).{3,40}(?:。|，)", "目标", None),
        (r"(?:我最?喜欢|我最?讨厌|我不喜欢|我讨厌).{3,40}(?:。|，)", "偏好", None),
        (r"(?:我小时候|我童年|我过去|我以前|我曾经).{3,60}(?:。|，)", "经历", None),
    ]

    async def extract_from_message(
        self, user_id: str, conversation_id: str, message: str
    ) -> list[dict]:
        """Scan a user message for key information and auto-save memories."""
        saved = []
        for pattern, category, fallback_key in self.MEMORY_PATTERNS:
            match = re.search(pattern, message)
            if match:
                key = fallback_key or match.group(1) if match.lastindex else match.group(0)[:50]
                if not fallback_key:
                    key = match.group(0)[:50]
                key = key.strip().rstrip("。，.!,，")
                if len(key) < 3:
                    continue
                content = match.group(0).strip().rstrip("。，.!,，")
                memory = await self.create_memory(
                    user_id=user_id,
                    key=key,
                    content=content,
                    category=category,
                    importance=2,
                    conversation_id=conversation_id,
                    source_quote=content,
                )
                saved.append(memory)
        return saved
