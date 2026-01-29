-- ============================================
-- REMOVE SECTION INTRO MIGRATION
-- Removes the intro field from flow_sections table
-- ============================================

-- Remove the intro column from flow_sections table
ALTER TABLE flow_sections
DROP COLUMN IF EXISTS intro;

COMMENT ON TABLE flow_sections IS 'Sections within a study flow, each can have optional stimulus';
