-- Sarathi Next database schema entry point.
-- Execute with psql, not by sending this file as plain SQL:
--   psql -v ON_ERROR_STOP=1 -f Database/schema.sql

\set ON_ERROR_STOP on
BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE SCHEMA IF NOT EXISTS sarathi;
SET search_path TO sarathi, public;

\ir functions.sql
\ir tables/auth_challenges.sql
\ir tables/users.sql
\ir tables/vehicle_categories.sql
\ir tables/applications.sql
\ir tables/identity_verifications.sql
\ir tables/application_personal_details.sql
\ir tables/application_tasks.sql
\ir tables/documents.sql
\ir tables/test_centres.sql
\ir tables/test_slots.sql
\ir tables/slot_holds.sql
\ir tables/bookings.sql
\ir tables/waitlist_entries.sql
\ir tables/test_questions.sql
\ir tables/test_attempts.sql
\ir tables/test_answers.sql
\ir tables/learner_licences.sql
\ir tables/audit_events.sql
\ir indexes.sql
\ir triggers.sql
\ir routines.sql

COMMIT;
