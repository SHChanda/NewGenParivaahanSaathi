import json
from datetime import date, datetime, time
from typing import Any
from uuid import UUID

import asyncpg

from .database import Database


class SlotsRepository:
    database: Database

    async def list_slots(self, from_date: date | None) -> list[asyncpg.Record]:
        return await self.database.routine_fetch("api_list_slots", from_date)

    async def create_hold(self, slot_id: UUID, application_id: UUID, hold_id: UUID, expires_at: datetime) -> asyncpg.Record | None:
        return await self.database.routine_fetchrow("api_create_hold", slot_id, application_id, hold_id, expires_at)

    async def confirm_hold(self, hold_id: UUID, user_id: UUID, booking_id: UUID, booking_number: str) -> tuple[Any, Any]:
        payload = await self.database.routine_fetchval("api_confirm_hold", hold_id, user_id, booking_id, booking_number)
        payload = json.loads(payload) if isinstance(payload, str) else payload
        return self._typed_json(payload["hold"]), self._typed_json(payload["slot"])

    @staticmethod
    def _typed_json(value: Any) -> dict[str, Any] | None:
        if value is None:
            return None
        result = dict(value)
        for key in ("id", "slot_id", "application_id", "user_id"):
            if key in result and result[key] is not None:
                result[key] = UUID(result[key])
        if isinstance(result.get("expires_at"), str):
            result["expires_at"] = datetime.fromisoformat(result["expires_at"])
        if isinstance(result.get("slot_date"), str):
            result["slot_date"] = date.fromisoformat(result["slot_date"])
        for key in ("start_time", "end_time"):
            if isinstance(result.get(key), str):
                result[key] = time.fromisoformat(result[key])
        return result

    async def join_waitlist(self, application_id: UUID, slot_id: UUID, waitlist_id: UUID) -> asyncpg.Record:
        return await self.database.routine_fetchrow("api_join_waitlist", application_id, slot_id, waitlist_id)
