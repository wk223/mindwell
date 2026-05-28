from pydantic import BaseModel, Field


class DialogueSendRequest(BaseModel):
    conversation_id: str | None = None
    message: str = Field(min_length=1, max_length=4000)
    stream: bool = True


class DialogueResponse(BaseModel):
    conversation_id: str
    message: dict
    safety: dict


class ConversationListItem(BaseModel):
    id: str
    title: str | None
    status: str
    message_count: int
    created_at: str
    updated_at: str


class ConversationListResponse(BaseModel):
    conversations: list[ConversationListItem]
    total: int
