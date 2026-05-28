import json

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from redis.asyncio import Redis

from app.db.session import get_db
from app.db.redis import get_redis
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.dialogue import (
    DialogueSendRequest,
    DialogueResponse,
    ConversationListResponse,
    ConversationListItem,
)
from app.services.dialogue_service import DialogueService
from app.core.agents.orchestrator import AgentOrchestrator
from app.core.safety.safety_pipeline import SafetyPipeline
from app.core.safety.rule_engine import get_rule_engine
from app.core.llm.client import get_llm_client


router = APIRouter(prefix="/dialogue", tags=["dialogue"])


def _get_dialogue_service(
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
) -> DialogueService:
    # Use process-wide singletons — no more per-request httpx.AsyncClient creation
    llm = get_llm_client()
    rule_engine = get_rule_engine()
    safety = SafetyPipeline(redis, rule_engine)
    orchestrator = AgentOrchestrator(llm, safety)
    return DialogueService(orchestrator, safety, db, redis)


@router.get("/conversations", response_model=ConversationListResponse)
async def list_conversations(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
):
    service = _get_dialogue_service(db, redis)
    conversations = await service.get_conversations(str(user.id))
    # Don't pass redis to the service wrapper — handled internally
    return ConversationListResponse(
        conversations=[ConversationListItem(**c) for c in conversations],
        total=len(conversations),
    )


@router.get("/conversations/{conversation_id}")
async def get_conversation(
    conversation_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
):
    service = _get_dialogue_service(db, redis)
    history = await service.get_chat_history(conversation_id, str(user.id))
    return {"conversation_id": conversation_id, "messages": history}


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
):
    service = _get_dialogue_service(db, redis)
    deleted = await service.delete_conversation(str(user.id), conversation_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"status": "deleted"}


@router.post("/send")
async def send_message(
    body: DialogueSendRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
):
    service = _get_dialogue_service(db, redis)

    conv = await service.get_or_create_conversation(str(user.id), body.conversation_id)

    if not body.stream:
        # Non-streaming: process_message() handles save internally
        result = await service.process_message(str(user.id), str(conv.id), body.message)
        return result

    # Streaming: load history BEFORE saving user message (save_message overwrites Redis cache)
    history = await service.get_chat_history(str(conv.id), str(user.id))
    await service.save_message(str(conv.id), "user", body.message)

    # Reuse the orchestrator already created in _get_dialogue_service (avoid double init)
    orchestrator = service.orchestrator

    async def event_stream():
        full_response = ""
        try:
            async for event in orchestrator.process_stream(
                str(user.id), body.message, history
            ):
                if event["type"] == "token":
                    full_response += event["content"]
                    yield f"data: {json.dumps({'type': 'token', 'content': event['content']})}\n\n"

                elif event["type"] == "safety":
                    yield f"data: {json.dumps({'type': 'safety', 'flags': event['flags'], 'crisis_response': event.get('crisis_response')})}\n\n"

                elif event["type"] == "done":
                    # Save AI message
                    await service.save_message(
                        str(conv.id), "assistant", full_response,
                        agent_id="emotional_support",
                    )
                    yield f"data: {json.dumps({'type': 'done', 'message': full_response, 'conversation_id': str(conv.id), 'safety_flags': event.get('safety_flags', [])})}\n\n"

                elif event["type"] == "override":
                    yield f"data: {json.dumps({'type': 'override'})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'detail': str(e)})}\n\n"
        # Note: llm is the process-wide singleton — NOT closed here

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
