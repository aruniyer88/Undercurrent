-- Add interview mode to studies table
-- This allows studies to specify whether they're voice-only or video interviews
-- Created: 2026-02-03

-- Add interview_mode column with default 'voice' for backwards compatibility
ALTER TABLE studies
ADD COLUMN interview_mode TEXT DEFAULT 'voice' NOT NULL
CHECK (interview_mode IN ('voice', 'video'));

COMMENT ON COLUMN studies.interview_mode IS 'Interview mode: voice (audio only) or video (audio + video recording)';

-- Update existing studies to have voice mode
UPDATE studies SET interview_mode = 'voice' WHERE interview_mode IS NULL;
