from datetime import UTC, datetime
import hashlib
import uuid

from fastapi import HTTPException


class ApiError(HTTPException):
    def __init__(self, status_code: int, code: str, message: str, field_errors: dict[str, str] | None = None):
        super().__init__(status_code, {"code": code, "message": message, "fieldErrors": field_errors or {}})


def utcnow() -> datetime:
    return datetime.now(UTC)


def external_id(prefix: str, value: uuid.UUID) -> str:
    return f"{prefix}_{value.hex}"


def parse_external_id(value: str, prefix: str) -> uuid.UUID:
    if not value.startswith(prefix + "_"):
        raise ApiError(404, "NOT_FOUND", "The requested resource was not found.")
    try:
        return uuid.UUID(hex=value[len(prefix) + 1 :])
    except ValueError as error:
        raise ApiError(404, "NOT_FOUND", "The requested resource was not found.") from error


def digest(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()


def mask(value: str) -> str:
    return "*" * max(0, len(value) - 4) + value[-4:]
