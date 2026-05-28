from pydantic import BaseModel, Field


class UserUpdateRequest(BaseModel):
    nickname: str | None = Field(default=None, min_length=2, max_length=50)
    timezone: str | None = None
