CREATE TABLE IF NOT EXISTS identity_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    verification_method VARCHAR(20) NOT NULL,
    masked_identifier VARCHAR(30) NOT NULL,
    otp_sent_at TIMESTAMPTZ,
    verified_at TIMESTAMPTZ,
    consent_data JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT identity_verifications_method_ck CHECK (verification_method IN ('aadhaar', 'mobile'))
);
