import json
import uuid
from datetime import timedelta

from fastapi import APIRouter, Depends, Response

from ..entity.models import TestAnswerRequest
from ..repository import SarathiRepository
from ..services import ApiError, current_user, external_id, owned_test, parse_external_id, question_payload, require_application, utcnow
from .dependencies import db

router = APIRouter()


@router.post("/v1/applications/{applicationId}/tests", status_code=201)
async def start_test(applicationId: str, user_id: uuid.UUID = Depends(current_user), repository: SarathiRepository = Depends(db)):
    application = await require_application(repository, applicationId, user_id)
    if application["current_step"] not in {"mock_test", "learner_licence", "complete"}:
        raise ApiError(409, "CONFLICT", "Book and confirm a test slot before starting the mock test.")
    existing = await repository.open_test(application["id"])
    test_id = existing["id"] if existing else uuid.uuid4()
    if not existing:
        await repository.create_test(test_id, application["id"])
    questions = await repository.test_questions()
    if len(questions) != 6:
        raise ApiError(409, "CONFLICT", "The mock question bank is not ready.")
    return {"testId": external_id("test", test_id), "questionCount": 6, "passMark": 4, "questions": [question_payload(question) for question in questions], "expiresAt": (utcnow() + timedelta(minutes=20)).isoformat()}


@router.post("/v1/tests/{testId}/answers", status_code=204)
async def submit_test_answer(testId: str, body: TestAnswerRequest, user_id: uuid.UUID = Depends(current_user), repository: SarathiRepository = Depends(db)):
    test = await owned_test(repository, testId, user_id)
    if test["completed_at"]:
        raise ApiError(409, "CONFLICT", "This test has already been submitted.")
    question_id = parse_external_id(body.questionId, "question")
    question = await repository.find_question(question_id)
    if not question:
        raise ApiError(409, "CONFLICT", "Question is not part of this mock test.")
    options = question["options"] if isinstance(question["options"], list) else json.loads(question["options"])
    if body.answerId not in {option["id"] for option in options}:
        raise ApiError(409, "CONFLICT", "Choose a valid answer.")
    await repository.save_test_answer((uuid.uuid4(), test["id"], question_id, body.answerId, body.answerId == question["correct_option"]))
    return Response(status_code=204)


@router.post("/v1/tests/{testId}/submit")
async def submit_test(testId: str, user_id: uuid.UUID = Depends(current_user), repository: SarathiRepository = Depends(db)):
    test = await owned_test(repository, testId, user_id)
    if test["completed_at"]:
        raise ApiError(409, "CONFLICT", "This test has already been submitted.")
    answer_count = await repository.test_answer_count(test["id"])
    if answer_count != 6:
        raise ApiError(409, "CONFLICT", "Answer all six questions before submitting.")
    score = await repository.test_score(test["id"])
    passed = score >= 4
    await repository.complete_test(test["id"], test["application_id"], score, passed)
    return {"testId": testId, "score": score, "total": 6, "passed": passed, "completedAt": utcnow().isoformat()}
