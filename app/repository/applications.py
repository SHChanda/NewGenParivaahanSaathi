import json
from datetime import datetime
from typing import Any, Literal, cast
from uuid import UUID

import asyncpg

from .database import Database


class ApplicationsRepository:
    database: Database

    async def find_application(self, application_id: UUID, user_id: UUID) -> asyncpg.Record | None:
        return await self.database.routine_fetchrow("api_find_application", application_id, user_id)

    async def application_tasks(self, application_id: UUID) -> list[asyncpg.Record]:
        return await self.database.routine_fetch("api_application_tasks", application_id)

    async def personal_details(self, application_id: UUID) -> asyncpg.Record | None:
        return await self.database.routine_fetchrow("api_personal_details", application_id)

    async def vehicle_category(self, category_id: int | UUID) -> asyncpg.Record | None:
        return await self.database.routine_fetchrow("api_vehicle_code", category_id)

    async def create_application(self, user_id: UUID, method: Literal["aadhaar", "mobile"], application_id: UUID, reference: str) -> asyncpg.Record:
        return cast(asyncpg.Record, await self.database.routine_fetchrow("api_create_application", user_id, method, application_id, reference))

    async def save_personal_details(self, application_id: UUID, values: tuple[Any, ...]) -> None:
        keys = ("first_name", "middle_name", "last_name", "relative_type", "relative_first_name", "relative_middle_name", "relative_last_name", "legal_sex", "sex_self_description", "date_of_birth", "blood_group", "emergency_phone", "identification_mark_1", "identification_mark_2", "permanent_state", "permanent_pin_code", "present_address_same_as_permanent", "present_state", "present_pin_code")
        await self.database.routine_execute("api_save_personal_details", application_id, json.dumps(dict(zip(keys, values, strict=True)), default=str))

    async def active_category_id(self, code: str) -> Any:
        return await self.database.routine_fetchval("api_active_category_id", code)

    async def update_vehicle_category(self, application_id: UUID, category_id: Any) -> None:
        await self.database.routine_execute("api_update_vehicle_category", application_id, category_id)

    async def insert_document(self, values: tuple[Any, ...]) -> None:
        await self.database.routine_execute("api_insert_document", *values)

    async def set_mock_signature(self, application_id: UUID, created_at: datetime) -> None:
        await self.database.routine_execute("api_set_mock_signature", application_id, created_at)

    async def mark_form_previewed(self, application_id: UUID) -> None:
        await self.database.routine_execute("api_mark_form_previewed", application_id)

    async def set_form_signed(self, application_id: UUID) -> None:
        await self.database.routine_execute("api_set_form_signed", application_id)

    async def accepted_document_types(self, application_id: UUID) -> list[asyncpg.Record]:
        return await self.database.routine_fetch("api_accepted_document_types", application_id)

    async def submit_documents(self, application_id: UUID) -> None:
        await self.database.routine_execute("api_submit_documents", application_id)
