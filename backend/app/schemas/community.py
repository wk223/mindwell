from pydantic import BaseModel, Field


class PostCreateRequest(BaseModel):
    display_name: str = Field(min_length=1, max_length=50)
    title: str = Field(min_length=1, max_length=200)
    content: str = Field(min_length=1, max_length=5000)
    content_labels: list[str] = Field(default_factory=list)
    is_anonymous: bool = True


class CommentCreateRequest(BaseModel):
    display_name: str = Field(min_length=1, max_length=50)
    content: str = Field(min_length=1, max_length=2000)
    is_anonymous: bool = True


class PostResponse(BaseModel):
    id: str
    display_name: str
    title: str
    content: str
    content_labels: list[str]
    is_anonymous: bool
    moderation_status: str
    comment_count: int
    created_at: str
    updated_at: str


class CommentResponse(BaseModel):
    id: str
    post_id: str
    display_name: str
    content: str
    is_anonymous: bool
    moderation_status: str
    created_at: str


class PostDetailResponse(PostResponse):
    comments: list[CommentResponse]


class PostListResponse(BaseModel):
    posts: list[PostResponse]
    total: int
    page: int
    limit: int
