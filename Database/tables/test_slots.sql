CREATE TABLE IF NOT EXISTS test_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    centre_id UUID NOT NULL REFERENCES test_centres(id),
    slot_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    booked_count INTEGER NOT NULL DEFAULT 0 CHECK (booked_count >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'open',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT test_slots_time_ck CHECK (end_time > start_time),
    CONSTRAINT test_slots_capacity_ck CHECK (booked_count <= capacity),
    CONSTRAINT test_slots_status_ck CHECK (status IN ('open', 'closed', 'cancelled')),
    CONSTRAINT test_slots_unique_time UNIQUE (centre_id, slot_date, start_time)
);
