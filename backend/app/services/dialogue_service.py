import json
from uuid import UUID

from sqlalchemy import select, func, delete
from sqlalchemy.ext.asyncio import AsyncSession
from redis.asyncio import Redis

from app.models.base import utcnow
from app.models.conversation import Conversation, Message, SafetyEvent
from app.core.agents.orchestrator import AgentOrchestrator
from app.core.safety.safety_pipeline import SafetyPipeline, SafetyAction


HISTORY_CACHE_SIZE = 50


class DialogueService:
    def __init__(
        self,
        orchestrator: AgentOrchestrator,
        safety_pipeline: SafetyPipeline,
        db: AsyncSession,
        redis: Redis,
    ):
        self.orchestrator = orchestrator
        self.safety = safety_pipeline
        self.db = db
        self.redis = redis

    async def get_or_create_conversation(
        self, user_id: str, conversation_id: str | None
    ) -> Conversation:
        if conversation_id:
            stmt = select(Conversation).where(
                Conversation.id == conversation_id, Conversation.user_id == user_id
            )
            result = await self.db.execute(stmt)
            conv = result.scalars().first()
            if conv:
                return conv

        conv = Conversation(user_id=UUID(user_id), title=None)
        self.db.add(conv)
        await self.db.commit()
        await self.db.refresh(conv)
        return conv

    async def get_chat_history(self, conversation_id: str) -> list[dict]:
        """Get recent messages as LLM-compatible dict list."""
        # Try Redis cache first
        cache_key = f"chat_history:{conversation_id}"
        cached = await self.redis.lrange(cache_key, 0, -1)
        if cached:
            return [json.loads(m) for m in cached]

        stmt = (
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.desc())
            .limit(HISTORY_CACHE_SIZE)
        )
        result = await self.db.execute(stmt)
        messages = result.scalars().all()

        history = [
            {"role": m.role, "content": m.content}
            for m in reversed(messages)
        ]
        return history

    async def save_message(
        self,
        conversation_id: str,
        role: str,
        content: str,
        agent_id: str | None = None,
        safety_flags: list | None = None,
    ) -> Message:
        msg = Message(
            conversation_id=UUID(conversation_id),
            role=role,
            content=content,
            agent_id=agent_id,
            safety_flags=safety_flags or [],
        )
        self.db.add(msg)

        # Update conversation timestamp
        stmt = select(Conversation).where(Conversation.id == conversation_id)
        result = await self.db.execute(stmt)
        conv = result.scalars().first()
        if conv:
            conv.updated_at = utcnow()
            if conv.title is None and role == "user":
                conv.title = content[:100]

        await self.db.commit()
        await self.db.refresh(msg)

        # Update Redis cache
        cache_key = f"chat_history:{conversation_id}"
        await self.redis.rpush(cache_key, json.dumps({"role": role, "content": content}))
        await self.redis.ltrim(cache_key, -HISTORY_CACHE_SIZE, -1)
        await self.redis.expire(cache_key, 86400)  # 24h TTL

        return msg

    async def get_conversations(self, user_id: str) -> list[dict]:
        stmt = (
            select(
                Conversation,
                func.count(Message.id).label("message_count"),
            )
            .outerjoin(Message, Message.conversation_id == Conversation.id)
            .where(Conversation.user_id == user_id)
            .group_by(Conversation.id)
            .order_by(Conversation.updated_at.desc())
        )
        result = await self.db.execute(stmt)
        rows = result.all()

        return [
            {
                "id": str(row[0].id),
                "title": row[0].title or "新对话",
                "status": row[0].status,
                "message_count": row[1],
                "created_at": row[0].created_at.isoformat(),
                "updated_at": row[0].updated_at.isoformat(),
            }
            for row in rows
        ]

    async def delete_conversation(self, user_id: str, conversation_id: str) -> bool:
        # Get message IDs for this conversation
        msg_ids_stmt = select(Message.id).where(Message.conversation_id == conversation_id)
        msg_ids_result = await self.db.execute(msg_ids_stmt)
        msg_ids = [row[0] for row in msg_ids_result.all()]

        # Delete safety events referencing these messages
        if msg_ids:
            await self.db.execute(
                delete(SafetyEvent).where(SafetyEvent.message_id.in_(msg_ids))
            )

        # Delete messages
        await self.db.execute(
            delete(Message).where(Message.conversation_id == conversation_id)
        )

        # Delete conversation
        stmt = delete(Conversation).where(
            Conversation.id == conversation_id, Conversation.user_id == user_id
        )
        result = await self.db.execute(stmt)
        await self.db.commit()

        # Clean up Redis
        await self.redis.delete(f"chat_history:{conversation_id}")

        return result.rowcount > 0

    async def process_message(
        self,
        user_id: str,
        conversation_id: str | None,
        message: str,
    ) -> dict:
        """Full non-streaming message processing."""
        conv = await self.get_or_create_conversation(user_id, conversation_id)
        history = await self.get_chat_history(str(conv.id))

        # Save user message
        await self.save_message(str(conv.id), "user", message)

        # Safety check
        safety_result = await self.safety.process_input(user_id, message)

        if safety_result.action == SafetyAction.HALT:
            ai_msg = await self.save_message(
                str(conv.id),
                "assistant",
                safety_result.crisis_response or "",
                agent_id="crisis",
                safety_flags=[
                    {"rule_id": f.rule_id, "severity": f.severity}
                    for f in safety_result.flags
                ],
            )
            return {
                "conversation_id": str(conv.id),
                "message": {
                    "id": str(ai_msg.id),
                    "role": "assistant",
                    "content": safety_result.crisis_response,
                    "agent_id": "crisis",
                },
                "safety": {
                    "flags": [
                        {"rule_id": f.rule_id, "severity": f.severity}
                        for f in safety_result.flags
                    ],
                    "escalation_triggered": True,
                },
            }

        # Agent processing
        response = await self.orchestrator.process(
            user_id,
            safety_result.sanitized_text,
            history,
        )

        # Save AI response
        agent_id = "emotional_support"
        if response.agent_trace:
            agent_id = response.agent_trace[0].agent_id

        ai_msg = await self.save_message(
            str(conv.id),
            "assistant",
            response.final_message,
            agent_id=agent_id,
            safety_flags=[
                {"rule_id": f.rule_id, "severity": f.severity}
                for f in response.safety_flags
            ],
        )

        return {
            "conversation_id": str(conv.id),
            "message": {
                "id": str(ai_msg.id),
                "role": "assistant",
                "content": response.final_message,
                "agent_id": agent_id,
            },
            "safety": {
                "flags": [
                    {"rule_id": f.rule_id, "severity": f.severity}
                    for f in response.safety_flags
                ],
                "escalation_triggered": False,
            },
        }
