CREATE TABLE IF NOT EXISTS slot_holds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slot_id UUID NOT NULL REFERENCES test_slots(id) ON DELETE CASCADE,
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    hold_channel VARCHAR(20) NOT NULL DEFAULT 'application',
    direct_booking_token UUID,
    expires_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT slot_holds_status_ck CHECK (status IN ('active', 'converted', 'expired', 'cancelled')),
    CONSTRAINT slot_holds_expiry_ck CHECK (expires_at > created_at),
    CONSTRAINT slot_holds_channel_ck CHECK (hold_channel IN ('application', 'direct')),
    CONSTRAINT slot_holds_owner_ck CHECK (
        (hold_channel = 'application' AND application_id IS NOT NULL AND direct_booking_token IS NULL)
        OR (hold_channel = 'direct' AND application_id IS NULL AND direct_booking_token IS NOT NULL)
    )
);
