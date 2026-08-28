from fastapi import APIRouter

from ..services import utcnow

router = APIRouter()


@router.get("/v1/health")
async def get_health():
    return {"status": "ok", "version": "1.0.0", "time": utcnow().isoformat()}
