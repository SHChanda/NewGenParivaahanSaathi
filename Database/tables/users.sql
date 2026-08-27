CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mobile_number VARCHAR(20) UNIQUE,
    name VARCHAR(120),
    email VARCHAR(255),
    language_preference VARCHAR(5) NOT NULL DEFAULT 'en',
    mobile_verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_language_preference_ck CHECK (language_preference IN ('en', 'hi'))
);
