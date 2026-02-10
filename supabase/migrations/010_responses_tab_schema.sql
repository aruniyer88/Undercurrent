-- Responses Tab Schema Updates
-- Extends interview_sessions with participant info, review status, AI summary
-- Adds screener_questions and screener_responses tables
-- Created: 2026-02-08

-- ============================================
-- 1. Extend interview_sessions
-- ============================================

ALTER TABLE interview_sessions
ADD COLUMN participant_name TEXT,
ADD COLUMN participant_email TEXT,
ADD COLUMN participant_metadata JSONB DEFAULT '{}',
ADD COLUMN review_status TEXT DEFAULT 'pending' CHECK (review_status IN ('pending', 'accepted', 'rejected')),
ADD COLUMN ai_summary JSONB,
ADD COLUMN language TEXT;

COMMENT ON COLUMN interview_sessions.participant_name IS 'Name collected during interview welcome screen';
COMMENT ON COLUMN interview_sessions.participant_email IS 'Optional email collected during interview welcome screen';
COMMENT ON COLUMN interview_sessions.participant_metadata IS 'Demographics: gender, age, ethnicity, location, education, income, occupation';
COMMENT ON COLUMN interview_sessions.review_status IS 'Researcher review status: pending, accepted, or rejected';
COMMENT ON COLUMN interview_sessions.ai_summary IS 'AI-generated summary: { bullets: string[], generated_at: string, model: string }';
COMMENT ON COLUMN interview_sessions.language IS 'Interview language, denormalized from study';

-- ============================================
-- 2. New table: screener_questions
-- ============================================

CREATE TABLE screener_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  study_id UUID NOT NULL REFERENCES studies(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('single_select', 'multi_select', 'text')),
  options TEXT[] DEFAULT '{}',
  qualifying_answers TEXT[] DEFAULT '{}',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_screener_questions_study ON screener_questions(study_id, display_order);

ALTER TABLE screener_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY screener_questions_user_policy ON screener_questions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM studies
      WHERE studies.id = screener_questions.study_id
      AND studies.user_id = auth.uid()
    )
  );

-- ============================================
-- 3. New table: screener_responses
-- ============================================

CREATE TABLE screener_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
  screener_question_id UUID NOT NULL REFERENCES screener_questions(id) ON DELETE CASCADE,
  answer TEXT NOT NULL,
  passed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, screener_question_id)
);

CREATE INDEX idx_screener_responses_session ON screener_responses(session_id);

ALTER TABLE screener_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY screener_responses_user_policy ON screener_responses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM interview_sessions
      JOIN studies ON studies.id = interview_sessions.study_id
      WHERE interview_sessions.id = screener_responses.session_id
      AND studies.user_id = auth.uid()
    )
  );

-- ============================================
-- 4. Additional indexes for responses queries
-- ============================================

CREATE INDEX idx_interview_sessions_study_started ON interview_sessions(study_id, started_at DESC);
CREATE INDEX idx_interview_sessions_review ON interview_sessions(review_status);
CREATE INDEX idx_conversation_turns_session_order ON conversation_turns(session_id, turn_number);
