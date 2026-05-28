from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    nickname: str = Field(min_length=2, max_length=50)
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"


class UserResponse(BaseModel):
    id: str
    nickname: str
    avatar_seed: str | None = None
    created_at: str
