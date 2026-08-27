CREATE TABLE IF NOT EXISTS application_personal_details (
    application_id UUID PRIMARY KEY REFERENCES applications(id) ON DELETE CASCADE,
    first_name VARCHAR(60) NOT NULL,
    middle_name VARCHAR(60),
    last_name VARCHAR(60) NOT NULL,
    relative_type VARCHAR(20) NOT NULL,
    relative_first_name VARCHAR(60) NOT NULL,
    relative_middle_name VARCHAR(60),
    relative_last_name VARCHAR(60) NOT NULL,
    legal_sex VARCHAR(25) NOT NULL,
    sex_self_description VARCHAR(120),
    date_of_birth DATE NOT NULL,
    blood_group VARCHAR(5),
    emergency_phone VARCHAR(20),
    identification_mark_1 VARCHAR(200) NOT NULL,
    identification_mark_2 VARCHAR(200),
    permanent_state VARCHAR(100) NOT NULL,
    permanent_pin_code CHAR(6) NOT NULL,
    present_address_same_as_permanent BOOLEAN NOT NULL DEFAULT TRUE,
    present_state VARCHAR(100),
    present_pin_code CHAR(6),
    declaration_accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT application_personal_details_relative_ck CHECK (relative_type IN ('father', 'mother', 'husband', 'guardian')),
    CONSTRAINT application_personal_details_sex_ck CHECK (legal_sex IN ('female', 'male', 'non_binary', 'prefer_not_to_say', 'self_describe')),
    CONSTRAINT application_personal_details_sex_description_ck CHECK (
        (legal_sex = 'self_describe' AND sex_self_description IS NOT NULL)
        OR (legal_sex <> 'self_describe' AND sex_self_description IS NULL)
    ),
    CONSTRAINT application_personal_details_permanent_pin_ck CHECK (permanent_pin_code ~ '^[0-9]{6}$'),
    CONSTRAINT application_personal_details_present_address_ck CHECK (
        (present_address_same_as_permanent AND present_state IS NULL AND present_pin_code IS NULL)
        OR (NOT present_address_same_as_permanent AND present_state IS NOT NULL AND present_pin_code ~ '^[0-9]{6}$')
    )
);
