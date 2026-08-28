from typing import Any
from uuid import UUID

import asyncpg

from .database import Database


class TestsRepository:
    database: Database

    async def open_test(self, application_id: UUID) -> asyncpg.Record | None:
        return await self.database.routine_fetchrow("api_open_test", application_id)

    async def create_test(self, test_id: UUID, application_id: UUID) -> None:
        await self.database.routine_execute("api_create_test", test_id, application_id)

    async def test_questions(self) -> list[asyncpg.Record]:
        return await self.database.routine_fetch("api_test_questions")

    async def find_test(self, test_id: UUID, user_id: UUID) -> asyncpg.Record | None:
        return await self.database.routine_fetchrow("api_find_test", test_id, user_id)

    async def find_question(self, question_id: UUID) -> asyncpg.Record | None:
        return await self.database.routine_fetchrow("api_find_question", question_id)

    async def save_test_answer(self, values: tuple[Any, ...]) -> None:
        await self.database.routine_execute("api_save_test_answer", *values)

    async def test_answer_count(self, test_id: UUID) -> int:
        return await self.database.routine_fetchval("api_test_answer_count", test_id)

    async def test_score(self, test_id: UUID) -> int:
        return await self.database.routine_fetchval("api_test_score", test_id)

    async def complete_test(self, test_id: UUID, application_id: UUID, score: int, passed: bool) -> None:
        await self.database.routine_execute("api_complete_test", test_id, application_id, score, passed)
