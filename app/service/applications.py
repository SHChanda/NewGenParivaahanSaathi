from datetime import date
import uuid
from typing import Any, Literal

import asyncpg

from ..repository import SarathiRepository
from .common import ApiError, external_id, parse_external_id


def category_api(code: str | None) -> str | None:
    return {"MCWG": "two_wheeler", "LMV-NT": "car", "TRANSPORT": "commercial"}.get(code or "")


async def require_application(repository: SarathiRepository, application_id: str, user_id: uuid.UUID) -> asyncpg.Record:
    row = await repository.find_application(parse_external_id(application_id, "app"), user_id)
    if not row:
        raise ApiError(404, "NOT_FOUND", "Application not found.")
    return row


async def owned_app_for_body(repository: SarathiRepository, application_id: str, user_id: uuid.UUID) -> asyncpg.Record:
    return await require_application(repository, application_id, user_id)


async def create_application_record(repository: SarathiRepository, user_id: uuid.UUID, method: Literal["aadhaar", "mobile"]) -> asyncpg.Record:
    from secrets import token_hex

    reference = f"DEMO-{date.today().year}-{token_hex(4).upper()}"
    return await repository.create_application(user_id, method, uuid.uuid4(), reference)


async def serialize_application(repository: SarathiRepository, application: asyncpg.Record) -> dict[str, Any]:
    tasks = await repository.application_tasks(application["id"])
    task_map = {task["task_code"]: {"cannot_start_yet": "blocked"}.get(task["status"], task["status"]) for task in tasks}
    details = await repository.personal_details(application["id"])
    category = await repository.vehicle_category(application["vehicle_category_id"]) if application["vehicle_category_id"] else None
    payload: dict[str, Any] = {"applicationId": external_id("app", application["id"]), "referenceNumber": application["reference_number"], "route": "non_aadhaar" if application["application_method"] == "mobile" else "aadhaar", "status": {"documents_pending": "in_progress", "slot_pending": "in_progress", "licence_issued": "licence_issued"}.get(application["status"], application["status"]), "tasks": task_map, "createdAt": application["created_at"].isoformat(), "updatedAt": application["updated_at"].isoformat()}
    if category:
        payload["vehicleCategory"] = category_api(category["code"])
    if details:
        dob = details["date_of_birth"]
        age = date.today().year - dob.year - ((date.today().month, date.today().day) < (dob.month, dob.day))
        payload["personalDetails"] = {"applicantName": {"firstName": details["first_name"], "middleName": details["middle_name"], "lastName": details["last_name"]}, "relativeType": details["relative_type"], "relativeName": {"firstName": details["relative_first_name"], "middleName": details["relative_middle_name"], "lastName": details["relative_last_name"]}, "legalSex": details["legal_sex"], "legalSexSelfDescription": details["sex_self_description"], "dateOfBirth": dob.isoformat(), "age": age, "bloodGroup": details["blood_group"], "applicantPhoneNumber": await repository.user_mobile_number(application["user_id"]), "emergencyPhoneNumber": details["emergency_phone"], "identificationMarks": [details["identification_mark_1"], details["identification_mark_2"]], "permanentAddress": {"state": details["permanent_state"], "pinCode": details["permanent_pin_code"]}, "presentAddressSameAsPermanent": details["present_address_same_as_permanent"], "presentAddress": None if details["present_address_same_as_permanent"] else {"state": details["present_state"], "pinCode": details["present_pin_code"]}, "declarationAccepted": bool(details["declaration_accepted_at"])}
    return payload
