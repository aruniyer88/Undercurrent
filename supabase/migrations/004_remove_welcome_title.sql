-- ============================================
-- REMOVE WELCOME TITLE MIGRATION
-- Removes the welcome_title field from study_flows table
-- ============================================

-- Remove the welcome_title column from study_flows table
ALTER TABLE study_flows
DROP COLUMN IF EXISTS welcome_title;

COMMENT ON TABLE study_flows IS 'Study flow container with welcome screen configuration';
