from fastapi import Request

from ..repository import SarathiRepository


async def db(request: Request) -> SarathiRepository:
    return request.app.state.repository
