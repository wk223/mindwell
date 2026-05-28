from pydantic import BaseModel, Field


class MemoryCreate(BaseModel):
    key: str = Field(max_length=200)
    content: str
    category: str | None = None
    importance: int = Field(default=1, ge=1, le=5)


class MemoryResponse(BaseModel):
    id: str
    key: str
    content: str
    category: str | None
    importance: int
    source_quote: str | None
    created_at: str
    updated_at: str


class MemoryListResponse(BaseModel):
    memories: list[MemoryResponse]
    total: int
