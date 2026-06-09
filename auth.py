from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, UserResponse
from app.services.auth_service import register_user, authenticate_user, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])

#注册一个新的POST端点路径为此文件/register 
#response_model=TokenResponse fastapi自动将返回值序列化为token形式在api文档中显示
@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    #body: RegisterRequest fastapi自动从请求中解析json，校验字段
    #db: AsyncSession fastapi调用get_db()函数 返回一个数据库对话对象注入到db参数中
    user = await register_user(db, body.nickname, body.email, body.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Nickname or email already registered",
        )
    token = create_access_token(user)
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=str(user.id),
            nickname=user.nickname,
            avatar_seed=user.avatar_seed,
            created_at=user.created_at.isoformat(),
        ),
    )


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    user = await authenticate_user(db, body.email, body.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    token = create_access_token(user)
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=str(user.id),
            nickname=user.nickname,
            avatar_seed=user.avatar_seed,
            created_at=user.created_at.isoformat(),
        ),
    )
