-- Add distributions table for study link sharing
-- This table stores distribution configurations for sharing studies

CREATE TABLE distributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  study_id UUID NOT NULL REFERENCES studies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  shareable_link_id TEXT NOT NULL UNIQUE,
  max_responses INTEGER DEFAULT NULL,
  current_responses INTEGER DEFAULT 0,
  redirect_completion_url TEXT,
  redirect_screenout_url TEXT,
  redirect_quota_full_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient lookups
CREATE INDEX idx_distributions_study_id ON distributions(study_id);
CREATE INDEX idx_distributions_shareable_link_id ON distributions(shareable_link_id);

-- Ensure only one active distribution per study
CREATE UNIQUE INDEX idx_distributions_study_active ON distributions(study_id) WHERE is_active = true;

-- Enable Row Level Security
ALTER TABLE distributions ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users (owner access via study relationship)
CREATE POLICY distributions_user_policy ON distributions
  FOR ALL USING (EXISTS (SELECT 1 FROM studies WHERE studies.id = distributions.study_id AND studies.user_id = auth.uid()));

-- Policy for public read access to active distributions (for participant access)
CREATE POLICY distributions_public_read ON distributions
  FOR SELECT USING (is_active = true);
