import secrets
import uuid
from datetime import date, timedelta

from fastapi import APIRouter, Depends, Response

from ..repository import SarathiRepository
from ..services import ApiError, current_user, require_application
from .dependencies import db

router = APIRouter()


@router.get("/v1/applications/{applicationId}/licence")
async def download_licence(applicationId: str, user_id: uuid.UUID = Depends(current_user), repository: SarathiRepository = Depends(db)):
    application = await require_application(repository, applicationId, user_id)
    if application["status"] not in {"passed", "licence_issued"}:
        raise ApiError(409, "CONFLICT", "Pass the mock test before downloading the mock licence.")
    category = await repository.learner_category(application["vehicle_category_id"])
    licence = await repository.learner_licence(application["id"])
    if not licence:
        licence_id = uuid.uuid4()
        issued = date.today()
        licence = await repository.issue_learner_licence((licence_id, application["id"], f"MOCK-LL-{secrets.token_hex(4).upper()}", category, issued, issued + timedelta(days=183)))
    text = f"Sarathi Next Prototype\\nMock Learner Licence\\n{licence['licence_number']}\\nCategory: {licence['category_code']}\\nValid until: {licence['valid_until']}"
    pdf = ("%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n4 0 obj<</Length " + str(len(text) + 35) + ">>stream\nBT /F1 12 Tf 72 720 Td (" + text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)").replace("\n", ") Tj 0 -18 Td (") + ") Tj ET\nendstream endobj\n5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\nxref\n0 6\n0000000000 65535 f \ntrailer<</Size 6/Root 1 0 R>>\nstartxref\n0\n%%EOF").encode()
    return Response(pdf, media_type="application/pdf", headers={"Content-Disposition": f'attachment; filename="{applicationId}-mock-licence.pdf"'})
