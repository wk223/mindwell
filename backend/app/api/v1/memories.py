from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.memory import MemoryCreate, MemoryResponse, MemoryListResponse
from app.services.memory_service import MemoryService

router = APIRouter(prefix="/memories", tags=["memories"])


@router.get("", response_model=MemoryListResponse)
async def list_memories(
    category: str | None = Query(None),
    search: str | None = Query(None),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = MemoryService(db)
    return await service.list_memories(str(user.id), category, search)


@router.get("/{memory_id}", response_model=MemoryResponse)
async def get_memory(
    memory_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = MemoryService(db)
    memory = await service.get_memory(str(user.id), memory_id)
    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")
    return memory


@router.post("", response_model=MemoryResponse)
async def create_memory(
    body: MemoryCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = MemoryService(db)
    return await service.create_memory(
        user_id=str(user.id),
        key=body.key,
        content=body.content,
        category=body.category,
        importance=body.importance,
    )


@router.delete("/{memory_id}")
async def delete_memory(
    memory_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = MemoryService(db)
    deleted = await service.delete_memory(str(user.id), memory_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Memory not found")
    return {"status": "deleted"}


@router.delete("")
async def clear_memories(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = MemoryService(db)
    count = await service.clear_all(str(user.id))
    return {"status": "cleared", "deleted_count": count}
