CREATE TABLE IF NOT EXISTS application_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    task_code VARCHAR(30) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'not_started',
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT application_tasks_code_ck CHECK (task_code IN (
        'vehicle_category', 'documents', 'test_slot', 'mock_test', 'learner_licence'
    )),
    CONSTRAINT application_tasks_status_ck CHECK (status IN ('not_started', 'in_progress', 'completed', 'cannot_start_yet')),
    CONSTRAINT application_tasks_completion_ck CHECK (
        (status = 'completed' AND completed_at IS NOT NULL)
        OR (status <> 'completed' AND completed_at IS NULL)
    )
);
