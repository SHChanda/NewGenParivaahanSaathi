import uuid

from fastapi import APIRouter, Depends, Response

from ..config import settings
from ..entity.models import (
    AadhaarChallengeRequest,
    MobileChallengeRequest,
    VerifyAadhaarRequest,
    VerifyMobileRequest,
)
from ..repository import SarathiRepository
from ..services import (
    create_application_record,
    create_challenge,
    external_id,
    session_for,
    utcnow,
    verify_challenge,
)
from .dependencies import db

router = APIRouter()


@router.post("/v1/auth/mobile/challenges", status_code=201)
async def create_mobile_challenge(body: MobileChallengeRequest, repository: SarathiRepository = Depends(db)):
    return await create_challenge(body, "mobile", repository)


@router.post("/v1/auth/aadhaar/challenges", status_code=201)
async def create_aadhaar_challenge(body: AadhaarChallengeRequest, repository: SarathiRepository = Depends(db)):
    return await create_challenge(body, "aadhaar", repository)


@router.post("/v1/auth/mobile/challenges/{challengeId}/verify")
async def verify_mobile_challenge(challengeId: str, body: VerifyMobileRequest, response: Response, repository: SarathiRepository = Depends(db)):
    user_id, next_step = await verify_challenge(challengeId, body.otp, "mobile", repository)
    application = await create_application_record(repository, user_id, "mobile")
    response.set_cookie("sarathi_session", session_for(user_id), httponly=True, secure=settings.environment == "production", samesite="lax", path="/")
    return {"authenticated": True, "applicationId": external_id("app", application["id"]), "nextStep": next_step}


@router.post("/v1/auth/aadhaar/challenges/{challengeId}/verify")
async def verify_aadhaar_challenge(challengeId: str, body: VerifyAadhaarRequest, response: Response, repository: SarathiRepository = Depends(db)):
    user_id, next_step = await verify_challenge(challengeId, body.otp, "aadhaar", repository)
    application = await create_application_record(repository, user_id, "aadhaar")
    response.set_cookie("sarathi_session", session_for(user_id), httponly=True, secure=settings.environment == "production", samesite="lax", path="/")
    return {"authenticated": True, "applicationId": external_id("app", application["id"]), "nextStep": next_step}
