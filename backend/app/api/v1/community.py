from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.community import (
    PostCreateRequest,
    CommentCreateRequest,
    PostListResponse,
    PostDetailResponse,
    PostResponse,
    CommentResponse,
)
from app.services.community_service import CommunityService

router = APIRouter(prefix="/community", tags=["community"])


@router.post("/posts", response_model=PostResponse, status_code=201)
async def create_post(
    body: PostCreateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = CommunityService(db)
    post = await service.create_post(
        str(user.id),
        body.display_name,
        body.title,
        body.content,
        body.content_labels,
        body.is_anonymous,
    )
    return post


@router.get("/posts", response_model=PostListResponse)
async def list_posts(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    service = CommunityService(db)
    return await service.get_posts(page, limit)


@router.get("/posts/{post_id}", response_model=PostDetailResponse)
async def get_post(
    post_id: str,
    db: AsyncSession = Depends(get_db),
):
    service = CommunityService(db)
    post = await service.get_post(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post


@router.post("/posts/{post_id}/comments", response_model=CommentResponse, status_code=201)
async def create_comment(
    post_id: str,
    body: CommentCreateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = CommunityService(db)
    # Verify post exists
    post = await service.get_post(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    comment = await service.create_comment(
        post_id,
        str(user.id),
        body.display_name,
        body.content,
        body.is_anonymous,
    )
    return comment


@router.delete("/posts/{post_id}")
async def delete_post(
    post_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = CommunityService(db)
    deleted = await service.delete_post(str(user.id), post_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Post not found or not authorized")
    return {"status": "deleted"}


@router.post("/posts/{post_id}/report")
async def report_post(
    post_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = CommunityService(db)
    result = await service.report_post(post_id)
    return result
