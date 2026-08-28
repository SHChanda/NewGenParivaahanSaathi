from typing import Any, cast
from uuid import UUID

import asyncpg

from .database import Database


class LicenceRepository:
    database: Database

    async def learner_category(self, category_id: Any) -> Any:
        return await self.database.routine_fetchval("api_learner_category", category_id)

    async def learner_licence(self, application_id: UUID) -> asyncpg.Record | None:
        return await self.database.routine_fetchrow("api_learner_licence", application_id)

    async def issue_learner_licence(self, values: tuple[Any, ...]) -> asyncpg.Record:
        return cast(asyncpg.Record, await self.database.routine_fetchrow("api_issue_learner_licence", *values))
