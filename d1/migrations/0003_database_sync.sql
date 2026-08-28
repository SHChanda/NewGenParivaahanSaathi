-- Generated from Database/tables/auth_challenges.sql and Database/indexes.sql.
-- PostgreSQL functions, routines, and triggers are implemented by the Worker.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS auth_challenges (
  id TEXT PRIMARY KEY,
  method TEXT NOT NULL CHECK (method IN ('aadhaar', 'mobile')),
  masked_identifier TEXT NOT NULL,
  identifier_digest TEXT NOT NULL,
  otp_digest TEXT NOT NULL,
  locale TEXT NOT NULL CHECK (locale IN ('en', 'hi')),
  expires_at TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  consumed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS auth_challenges_expiry_idx
  ON auth_challenges(expires_at) WHERE consumed_at IS NULL;
CREATE INDEX IF NOT EXISTS identity_verifications_user_idx ON identity_verifications(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS application_tasks_application_task_idx
  ON application_tasks(application_id, task_code);
CREATE INDEX IF NOT EXISTS holds_expiry_idx ON slot_holds(expires_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS bookings_direct_token_idx
  ON bookings(direct_booking_token) WHERE direct_booking_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS waitlist_direct_token_idx
  ON waitlist_entries(direct_booking_token) WHERE direct_booking_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS waitlist_slot_idx
  ON waitlist_entries(slot_id) WHERE status = 'waiting';