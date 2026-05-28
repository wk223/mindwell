from uuid import UUID

from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.base import utcnow
from app.models.community import Post, Comment


TRIGGER_WARNING_KEYWORDS = [
    "自杀", "自残", "自伤", "性侵", "虐待", "家暴", "死亡",
    "创伤", "PTSD", "抑郁", "焦虑发作",
]

DEFAULT_PAGE_SIZE = 20


class CommunityService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_post(
        self,
        user_id: str,
        display_name: str,
        title: str,
        content: str,
        content_labels: list[str] | None = None,
        is_anonymous: bool = True,
    ) -> dict:
        moderation = self._moderate_text(f"{title} {content}")

        post = Post(
            user_id=UUID(user_id),
            display_name=display_name,
            title=title,
            content=content,
            content_labels=content_labels or [],
            is_anonymous=is_anonymous,
            moderation_status=moderation,
        )
        self.db.add(post)
        await self.db.commit()
        await self.db.refresh(post)
        return self._post_to_dict(post)

    async def get_posts(
        self, page: int = 1, limit: int = DEFAULT_PAGE_SIZE, moderation_status: str = "approved"
    ) -> dict:
        offset = (page - 1) * limit

        # Count subquery
        count_stmt = (
            select(func.count(Post.id))
            .where(Post.moderation_status == moderation_status)
        )
        total_result = await self.db.execute(count_stmt)
        total = total_result.scalar() or 0

        # Posts with comment count — single JOIN query instead of N+1
        comment_count_subq = (
            select(Comment.post_id, func.count(Comment.id).label("cnt"))
            .where(Comment.moderation_status == "approved")
            .group_by(Comment.post_id)
            .subquery()
        )
        stmt = (
            select(Post, func.coalesce(comment_count_subq.c.cnt, 0).label("comment_count"))
            .outerjoin(comment_count_subq, Post.id == comment_count_subq.c.post_id)
            .where(Post.moderation_status == moderation_status)
            .order_by(Post.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        rows = result.all()

        post_list = []
        for p, cc in rows:
            d = self._post_to_dict(p)
            d["comment_count"] = int(cc)
            post_list.append(d)

        return {
            "posts": post_list,
            "total": total,
            "page": page,
            "limit": limit,
        }

    async def get_post(self, post_id: str) -> dict | None:
        stmt = select(Post).where(Post.id == post_id)
        result = await self.db.execute(stmt)
        post = result.scalars().first()
        if not post:
            return None

        # Get comments
        comment_stmt = (
            select(Comment)
            .where(
                and_(Comment.post_id == post_id, Comment.moderation_status == "approved")
            )
            .order_by(Comment.created_at.asc())
        )
        comment_result = await self.db.execute(comment_stmt)
        comments = comment_result.scalars().all()

        post_dict = self._post_to_dict(post)
        post_dict["comments"] = [
            {
                "id": str(c.id),
                "post_id": str(c.post_id),
                "display_name": c.display_name,
                "content": c.content,
                "is_anonymous": c.is_anonymous,
                "moderation_status": c.moderation_status,
                "created_at": c.created_at.isoformat(),
            }
            for c in comments
        ]
        post_dict["comment_count"] = len(comments)
        return post_dict

    async def create_comment(
        self,
        post_id: str,
        user_id: str,
        display_name: str,
        content: str,
        is_anonymous: bool = True,
    ) -> dict:
        moderation = self._moderate_text(content)

        comment = Comment(
            post_id=UUID(post_id),
            user_id=UUID(user_id),
            display_name=display_name,
            content=content,
            is_anonymous=is_anonymous,
            moderation_status=moderation,
        )
        self.db.add(comment)

        # Update post timestamp
        stmt = select(Post).where(Post.id == post_id)
        result = await self.db.execute(stmt)
        post = result.scalars().first()
        if post:
            post.updated_at = utcnow()

        await self.db.commit()
        await self.db.refresh(comment)

        return {
            "id": str(comment.id),
            "post_id": str(comment.post_id),
            "display_name": comment.display_name,
            "content": comment.content,
            "is_anonymous": comment.is_anonymous,
            "moderation_status": comment.moderation_status,
            "created_at": comment.created_at.isoformat(),
        }

    async def delete_post(self, user_id: str, post_id: str) -> bool:
        stmt = select(Post).where(
            and_(Post.id == post_id, Post.user_id == user_id)
        )
        result = await self.db.execute(stmt)
        post = result.scalars().first()
        if not post:
            return False
        await self.db.delete(post)
        await self.db.commit()
        return True

    async def report_post(self, post_id: str) -> dict:
        stmt = select(Post).where(Post.id == post_id)
        result = await self.db.execute(stmt)
        post = result.scalars().first()
        if not post:
            return {"status": "not_found"}

        post.moderation_status = "flagged"
        await self.db.commit()
        return {"status": "flagged"}

    def _moderate_text(self, text: str) -> str:
        """Basic automated moderation. Returns 'approved' or 'pending'."""
        # Check for trigger keywords — auto-flag for review
        has_trigger = any(
            kw in text for kw in TRIGGER_WARNING_KEYWORDS
        )
        # Auto-detect content labels
        if has_trigger:
            return "pending"
        return "approved"

    def detect_content_labels(self, text: str) -> list[str]:
        """Auto-detect trigger warning labels for a post."""
        labels = []
        mapping = {
            "自杀": "trigger:suicide",
            "自残": "trigger:self_harm",
            "自伤": "trigger:self_harm",
            "性侵": "trigger:sexual_assault",
            "虐待": "trigger:abuse",
            "家暴": "trigger:domestic_violence",
            "创伤": "trigger:trauma",
        }
        for keyword, label in mapping.items():
            if keyword in text:
                labels.append(label)
        return list(set(labels))

    def _post_to_dict(self, post: Post) -> dict:
        return {
            "id": str(post.id),
            "display_name": post.display_name,
            "title": post.title,
            "content": post.content,
            "content_labels": post.content_labels or [],
            "is_anonymous": post.is_anonymous,
            "moderation_status": post.moderation_status,
            "comment_count": 0,
            "created_at": post.created_at.isoformat(),
            "updated_at": post.updated_at.isoformat(),
        }
