CREATE TABLE IF NOT EXISTS test_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES test_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES test_questions(id),
    selected_option VARCHAR(10) NOT NULL,
    is_correct BOOLEAN NOT NULL,
    UNIQUE (attempt_id, question_id)
);
