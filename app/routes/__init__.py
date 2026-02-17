from fastapi import APIRouter

from app.routes.agents import router as agents_router
from app.routes.meta import router as meta_router
from app.routes.settings import router as settings_router
from app.routes.steward import router as steward_router
from app.routes.ws import router as ws_router

router = APIRouter()
router.include_router(agents_router)
router.include_router(steward_router)
router.include_router(settings_router)
router.include_router(meta_router)
router.include_router(ws_router)
