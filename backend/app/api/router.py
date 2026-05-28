from fastapi import APIRouter
from app.api.v1 import auth, dialogue, assessment, community, mood, memories, night

router = APIRouter(prefix="/api/v1")
router.include_router(auth.router)
router.include_router(dialogue.router)
router.include_router(assessment.router)
router.include_router(community.router)
router.include_router(mood.router)
router.include_router(memories.router)
router.include_router(night.router)
