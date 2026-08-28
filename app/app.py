import json
import uuid
from contextlib import asynccontextmanager
from typing import Any, cast

from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .repository import Database, SarathiRepository
from .route import route_routers
from .services import ApiError, AuthService, external_id

database = Database(settings.database_url)
repository = SarathiRepository(database)
auth_service = AuthService(settings.secret_key)


@asynccontextmanager
async def lifespan(application: FastAPI):
    application.state.database = database
    application.state.pool = await database.connect()
    application.state.repository = repository
    settings.local_storage_path.mkdir(parents=True, exist_ok=True)
    yield
    await database.close()


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="FastAPI implementation of openapi.yaml",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[item.strip() for item in settings.cors_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def api_error_response(request: Request, exc: ApiError):
    request_id = request.headers.get("X-Request-ID", external_id("req", uuid.uuid4()))
    payload = dict(cast(dict[str, Any], exc.detail)) | {"requestId": request_id}
    return Response(
        content=json.dumps({"error": payload}),
        status_code=exc.status_code,
        media_type="application/json",
        headers={"X-Request-ID": request_id},
    )


@app.exception_handler(ApiError)
async def api_error_handler(request: Request, exc: ApiError):
    return await api_error_response(request, exc)


@app.exception_handler(HTTPException)
async def http_error_handler(request: Request, exc: HTTPException):
    if isinstance(exc.detail, dict) and "code" in exc.detail:
        detail = cast(dict[str, Any], exc.detail)
        return await api_error_response(
            request,
            ApiError(
                exc.status_code,
                str(detail["code"]),
                str(detail["message"]),
                detail.get("fieldErrors"),
            ),
        )
    return await api_error_response(request, ApiError(exc.status_code, "REQUEST_ERROR", str(exc.detail)))


@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError):
    field_errors = {str(error["loc"][-1]): error["msg"] for error in exc.errors() if error.get("loc")}
    return await api_error_response(request, ApiError(400, "VALIDATION_ERROR", "Check the highlighted fields.", field_errors))


for route_router in route_routers:
    app.include_router(route_router)