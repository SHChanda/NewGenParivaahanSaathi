CREATE TABLE IF NOT EXISTS test_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    score INTEGER NOT NULL DEFAULT 0,
    total_questions INTEGER NOT NULL DEFAULT 6,
    current_question_index INTEGER NOT NULL DEFAULT 0,
    passed BOOLEAN NOT NULL DEFAULT FALSE,
    started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ,
    CONSTRAINT test_attempts_score_ck CHECK (score >= 0 AND score <= total_questions),
    CONSTRAINT test_attempts_total_ck CHECK (total_questions = 6),
    CONSTRAINT test_attempts_question_index_ck CHECK (current_question_index BETWEEN 0 AND total_questions)
);
