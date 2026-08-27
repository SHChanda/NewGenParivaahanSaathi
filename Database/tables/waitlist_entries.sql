CREATE TABLE IF NOT EXISTS waitlist_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    slot_id UUID NOT NULL REFERENCES test_slots(id) ON DELETE CASCADE,
    entry_channel VARCHAR(20) NOT NULL DEFAULT 'application',
    direct_booking_token UUID,
    status VARCHAR(20) NOT NULL DEFAULT 'waiting',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notified_at TIMESTAMPTZ,
    CONSTRAINT waitlist_status_ck CHECK (status IN ('waiting', 'notified', 'accepted', 'cancelled')),
    CONSTRAINT waitlist_channel_ck CHECK (entry_channel IN ('application', 'direct')),
    CONSTRAINT waitlist_owner_ck CHECK (
        (entry_channel = 'application' AND application_id IS NOT NULL AND direct_booking_token IS NULL)
        OR (entry_channel = 'direct' AND application_id IS NULL AND direct_booking_token IS NOT NULL)
    ),
    CONSTRAINT waitlist_unique_application_slot UNIQUE (application_id, slot_id)
);
