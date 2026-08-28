-- API data access routines. Keep SQL and transaction boundaries in the database.
SET search_path TO sarathi, public;

DROP FUNCTION IF EXISTS api_save_personal_details(UUID, JSONB);
DROP FUNCTION IF EXISTS api_learner_category(UUID);

CREATE OR REPLACE FUNCTION api_find_application(p_id UUID, p_user_id UUID)
RETURNS SETOF applications LANGUAGE SQL STABLE AS $$ SELECT * FROM applications WHERE id = p_id AND user_id = p_user_id $$;
CREATE OR REPLACE FUNCTION api_application_tasks(p_application_id UUID)
RETURNS SETOF application_tasks LANGUAGE SQL STABLE AS $$ SELECT * FROM application_tasks WHERE application_id = p_application_id $$;
CREATE OR REPLACE FUNCTION api_personal_details(p_application_id UUID)
RETURNS SETOF application_personal_details LANGUAGE SQL STABLE AS $$ SELECT * FROM application_personal_details WHERE application_id = p_application_id $$;
CREATE OR REPLACE FUNCTION api_vehicle_code(p_category_id UUID)
RETURNS TABLE(code VARCHAR) LANGUAGE SQL STABLE AS $$ SELECT code FROM vehicle_categories WHERE id = p_category_id $$;
CREATE OR REPLACE FUNCTION api_user_mobile(p_user_id UUID)
RETURNS VARCHAR LANGUAGE SQL STABLE AS $$ SELECT mobile_number FROM users WHERE id = p_user_id $$;
CREATE OR REPLACE FUNCTION api_active_category_id(p_code VARCHAR)
RETURNS UUID LANGUAGE SQL STABLE AS $$ SELECT id FROM vehicle_categories WHERE code = p_code AND active $$;
CREATE OR REPLACE FUNCTION api_accepted_document_types(p_application_id UUID)
RETURNS TABLE(document_type VARCHAR) LANGUAGE SQL STABLE AS $$ SELECT document_type FROM documents WHERE application_id = p_application_id AND validation_status = 'accepted' $$;
CREATE OR REPLACE FUNCTION api_list_slots(p_from_date DATE)
RETURNS SETOF test_slots LANGUAGE SQL STABLE AS $$ SELECT * FROM test_slots WHERE status = 'open' AND slot_date >= COALESCE(p_from_date, CURRENT_DATE) ORDER BY slot_date, start_time $$;
CREATE OR REPLACE FUNCTION api_open_test(p_application_id UUID)
RETURNS SETOF test_attempts LANGUAGE SQL STABLE AS $$ SELECT * FROM test_attempts WHERE application_id = p_application_id AND completed_at IS NULL ORDER BY started_at DESC LIMIT 1 $$;
CREATE OR REPLACE FUNCTION api_test_questions()
RETURNS SETOF test_questions LANGUAGE SQL STABLE AS $$ SELECT * FROM test_questions WHERE active ORDER BY question_order LIMIT 6 $$;
CREATE OR REPLACE FUNCTION api_find_test(p_test_id UUID, p_user_id UUID)
RETURNS SETOF test_attempts LANGUAGE SQL STABLE AS $$ SELECT t.* FROM test_attempts t JOIN applications a ON a.id = t.application_id WHERE t.id = p_test_id AND a.user_id = p_user_id $$;
CREATE OR REPLACE FUNCTION api_find_question(p_question_id UUID)
RETURNS TABLE(correct_option VARCHAR, options JSONB) LANGUAGE SQL STABLE AS $$ SELECT correct_option, options FROM test_questions WHERE id = p_question_id AND active $$;
CREATE OR REPLACE FUNCTION api_test_answer_count(p_test_id UUID)
RETURNS BIGINT LANGUAGE SQL STABLE AS $$ SELECT count(*) FROM test_answers WHERE attempt_id = p_test_id $$;
CREATE OR REPLACE FUNCTION api_test_score(p_test_id UUID)
RETURNS BIGINT LANGUAGE SQL STABLE AS $$ SELECT count(*) FROM test_answers WHERE attempt_id = p_test_id AND is_correct $$;
CREATE OR REPLACE FUNCTION api_learner_category(p_category_id UUID)
RETURNS VARCHAR LANGUAGE SQL STABLE AS $$ SELECT code FROM vehicle_categories WHERE id = p_category_id $$;
CREATE OR REPLACE FUNCTION api_learner_licence(p_application_id UUID)
RETURNS SETOF learner_licences LANGUAGE SQL STABLE AS $$ SELECT * FROM learner_licences WHERE application_id = p_application_id $$;

CREATE OR REPLACE FUNCTION api_create_challenge(p_id TEXT, p_method VARCHAR, p_masked TEXT, p_identifier_digest TEXT, p_otp_digest TEXT, p_locale VARCHAR, p_expires_at TIMESTAMPTZ)
RETURNS VOID LANGUAGE SQL AS $$ INSERT INTO auth_challenges (id, method, masked_identifier, identifier_digest, otp_digest, locale, expires_at) VALUES (p_id, p_method, p_masked, p_identifier_digest, p_otp_digest, p_locale, p_expires_at) $$;
CREATE OR REPLACE FUNCTION api_consume_challenge(p_id TEXT, p_method VARCHAR)
RETURNS SETOF auth_challenges LANGUAGE SQL AS $$ UPDATE auth_challenges SET attempts = attempts + 1 WHERE id = p_id AND method = p_method AND consumed_at IS NULL RETURNING * $$;
CREATE OR REPLACE FUNCTION api_create_user(p_locale VARCHAR)
RETURNS UUID LANGUAGE SQL AS $$ INSERT INTO users (id, mobile_number, mobile_verified_at, language_preference) VALUES (gen_random_uuid(), NULL, CURRENT_TIMESTAMP, p_locale) RETURNING id $$;
CREATE OR REPLACE FUNCTION api_mark_challenge_consumed(p_id TEXT)
RETURNS VOID LANGUAGE SQL AS $$ UPDATE auth_challenges SET consumed_at = CURRENT_TIMESTAMP WHERE id = p_id $$;
CREATE OR REPLACE FUNCTION api_create_application(p_user_id UUID, p_method VARCHAR, p_id UUID, p_reference VARCHAR)
RETURNS SETOF applications LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO applications (id, user_id, application_method, reference_number, identity_verified_at, status, current_step) VALUES (p_id, p_user_id, p_method, p_reference, CURRENT_TIMESTAMP, 'draft', 'vehicle_category');
    INSERT INTO application_tasks (id, application_id, task_code, status) SELECT gen_random_uuid(), p_id, task, CASE WHEN position = 1 THEN 'in_progress' ELSE 'cannot_start_yet' END FROM unnest(ARRAY['vehicle_category', 'documents', 'test_slot', 'mock_test', 'learner_licence']) WITH ORDINALITY AS task_data(task, position);
    RETURN QUERY SELECT * FROM applications WHERE id = p_id;
END;
$$;
CREATE OR REPLACE FUNCTION api_set_user_mobile(p_user_id UUID, p_mobile VARCHAR)
RETURNS VOID LANGUAGE SQL AS $$ UPDATE users SET mobile_number = p_mobile WHERE id = p_user_id $$;
CREATE OR REPLACE FUNCTION api_save_personal_details(p_application_id UUID, p_values TEXT)
RETURNS VOID LANGUAGE SQL AS $$
INSERT INTO application_personal_details (application_id, first_name, middle_name, last_name, relative_type, relative_first_name, relative_middle_name, relative_last_name, legal_sex, sex_self_description, date_of_birth, blood_group, emergency_phone, identification_mark_1, identification_mark_2, permanent_state, permanent_pin_code, present_address_same_as_permanent, present_state, present_pin_code, declaration_accepted_at)
SELECT p_application_id, first_name, middle_name, last_name, relative_type, relative_first_name, relative_middle_name, relative_last_name, legal_sex, sex_self_description, date_of_birth, blood_group, emergency_phone, identification_mark_1, identification_mark_2, permanent_state, permanent_pin_code, present_address_same_as_permanent, present_state, present_pin_code, CURRENT_TIMESTAMP
FROM jsonb_to_record(p_values::JSONB) AS v(first_name VARCHAR, middle_name VARCHAR, last_name VARCHAR, relative_type VARCHAR, relative_first_name VARCHAR, relative_middle_name VARCHAR, relative_last_name VARCHAR, legal_sex VARCHAR, sex_self_description VARCHAR, date_of_birth DATE, blood_group VARCHAR, emergency_phone VARCHAR, identification_mark_1 VARCHAR, identification_mark_2 VARCHAR, permanent_state VARCHAR, permanent_pin_code CHAR(6), present_address_same_as_permanent BOOLEAN, present_state VARCHAR, present_pin_code CHAR(6))
ON CONFLICT (application_id) DO UPDATE SET first_name=EXCLUDED.first_name, middle_name=EXCLUDED.middle_name, last_name=EXCLUDED.last_name, relative_type=EXCLUDED.relative_type, relative_first_name=EXCLUDED.relative_first_name, relative_middle_name=EXCLUDED.relative_middle_name, relative_last_name=EXCLUDED.relative_last_name, legal_sex=EXCLUDED.legal_sex, sex_self_description=EXCLUDED.sex_self_description, date_of_birth=EXCLUDED.date_of_birth, blood_group=EXCLUDED.blood_group, emergency_phone=EXCLUDED.emergency_phone, identification_mark_1=EXCLUDED.identification_mark_1, identification_mark_2=EXCLUDED.identification_mark_2, permanent_state=EXCLUDED.permanent_state, permanent_pin_code=EXCLUDED.permanent_pin_code, present_address_same_as_permanent=EXCLUDED.present_address_same_as_permanent, present_state=EXCLUDED.present_state, present_pin_code=EXCLUDED.present_pin_code, declaration_accepted_at=CURRENT_TIMESTAMP;
$$;
CREATE OR REPLACE FUNCTION api_update_vehicle_category(p_application_id UUID, p_category_id UUID)
RETURNS VOID LANGUAGE SQL AS $$
WITH updated_application AS (UPDATE applications SET vehicle_category_id=p_category_id, status='documents_pending', current_step='documents' WHERE id=p_application_id)
UPDATE application_tasks SET status=CASE task_code WHEN 'vehicle_category' THEN 'completed' WHEN 'documents' THEN 'in_progress' ELSE status END, completed_at=CASE WHEN task_code='vehicle_category' THEN CURRENT_TIMESTAMP ELSE NULL END WHERE application_id=p_application_id AND task_code IN ('vehicle_category', 'documents')
$$;
CREATE OR REPLACE FUNCTION api_insert_document(p_id UUID, p_application_id UUID, p_type VARCHAR, p_filename VARCHAR, p_storage_key VARCHAR, p_mime VARCHAR, p_size INTEGER)
RETURNS VOID LANGUAGE SQL AS $$ INSERT INTO documents (id, application_id, document_type, original_filename, storage_key, mime_type, file_size_bytes, validation_status, validation_message, uploaded_at) VALUES (p_id, p_application_id, p_type, p_filename, p_storage_key, p_mime, p_size, 'accepted', 'Accepted for the demo.', CURRENT_TIMESTAMP) $$;
CREATE OR REPLACE FUNCTION api_set_mock_signature(p_application_id UUID, p_created_at TIMESTAMPTZ)
RETURNS VOID LANGUAGE SQL AS $$ UPDATE applications SET mock_signature_created_at=p_created_at WHERE id=p_application_id $$;
CREATE OR REPLACE FUNCTION api_mark_form_previewed(p_application_id UUID)
RETURNS VOID LANGUAGE SQL AS $$ UPDATE applications SET form_previewed_at=CURRENT_TIMESTAMP WHERE id=p_application_id $$;
CREATE OR REPLACE FUNCTION api_set_form_signed(p_application_id UUID)
RETURNS VOID LANGUAGE SQL AS $$ UPDATE applications SET digitally_signed_at=CURRENT_TIMESTAMP WHERE id=p_application_id $$;
CREATE OR REPLACE FUNCTION api_submit_documents(p_application_id UUID)
RETURNS VOID LANGUAGE SQL AS $$
WITH updated_application AS (UPDATE applications SET form_submitted_at=CURRENT_TIMESTAMP, status='slot_pending', current_step='slot' WHERE id=p_application_id)
UPDATE application_tasks SET status=CASE task_code WHEN 'documents' THEN 'completed' WHEN 'test_slot' THEN 'in_progress' ELSE status END, completed_at=CASE WHEN task_code='documents' THEN CURRENT_TIMESTAMP ELSE NULL END WHERE application_id=p_application_id AND task_code IN ('documents', 'test_slot')
$$;
CREATE OR REPLACE FUNCTION api_create_hold(p_slot_id UUID, p_application_id UUID, p_hold_id UUID, p_expires_at TIMESTAMPTZ)
RETURNS SETOF test_slots LANGUAGE plpgsql AS $$
DECLARE slot_row test_slots;
BEGIN
    SELECT * INTO slot_row FROM test_slots WHERE id=p_slot_id FOR UPDATE;
    IF slot_row.id IS NULL OR slot_row.status <> 'open' OR slot_row.booked_count >= slot_row.capacity THEN RETURN; END IF;
    UPDATE slot_holds SET status='expired' WHERE slot_id=p_slot_id AND status='active' AND expires_at <= CURRENT_TIMESTAMP;
    INSERT INTO slot_holds (id, slot_id, application_id, expires_at) VALUES (p_hold_id, p_slot_id, p_application_id, p_expires_at);
    RETURN NEXT slot_row;
END;
$$;
CREATE OR REPLACE FUNCTION api_confirm_hold(p_hold_id UUID, p_user_id UUID, p_booking_id UUID, p_booking_number VARCHAR)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE hold_row RECORD; slot_row test_slots;
BEGIN
    SELECT h.*, a.user_id INTO hold_row FROM slot_holds h JOIN applications a ON a.id=h.application_id WHERE h.id=p_hold_id FOR UPDATE;
    IF hold_row.id IS NULL THEN RETURN jsonb_build_object('hold', NULL, 'slot', NULL); END IF;
    IF hold_row.user_id <> p_user_id OR hold_row.status <> 'active' OR hold_row.expires_at <= CURRENT_TIMESTAMP THEN RETURN jsonb_build_object('hold', to_jsonb(hold_row), 'slot', NULL); END IF;
    UPDATE test_slots SET booked_count=booked_count+1 WHERE id=hold_row.slot_id AND booked_count < capacity RETURNING * INTO slot_row;
    IF slot_row.id IS NULL THEN RETURN jsonb_build_object('hold', to_jsonb(hold_row), 'slot', NULL); END IF;
    INSERT INTO bookings (id, application_id, slot_id, booking_number, mock_payment_confirmed_at) VALUES (p_booking_id, hold_row.application_id, hold_row.slot_id, p_booking_number, CURRENT_TIMESTAMP);
    UPDATE slot_holds SET status='converted' WHERE id=p_hold_id;
    UPDATE applications SET status='test_pending', current_step='mock_test' WHERE id=hold_row.application_id;
    UPDATE application_tasks SET status='completed', completed_at=CURRENT_TIMESTAMP WHERE application_id=hold_row.application_id AND task_code='test_slot';
    UPDATE application_tasks SET status='in_progress' WHERE application_id=hold_row.application_id AND task_code='mock_test';
    RETURN jsonb_build_object('hold', to_jsonb(hold_row), 'slot', to_jsonb(slot_row));
END;
$$;
CREATE OR REPLACE FUNCTION api_join_waitlist(p_application_id UUID, p_slot_id UUID, p_id UUID)
RETURNS TABLE(id UUID, status VARCHAR) LANGUAGE SQL AS $$ INSERT INTO waitlist_entries (id, application_id, slot_id) VALUES (p_id, p_application_id, p_slot_id) ON CONFLICT (application_id, slot_id) DO UPDATE SET status='waiting' RETURNING id, status $$;
CREATE OR REPLACE FUNCTION api_create_test(p_id UUID, p_application_id UUID)
RETURNS VOID LANGUAGE SQL AS $$ INSERT INTO test_attempts (id, application_id) VALUES (p_id, p_application_id) $$;
CREATE OR REPLACE FUNCTION api_save_test_answer(p_id UUID, p_attempt_id UUID, p_question_id UUID, p_selected VARCHAR, p_correct BOOLEAN)
RETURNS VOID LANGUAGE SQL AS $$ INSERT INTO test_answers (id, attempt_id, question_id, selected_option, is_correct) VALUES (p_id, p_attempt_id, p_question_id, p_selected, p_correct) ON CONFLICT (attempt_id, question_id) DO UPDATE SET selected_option=EXCLUDED.selected_option, is_correct=EXCLUDED.is_correct $$;
CREATE OR REPLACE FUNCTION api_complete_test(p_test_id UUID, p_application_id UUID, p_score INTEGER, p_passed BOOLEAN)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
    UPDATE test_attempts SET score=p_score, passed=p_passed, completed_at=CURRENT_TIMESTAMP, current_question_index=6 WHERE id=p_test_id;
    UPDATE applications SET status=CASE WHEN p_passed THEN 'passed' ELSE 'failed' END, current_step=CASE WHEN p_passed THEN 'learner_licence' ELSE 'mock_test' END WHERE id=p_application_id;
    UPDATE application_tasks SET status=CASE WHEN p_passed THEN 'completed' ELSE 'in_progress' END, completed_at=CASE WHEN p_passed THEN CURRENT_TIMESTAMP ELSE NULL END WHERE application_id=p_application_id AND task_code='mock_test';
    IF p_passed THEN UPDATE application_tasks SET status='in_progress' WHERE application_id=p_application_id AND task_code='learner_licence'; END IF;
END;
$$;
CREATE OR REPLACE FUNCTION api_issue_learner_licence(p_id UUID, p_application_id UUID, p_number VARCHAR, p_category VARCHAR, p_issued DATE, p_valid_until DATE)
RETURNS SETOF learner_licences LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO learner_licences (id, application_id, licence_number, category_code, issued_at, valid_until) VALUES (p_id, p_application_id, p_number, p_category, p_issued, p_valid_until);
    UPDATE applications SET status='licence_issued', current_step='complete' WHERE id=p_application_id;
    UPDATE application_tasks SET status='completed', completed_at=CURRENT_TIMESTAMP WHERE application_id=p_application_id AND task_code='learner_licence';
    RETURN QUERY SELECT * FROM learner_licences WHERE id=p_id;
END;
$$;
