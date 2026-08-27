# Sarathi Next

An Indian civic-service prototype for a Learner's Licence journey. It is not an official government service.

## Deployment paths

- `Database/` is the PostgreSQL source schema retained for a future production service.
- `d1/migrations/` is the separate SQLite-compatible D1 schema for the hosted demo.
- `src/worker.ts` is the demo API. It saves structured application data to the `DB` D1 binding and uploads files to the private `DOCUMENTS` R2 binding.
- `public/` is the mobile-first demo UI.

## Run the hosted-demo scaffold locally

1. Install Node.js 20+ and run `npm install`.
2. Create the remote D1 database and R2 bucket, then replace `database_id` in `wrangler.jsonc` with the D1 database ID.
3. Run `npm run d1:migrate:local` to apply the demo schema locally. Use `npm run d1:migrate:remote` only after the remote binding is configured.
4. Run `npm run dev`.

## Publish with Codex Sites

Open the project in ChatGPT Sites and ask: **“Deploy this project with Sites. Use the D1 binding `DB` and R2 binding `DOCUMENTS`, apply the migrations under `d1/migrations`, keep uploaded documents private, and give me the deployment URL.”**

Review the generated migration and deployment before publishing. The D1 schema is a demo port, not a PostgreSQL migration mechanism; production should continue from the PostgreSQL schema and use its own managed PostgreSQL and private object-storage services.
