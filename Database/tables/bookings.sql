CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES applications(id),
    slot_id UUID NOT NULL REFERENCES test_slots(id),
    booking_channel VARCHAR(20) NOT NULL DEFAULT 'application',
    direct_booking_token UUID,
    mock_payment_confirmed_at TIMESTAMPTZ,
    booking_number VARCHAR(40) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'confirmed',
    booked_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    cancelled_at TIMESTAMPTZ,
    CONSTRAINT bookings_status_ck CHECK (status IN ('held', 'confirmed', 'cancelled', 'completed', 'no_show')),
    CONSTRAINT bookings_channel_ck CHECK (booking_channel IN ('application', 'direct')),
    CONSTRAINT bookings_owner_ck CHECK (
        (booking_channel = 'application' AND application_id IS NOT NULL AND direct_booking_token IS NULL)
        OR (booking_channel = 'direct' AND application_id IS NULL AND direct_booking_token IS NOT NULL)
    ),
    CONSTRAINT bookings_one_application_slot UNIQUE (application_id, slot_id)
);
