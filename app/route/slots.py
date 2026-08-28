import secrets
import uuid
from datetime import date, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, Query

from ..entity.models import ApplicationIdRequest
from ..repository import SarathiRepository
from ..services import ApiError, current_user, external_id, owned_app_for_body, parse_external_id, slot_payload, utcnow
from .dependencies import db

router = APIRouter()


@router.get("/v1/slots")
async def list_slots(applicationId: str | None = None, from_: Annotated[date | None, Query(alias="from")] = None, repository: SarathiRepository = Depends(db)):
    rows = await repository.list_slots(from_)
    return {"slots": [slot_payload(row) for row in rows]}


@router.post("/v1/slots/{slotId}/holds", status_code=201)
async def create_slot_hold(slotId: str, body: ApplicationIdRequest, user_id: uuid.UUID = Depends(current_user), repository: SarathiRepository = Depends(db)):
    slot_id, application = parse_external_id(slotId, "slot"), await owned_app_for_body(repository, body.applicationId, user_id)
    hold_id = uuid.uuid4()
    expiry = utcnow() + timedelta(minutes=5)
    slot = await repository.create_hold(slot_id, application["id"], hold_id, expiry)
    if not slot:
        raise ApiError(409, "SLOT_UNAVAILABLE", "That slot is no longer available.")
    return {"holdId": external_id("hold", hold_id), "slot": slot_payload(slot), "expiresAt": expiry.isoformat(), "status": "held"}


@router.post("/v1/holds/{holdId}/confirm")
async def confirm_slot_hold(holdId: str, user_id: uuid.UUID = Depends(current_user), repository: SarathiRepository = Depends(db)):
    hold_id = parse_external_id(holdId, "hold")
    booking_id = uuid.uuid4()
    hold, slot = await repository.confirm_hold(hold_id, user_id, booking_id, f"BOOK-{secrets.token_hex(4).upper()}")
    if not hold or hold["status"] != "active" or hold["expires_at"] <= utcnow():
        raise ApiError(409, "HOLD_EXPIRED", "This hold has expired. Choose another slot.")
    if not slot:
        raise ApiError(409, "SLOT_UNAVAILABLE", "That slot is no longer available.")
    return {"bookingId": external_id("booking", booking_id), "slot": slot_payload(slot), "status": "confirmed", "confirmedAt": utcnow().isoformat()}


@router.post("/v1/slots/{slotId}/waitlist", status_code=201)
async def join_slot_waitlist(slotId: str, body: ApplicationIdRequest, user_id: uuid.UUID = Depends(current_user), repository: SarathiRepository = Depends(db)):
    slot_id, application = parse_external_id(slotId, "slot"), await owned_app_for_body(repository, body.applicationId, user_id)
    row = await repository.join_waitlist(application["id"], slot_id, uuid.uuid4())
    return {"waitlistId": external_id("waitlist", row["id"]), "status": row["status"]}
