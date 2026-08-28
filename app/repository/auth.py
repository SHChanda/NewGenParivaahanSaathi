from datetime import datetime
from typing import Literal
from uuid import UUID

from .database import Database


class AuthRepository:
    database: Database

    async def create_challenge(self, challenge_id: str, method: Literal["mobile", "aadhaar"], masked_identifier: str, identifier_digest: str, otp_digest: str, locale: str, expires_at: datetime) -> None:
        await self.database.routine_execute("api_create_challenge", challenge_id, method, masked_identifier, identifier_digest, otp_digest, locale, expires_at)

    async def consume_challenge(self, challenge_id: str, method: str):
        return await self.database.routine_fetchrow("api_consume_challenge", challenge_id, method)

    async def create_user_from_challenge(self, locale: str) -> UUID:
        return await self.database.routine_fetchval("api_create_user", locale)

    async def mark_challenge_consumed(self, challenge_id: str) -> None:
        await self.database.routine_execute("api_mark_challenge_consumed", challenge_id)

    async def user_mobile_number(self, user_id: UUID) -> str | None:
        return await self.database.routine_fetchval("api_user_mobile", user_id)

    async def set_user_mobile_number(self, user_id: UUID, mobile_number: str) -> None:
        await self.database.routine_execute("api_set_user_mobile", user_id, mobile_number)
