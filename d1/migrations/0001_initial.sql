-- D1 demo schema for Sarathi Next.
-- This is intentionally separate from Database/, which remains PostgreSQL source of truth.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  mobile_number TEXT UNIQUE,
  name TEXT,
  email TEXT,
  language_preference TEXT NOT NULL DEFAULT 'en' CHECK (language_preference IN ('en', 'hi')),
  mobile_verified_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vehicle_categories (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  vehicle_category_id TEXT REFERENCES vehicle_categories(id),
  application_method TEXT NOT NULL CHECK (application_method IN ('aadhaar', 'mobile')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','documents_pending','slot_pending','test_pending','passed','failed','licence_issued','cancelled')),
  current_step TEXT NOT NULL DEFAULT 'vehicle_category' CHECK (current_step IN ('vehicle_category','documents','slot','mock_test','learner_licence','complete')),
  identity_verified_at TEXT,
  status_updates_consent_at TEXT,
  mock_signature_created_at TEXT,
  form_previewed_at TEXT,
  digitally_signed_at TEXT,
  form_submitted_at TEXT,
  reference_number TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS application_personal_details (
  application_id TEXT PRIMARY KEY REFERENCES applications(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT NOT NULL,
  relative_type TEXT NOT NULL CHECK (relative_type IN ('father','mother','husband','guardian')),
  relative_first_name TEXT NOT NULL,
  relative_middle_name TEXT,
  relative_last_name TEXT NOT NULL,
  legal_sex TEXT NOT NULL CHECK (legal_sex IN ('female','male','non_binary','prefer_not_to_say','self_describe')),
  sex_self_description TEXT,
  date_of_birth TEXT NOT NULL,
  blood_group TEXT,
  emergency_phone TEXT,
  identification_mark_1 TEXT NOT NULL,
  identification_mark_2 TEXT,
  permanent_state TEXT NOT NULL,
  permanent_pin_code TEXT NOT NULL CHECK (length(permanent_pin_code) = 6 AND permanent_pin_code GLOB '[0-9]*'),
  present_address_same_as_permanent INTEGER NOT NULL DEFAULT 1 CHECK (present_address_same_as_permanent IN (0, 1)),
  present_state TEXT,
  present_pin_code TEXT,
  declaration_accepted_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS application_tasks (
  id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  task_code TEXT NOT NULL CHECK (task_code IN ('vehicle_category','documents','test_slot','mock_test','learner_licence')),
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started','in_progress','completed','cannot_start_yet')),
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(application_id, task_code)
);

CREATE TABLE IF NOT EXISTS identity_verifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  verification_method TEXT NOT NULL CHECK (verification_method IN ('aadhaar','mobile')),
  masked_identifier TEXT NOT NULL,
  otp_sent_at TEXT,
  verified_at TEXT,
  consent_data TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('age_proof','address_proof','photograph','mock_signature')),
  original_filename TEXT NOT NULL,
  storage_key TEXT,
  mime_type TEXT NOT NULL,
  file_size_bytes INTEGER NOT NULL CHECK (file_size_bytes > 0 AND file_size_bytes <= 512000),
  validation_status TEXT NOT NULL DEFAULT 'pending' CHECK (validation_status IN ('pending','accepted','rejected')),
  validation_message TEXT,
  uploaded_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS test_centres (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  district TEXT,
  state TEXT,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS test_slots (
  id TEXT PRIMARY KEY,
  centre_id TEXT NOT NULL REFERENCES test_centres(id),
  slot_date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  booked_count INTEGER NOT NULL DEFAULT 0 CHECK (booked_count BETWEEN 0 AND capacity),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed','cancelled')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(centre_id, slot_date, start_time)
);

CREATE TABLE IF NOT EXISTS slot_holds (
  id TEXT PRIMARY KEY,
  slot_id TEXT NOT NULL REFERENCES test_slots(id) ON DELETE CASCADE,
  application_id TEXT REFERENCES applications(id) ON DELETE CASCADE,
  hold_channel TEXT NOT NULL DEFAULT 'application' CHECK (hold_channel IN ('application','direct')),
  direct_booking_token TEXT,
  expires_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','converted','expired','cancelled')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  application_id TEXT REFERENCES applications(id),
  slot_id TEXT NOT NULL REFERENCES test_slots(id),
  booking_channel TEXT NOT NULL DEFAULT 'application' CHECK (booking_channel IN ('application','direct')),
  direct_booking_token TEXT,
  mock_payment_confirmed_at TEXT,
  booking_number TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('held','confirmed','cancelled','completed','no_show')),
  booked_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  cancelled_at TEXT,
  UNIQUE(application_id, slot_id)
);

CREATE TABLE IF NOT EXISTS waitlist_entries (
  id TEXT PRIMARY KEY,
  application_id TEXT REFERENCES applications(id) ON DELETE CASCADE,
  slot_id TEXT NOT NULL REFERENCES test_slots(id) ON DELETE CASCADE,
  entry_channel TEXT NOT NULL DEFAULT 'application' CHECK (entry_channel IN ('application','direct')),
  direct_booking_token TEXT,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting','notified','accepted','cancelled')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notified_at TEXT,
  UNIQUE(application_id, slot_id)
);

CREATE TABLE IF NOT EXISTS test_questions (
  id TEXT PRIMARY KEY,
  question_text TEXT NOT NULL,
  question_order INTEGER NOT NULL UNIQUE,
  topic TEXT NOT NULL,
  options TEXT NOT NULL,
  correct_option TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS test_attempts (
  id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0 CHECK (score BETWEEN 0 AND total_questions),
  total_questions INTEGER NOT NULL DEFAULT 6 CHECK (total_questions = 6),
  current_question_index INTEGER NOT NULL DEFAULT 0 CHECK (current_question_index BETWEEN 0 AND total_questions),
  passed INTEGER NOT NULL DEFAULT 0 CHECK (passed IN (0, 1)),
  started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT
);

CREATE TABLE IF NOT EXISTS test_answers (
  id TEXT PRIMARY KEY,
  attempt_id TEXT NOT NULL REFERENCES test_attempts(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES test_questions(id),
  selected_option TEXT NOT NULL,
  is_correct INTEGER NOT NULL CHECK (is_correct IN (0, 1)),
  UNIQUE(attempt_id, question_id)
);

CREATE TABLE IF NOT EXISTS learner_licences (
  id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL UNIQUE REFERENCES applications(id),
  licence_number TEXT NOT NULL UNIQUE,
  category_code TEXT NOT NULL,
  issued_at TEXT NOT NULL,
  valid_until TEXT NOT NULL CHECK (valid_until > issued_at),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired','cancelled')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT REFERENCES users(id),
  application_id TEXT REFERENCES applications(id),
  event_type TEXT NOT NULL,
  event_data TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS applications_user_idx ON applications(user_id);
CREATE INDEX IF NOT EXISTS documents_application_idx ON documents(application_id);
CREATE INDEX IF NOT EXISTS slots_date_centre_idx ON test_slots(slot_date, centre_id);
CREATE INDEX IF NOT EXISTS bookings_application_idx ON bookings(application_id);
CREATE INDEX IF NOT EXISTS active_holds_slot_idx ON slot_holds(slot_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS holds_expiry_idx ON slot_holds(expires_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS waitlist_slot_idx ON waitlist_entries(slot_id) WHERE status = 'waiting';

CREATE TRIGGER IF NOT EXISTS users_set_updated_at AFTER UPDATE ON users
BEGIN UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; END;
CREATE TRIGGER IF NOT EXISTS applications_set_updated_at AFTER UPDATE ON applications
BEGIN UPDATE applications SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; END;
CREATE TRIGGER IF NOT EXISTS personal_details_set_updated_at AFTER UPDATE ON application_personal_details
BEGIN UPDATE application_personal_details SET updated_at = CURRENT_TIMESTAMP WHERE application_id = NEW.application_id; END;
CREATE TRIGGER IF NOT EXISTS tasks_set_updated_at AFTER UPDATE ON application_tasks
BEGIN UPDATE application_tasks SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; END;
