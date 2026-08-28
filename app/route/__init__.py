"""HTTP route modules grouped by API domain."""

from fastapi import APIRouter

from .applications import router as applications_router
from .auth import router as auth_router
from .health import router as health_router
from .licence import router as licence_router
from .slots import router as slots_router
from .tests import router as tests_router

router = APIRouter()
router.include_router(health_router)
router.include_router(auth_router)
router.include_router(applications_router)
router.include_router(slots_router)
router.include_router(tests_router)
router.include_router(licence_router)

route_routers = (
	health_router,
	auth_router,
	applications_router,
	slots_router,
	tests_router,
	licence_router,
)

__all__ = ["route_routers", "router"]
