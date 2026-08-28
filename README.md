# Sarathi Next

Sarathi Next is a Learner's Licence prototype. It is not an official government service.

The repository includes the website frontend in [frontend/](./frontend/) and the PostgreSQL-backed FastAPI service it calls using the contract in [openapi.yaml](./openapi.yaml).

## FastAPI service

- [app/main.py](./app/main.py) is the backward-compatible ASGI entrypoint.
- [app/app.py](./app/app.py) composes FastAPI, middleware, error handlers, and lifecycle.
- [app/route/](./app/route/) contains the HTTP routes grouped by API domain; [app/routes.py](./app/routes.py) keeps the legacy router import compatible.
- [app/service/](./app/service/) contains domain services; [app/services.py](./app/services.py) keeps the legacy service imports compatible.
- [app/repository/](./app/repository/) contains the PostgreSQL database and domain repositories, composed by `SarathiRepository`.
- [app/config.py](./app/config.py) loads environment-backed settings.
- [Database/](./Database/) remains the PostgreSQL source schema.
- [Database/migrations/001_api_support.sql](./Database/migrations/001_api_support.sql) adds durable mock OTP challenge support.
- `d1/migrations/0003_database_sync.sql` carries the same D1-compatible table and index additions.
- Run `npm run d1:generate-schema` after changing `Database/tables/` or `Database/indexes.sql`; it writes `d1/generated-schema.sql` from the PostgreSQL source files. PostgreSQL functions, routines, and triggers remain Worker/application logic because D1 is SQLite.
- [API_INTEGRATION.md](./API_INTEGRATION.md) explains the same-origin frontend gateway, cookies, and error format.

### Start locally

1. Create a PostgreSQL database and apply `Database/schema.sql` with `psql`.
2. Apply `Database/migrations/001_api_support.sql`.
3. Copy `.env.example` to `.env` and set a unique `DATABASE_URL` and `SECRET_KEY`.
4. Install the Python dependencies: `python -m pip install -r requirements.txt`.
5. Run: `python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000`.

The `app.main:app` import remains supported for local development and deployment; new code should import the composed application from `app.app` when it needs the application factory module.

The contract starts at `http://127.0.0.1:8000/v1`; generated OpenAPI docs are available at `/docs`.

### Frontend

- [frontend/app/](./frontend/app/) contains the Next/Vinext application shell and same-origin API gateway.
- [frontend/app.js](./frontend/app.js), [frontend/api-client.js](./frontend/api-client.js), and [frontend/styles.css](./frontend/styles.css) contain the browser journey and presentation.
- Install JavaScript dependencies with `npm install`, then run `npm run frontend:dev`.
- Set `SARATHI_API_BASE_URL=http://127.0.0.1:8000` for the gateway when using the local FastAPI service.
- Build with `npm run frontend:build` and preview with `npm run frontend:preview`.

## Demo storage and deployment

The FastAPI service writes uploaded demo documents to `LOCAL_STORAGE_PATH` for local development. Replace this implementation with a private object-storage adapter before a shared deployment; it never returns bucket paths to the frontend.

`d1/`, `src/`, and `public/` remain the earlier Cloudflare demo scaffold. The merged frontend is under `frontend/`; the legacy scaffold is retained for compatibility.
