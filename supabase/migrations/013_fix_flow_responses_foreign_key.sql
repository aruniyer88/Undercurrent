-- ============================================
-- FIX FLOW_RESPONSES FOREIGN KEY
-- Update participant_id to reference interview_sessions instead of interviews
-- ============================================

-- Drop the old foreign key constraint
ALTER TABLE flow_responses
  DROP CONSTRAINT IF EXISTS flow_responses_participant_id_fkey;

-- Add new foreign key constraint to interview_sessions
ALTER TABLE flow_responses
  ADD CONSTRAINT flow_responses_participant_id_fkey
  FOREIGN KEY (participant_id)
  REFERENCES interview_sessions(id)
  ON DELETE CASCADE;

-- Add comment for clarity
COMMENT ON COLUMN flow_responses.participant_id IS 'References interview_sessions.id (updated from legacy interviews table in migration 013)';
