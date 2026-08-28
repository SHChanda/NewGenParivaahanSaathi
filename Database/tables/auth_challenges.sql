CREATE TABLE IF NOT EXISTS auth_challenges (
    id TEXT PRIMARY KEY,
    method VARCHAR(20) NOT NULL CHECK (method IN ('aadhaar', 'mobile')),
    masked_identifier VARCHAR(30) NOT NULL,
    identifier_digest TEXT NOT NULL,
    otp_digest TEXT NOT NULL,
    locale VARCHAR(5) NOT NULL CHECK (locale IN ('en', 'hi')),
    expires_at TIMESTAMPTZ NOT NULL,
    attempts SMALLINT NOT NULL DEFAULT 0 CHECK (attempts >= 0),
    consumed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS auth_challenges_expiry_idx ON auth_challenges(expires_at) WHERE consumed_at IS NULL;
