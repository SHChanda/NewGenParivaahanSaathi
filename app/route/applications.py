from pathlib import Path
from typing import Literal
import uuid

from fastapi import APIRouter, Depends, File, UploadFile

from ..config import settings
from ..entity.models import (
    CreateApplicationRequest,
    PersonalDetails,
    SignRequest,
    VehicleCategoryRequest,
)
from ..repository import SarathiRepository
from ..services import (
    ApiError,
    create_application_record,
    current_user,
    external_id,
    require_application,
    serialize_application,
    utcnow,
)
from .dependencies import db

ALLOWED_TYPES = {"application/pdf", "image/jpeg", "image/png"}

router = APIRouter()


@router.post("/v1/applications", status_code=201)
async def create_application(body: CreateApplicationRequest, user_id: uuid.UUID = Depends(current_user), repository: SarathiRepository = Depends(db)):
    method = "mobile" if body.applicationRoute == "non_aadhaar" else "aadhaar"
    app_row = await create_application_record(repository, user_id, method)
    return await serialize_application(repository, app_row)


@router.get("/v1/applications/{applicationId}")
async def get_application(applicationId: str, user_id: uuid.UUID = Depends(current_user), repository: SarathiRepository = Depends(db)):
    return await serialize_application(repository, await require_application(repository, applicationId, user_id))


@router.put("/v1/applications/{applicationId}/personal-details")
async def replace_personal_details(applicationId: str, body: PersonalDetails, user_id: uuid.UUID = Depends(current_user), repository: SarathiRepository = Depends(db)):
    application = await require_application(repository, applicationId, user_id)
    mobile = await repository.user_mobile_number(user_id)
    if mobile and body.applicantPhoneNumber != mobile:
        raise ApiError(400, "VALIDATION_ERROR", "Use the verified mobile number.", {"applicantPhoneNumber": "This must match the verified mobile number."})
    if not mobile:
        await repository.set_user_mobile_number(user_id, body.applicantPhoneNumber)
    name, relative = body.applicantName, body.relativeName
    present = body.presentAddress
    await repository.save_personal_details(application["id"], (name.firstName, name.middleName, name.lastName, body.relativeType, relative.firstName, relative.middleName, relative.lastName, body.legalSex, body.legalSexSelfDescription, body.dateOfBirth, body.bloodGroup, body.emergencyPhoneNumber, body.identificationMarks[0], body.identificationMarks[1], body.permanentAddress.state, body.permanentAddress.pinCode, body.presentAddressSameAsPermanent, present.state if present else None, present.pinCode if present else None))
    return await serialize_application(repository, await require_application(repository, applicationId, user_id))


@router.put("/v1/applications/{applicationId}/vehicle-category")
async def replace_vehicle_category(applicationId: str, body: VehicleCategoryRequest, user_id: uuid.UUID = Depends(current_user), repository: SarathiRepository = Depends(db)):
    application = await require_application(repository, applicationId, user_id)
    code = {"two_wheeler": "MCWG", "car": "LMV-NT", "commercial": "TRANSPORT"}[body.category]
    category_id = await repository.active_category_id(code)
    if not category_id:
        raise ApiError(400, "VALIDATION_ERROR", "That vehicle category is unavailable.")
    await repository.update_vehicle_category(application["id"], category_id)
    return await serialize_application(repository, await require_application(repository, applicationId, user_id))


@router.put("/v1/applications/{applicationId}/documents/{documentType}", status_code=201)
async def upload_document(applicationId: str, documentType: Literal["age_proof", "address_proof"], file: UploadFile = File(...), user_id: uuid.UUID = Depends(current_user), repository: SarathiRepository = Depends(db)):
    application = await require_application(repository, applicationId, user_id)
    if file.content_type not in ALLOWED_TYPES:
        raise ApiError(415, "UNSUPPORTED_MEDIA_TYPE", "Use a JPG, PNG, or PDF file.")
    content = await file.read(512001)
    if not content or len(content) > 512000:
        raise ApiError(413, "DOCUMENT_TOO_LARGE", "Use a file no larger than 500 KB.")
    document_id = uuid.uuid4()
    filename = Path(file.filename or "document").name
    private_name = f"{application['id']}/{document_id}{Path(filename).suffix.lower()}"
    target = settings.local_storage_path / private_name
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(content)
    await repository.insert_document((document_id, application["id"], documentType, filename, private_name, file.content_type, len(content)))
    return {"documentId": external_id("doc", document_id), "type": documentType, "filename": filename, "mediaType": file.content_type, "sizeBytes": len(content), "status": "accepted"}


@router.post("/v1/applications/{applicationId}/mock-signature", status_code=201)
async def create_mock_signature(applicationId: str, user_id: uuid.UUID = Depends(current_user), repository: SarathiRepository = Depends(db)):
    application = await require_application(repository, applicationId, user_id)
    signature_id = external_id("signature", uuid.uuid4())
    created_at = utcnow()
    await repository.set_mock_signature(application["id"], created_at)
    return {"signatureId": signature_id, "createdAt": created_at.isoformat()}


@router.get("/v1/applications/{applicationId}/self-attested-form")
async def get_self_attested_form(applicationId: str, user_id: uuid.UUID = Depends(current_user), repository: SarathiRepository = Depends(db)):
    application = await require_application(repository, applicationId, user_id)
    await repository.mark_form_previewed(application["id"])
    fresh = await require_application(repository, applicationId, user_id)
    return {"applicationId": applicationId, "version": 1, "details": await serialize_application(repository, fresh), "signed": bool(fresh["digitally_signed_at"]), "signedAt": fresh["digitally_signed_at"].isoformat() if fresh["digitally_signed_at"] else None}


@router.post("/v1/applications/{applicationId}/self-attested-form/sign")
async def sign_self_attested_form(applicationId: str, body: SignRequest, user_id: uuid.UUID = Depends(current_user), repository: SarathiRepository = Depends(db)):
    application = await require_application(repository, applicationId, user_id)
    if not application["mock_signature_created_at"] or not application["form_previewed_at"] or not body.signatureId.startswith("signature_"):
        raise ApiError(409, "CONFLICT", "Create a mock signature and preview the form before signing.")
    await repository.set_form_signed(application["id"])
    return await get_self_attested_form(applicationId, user_id, repository)


@router.post("/v1/applications/{applicationId}/documents/submit")
async def submit_documents(applicationId: str, user_id: uuid.UUID = Depends(current_user), repository: SarathiRepository = Depends(db)):
    application = await require_application(repository, applicationId, user_id)
    type_names = {record["document_type"] for record in await repository.accepted_document_types(application["id"])}
    if not {"age_proof", "address_proof"}.issubset(type_names) or not application["digitally_signed_at"]:
        raise ApiError(409, "CONFLICT", "Upload both proofs and digitally sign the form before submitting.")
    await repository.submit_documents(application["id"])
    return await serialize_application(repository, await require_application(repository, applicationId, user_id))


@router.get("/v1/applications/{applicationId}/status")
async def get_application_status(applicationId: str, user_id: uuid.UUID = Depends(current_user), repository: SarathiRepository = Depends(db)):
    application = await require_application(repository, applicationId, user_id)
    summary = await serialize_application(repository, application)
    tasks = ("vehicle_category", "documents", "test_slot", "mock_test", "learner_licence")
    next_action = next((tasks[index] for index, task in enumerate(tasks) if summary["tasks"].get(task) != "completed"), "complete")
    return {"applicationId": applicationId, "status": summary["status"], "tasks": summary["tasks"], "nextAction": next_action, "updatedAt": summary["updatedAt"]}
