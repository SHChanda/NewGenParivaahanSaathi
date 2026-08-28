import uuid

import asyncpg

from ..repository import SarathiRepository
from .common import ApiError, parse_external_id


async def owned_test(repository: SarathiRepository, test_id: str, user_id: uuid.UUID) -> asyncpg.Record:
    test = await repository.find_test(parse_external_id(test_id, "test"), user_id)
    if not test:
        raise ApiError(404, "NOT_FOUND", "Test attempt not found.")
    return test
