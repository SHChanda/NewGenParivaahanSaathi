CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    vehicle_category_id UUID REFERENCES vehicle_categories(id),
    application_method VARCHAR(20) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'draft',
    current_step VARCHAR(40) NOT NULL DEFAULT 'vehicle_category',
    identity_verified_at TIMESTAMPTZ,
    status_updates_consent_at TIMESTAMPTZ,
    mock_signature_created_at TIMESTAMPTZ,
    form_previewed_at TIMESTAMPTZ,
    digitally_signed_at TIMESTAMPTZ,
    form_submitted_at TIMESTAMPTZ,
    reference_number VARCHAR(30) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT applications_status_ck CHECK (status IN (
        'draft', 'documents_pending', 'slot_pending', 'test_pending',
        'passed', 'failed', 'licence_issued', 'cancelled'
    )),
    CONSTRAINT applications_method_ck CHECK (application_method IN ('aadhaar', 'mobile')),
    CONSTRAINT applications_current_step_ck CHECK (current_step IN (
        'vehicle_category', 'documents', 'slot', 'mock_test', 'learner_licence', 'complete'
    ))
);
