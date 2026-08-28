from datetime import UTC, datetime, timedelta
import secrets
import uuid
from typing import Literal
from uuid import UUID

import jwt
from fastapi import Cookie

from ..config import settings
from ..entity.models import AadhaarChallengeRequest, MobileChallengeRequest
from ..repository import SarathiRepository
from .common import ApiError, digest, external_id, mask, utcnow


class AuthService:
    """Application authentication rules, independent from HTTP and SQL."""

    def __init__(self, secret_key: str, audience: str = "sarathi-next"):
        self.secret_key = secret_key
        self.audience = audience

    def create_session(self, user_id: UUID, lifetime: timedelta = timedelta(hours=4)) -> str:
        return jwt.encode(
            {"sub": str(user_id), "aud": self.audience, "exp": datetime.now(UTC) + lifetime},
            self.secret_key,
            algorithm="HS256",
        )


async def current_user(sarathi_session: str | None = Cookie(default=None)) -> uuid.UUID:
    if not sarathi_session:
        raise ApiError(401, "UNAUTHENTICATED", "Sign in to continue.")
    try:
        token = jwt.decode(sarathi_session, settings.secret_key, algorithms=["HS256"], audience="sarathi-next")
        return uuid.UUID(token["sub"])
    except (jwt.PyJWTError, ValueError) as error:
        raise ApiError(401, "UNAUTHENTICATED", "Your session has expired. Sign in again.") from error


def session_for(user_id: uuid.UUID) -> str:
    return AuthService(settings.secret_key).create_session(user_id)


async def create_challenge(body: MobileChallengeRequest | AadhaarChallengeRequest, method: Literal["mobile", "aadhaar"], repository: SarathiRepository):
    identifier = body.mobileNumber if isinstance(body, MobileChallengeRequest) else body.aadhaarNumber
    challenge_id, otp = external_id("challenge", uuid.uuid4()), f"{secrets.randbelow(1_000_000):06d}"
    expires_at = utcnow() + timedelta(minutes=5)
    await repository.create_challenge(challenge_id, method, mask(identifier), digest(identifier), digest(otp), body.locale, expires_at)
    response = {"challengeId": challenge_id, "expiresAt": expires_at.isoformat(), "resendAfterSeconds": 30, "maskedDestination": mask(identifier)}
    if settings.environment != "production":
        response["mockOtp"] = otp
    return response


async def verify_challenge(challenge_id: str, otp: str, method: str, repository: SarathiRepository) -> tuple[uuid.UUID, str]:
    row = await repository.consume_challenge(challenge_id, method)
    if not row or row["expires_at"] < utcnow():
        raise ApiError(401, "OTP_EXPIRED", "This OTP has expired. Request a new one.")
    if row["attempts"] > 5:
        raise ApiError(429, "RATE_LIMITED", "Too many OTP attempts. Request a new OTP.")
    if not secrets.compare_digest(row["otp_digest"], digest(otp)):
        raise ApiError(401, "OTP_INVALID", "Enter the OTP shown in the demo.")
    user_id = await repository.create_user_from_challenge(row["locale"])
    await repository.mark_challenge_consumed(challenge_id)
    return user_id, "personal_details" if method == "mobile" else "task_list"
