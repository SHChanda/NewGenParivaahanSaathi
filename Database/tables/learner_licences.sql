CREATE TABLE IF NOT EXISTS learner_licences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL UNIQUE REFERENCES applications(id),
    licence_number VARCHAR(40) NOT NULL UNIQUE,
    category_code VARCHAR(30) NOT NULL,
    issued_at DATE NOT NULL,
    valid_until DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT learner_licences_dates_ck CHECK (valid_until > issued_at),
    CONSTRAINT learner_licences_status_ck CHECK (status IN ('active', 'expired', 'cancelled'))
);
