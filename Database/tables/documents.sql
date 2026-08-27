CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    document_type VARCHAR(30) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    storage_key VARCHAR(500),
    mime_type VARCHAR(100) NOT NULL,
    file_size_bytes INTEGER NOT NULL,
    validation_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    validation_message TEXT,
    uploaded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT documents_type_ck CHECK (document_type IN ('age_proof', 'address_proof', 'photograph', 'mock_signature')),
    CONSTRAINT documents_status_ck CHECK (validation_status IN ('pending', 'accepted', 'rejected')),
    CONSTRAINT documents_size_ck CHECK (file_size_bytes > 0 AND file_size_bytes <= 512000)
);
