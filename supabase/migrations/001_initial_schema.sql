-- ============================================
-- UNDERCURRENT DATABASE SCHEMA
-- Initial migration: Core tables
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUM TYPES
-- ============================================

-- Study status workflow
CREATE TYPE study_status AS ENUM (
  'draft',           -- Initial state, being configured
  'ready_for_test',  -- Setup complete, ready for test interview
  'tested',          -- Test interview completed, pending approval
  'live',            -- Published and accepting participants
  'closed'           -- No longer accepting participants
);

-- Project/study type categories
CREATE TYPE project_type AS ENUM (
  'discovery',        -- Open-ended exploration
  'concept_testing',  -- Testing specific concepts
  'creative_testing', -- Testing creative assets
  'brand_health'      -- Brand perception research
);

-- Voice profile type
CREATE TYPE voice_type AS ENUM (
  'preset',   -- Pre-built voice from provider
  'cloned'    -- User-created voice clone
);

-- Interview status workflow
CREATE TYPE interview_status AS ENUM (
  'created',      -- Link generated, not started
  'in_progress',  -- Participant is actively interviewing
  'completed',    -- Successfully finished
  'failed'        -- Error or abandoned
);

-- Background job status
CREATE TYPE job_status AS ENUM (
  'queued',   -- Waiting to be processed
  'running',  -- Currently being processed
  'done',     -- Successfully completed
  'failed'    -- Failed after all retries
);

-- Job types
CREATE TYPE job_type AS ENUM (
  'transcription',   -- Audio to text
  'synthesis',       -- Generate report/insights
  'voice_clone'      -- Create voice clone
);

-- ============================================
-- VOICE PROFILES TABLE (created first due to FK dependency)
-- ============================================

CREATE TABLE voice_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic info
  name TEXT NOT NULL,
  type voice_type NOT NULL DEFAULT 'preset',
  description TEXT,
  
  -- Provider integration
  provider_voice_id TEXT,  -- ElevenLabs voice ID
  
  -- Style configuration (for cloned voices)
  style_config JSONB DEFAULT '{}'::jsonb,
  -- Example: { "tone": "warm", "pacing": "normal", "dialect": "American", "keyPhrases": ["you know", "absolutely"] }
  
  -- Voice samples storage (for cloned voices)
  samples_storage_paths TEXT[],
  
  -- Consent tracking (for cloned voices)
  consent_confirmed BOOLEAN DEFAULT false,
  consent_confirmed_at TIMESTAMPTZ,
  consent_owner_name TEXT,  -- Name of the person whose voice this is
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_voice_profiles_user_id ON voice_profiles(user_id);
CREATE INDEX idx_voice_profiles_type ON voice_profiles(type);

-- ============================================
-- STUDIES TABLE
-- ============================================

CREATE TABLE studies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic info
  title TEXT NOT NULL DEFAULT 'Untitled Study',
  status study_status NOT NULL DEFAULT 'draft',
  project_type project_type,
  
  -- Structured setup fields (populated from chat brief)
  objective TEXT,
  topics TEXT[],  -- Array of topic strings
  success_criteria TEXT,
  audience TEXT,
  guidelines TEXT,
  intro_text TEXT,
  
  -- Original chat brief (for reference)
  brief_messages JSONB DEFAULT '[]'::jsonb,
  
  -- Voice configuration
  voice_profile_id UUID REFERENCES voice_profiles(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_studies_user_id ON studies(user_id);
CREATE INDEX idx_studies_status ON studies(status);
CREATE INDEX idx_studies_created_at ON studies(created_at DESC);

-- ============================================
-- INTERVIEW GUIDES TABLE
-- ============================================

CREATE TABLE interview_guides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  study_id UUID NOT NULL REFERENCES studies(id) ON DELETE CASCADE,
  
  -- Guide structure
  -- JSONB array of sections, each with questions and probes
  -- Example: [{ "title": "Introduction", "questions": [{ "text": "...", "probes": ["...", "..."] }] }]
  sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Approval tracking
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One guide per study
CREATE UNIQUE INDEX idx_interview_guides_study_id ON interview_guides(study_id);

-- ============================================
-- INTERVIEWS TABLE
-- ============================================

CREATE TABLE interviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  study_id UUID NOT NULL REFERENCES studies(id) ON DELETE CASCADE,
  
  -- Participant access
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  
  -- Status
  status interview_status NOT NULL DEFAULT 'created',
  
  -- Participant info (optional, minimal PII)
  participant_name TEXT,
  participant_metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Recording storage
  recording_path TEXT,
  
  -- Transcript storage
  transcript_path TEXT,
  transcript_text TEXT,  -- Stored directly for easier querying
  
  -- Session timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  
  -- Test interview flag
  is_test BOOLEAN DEFAULT false,
  
  -- Additional metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  -- Example: { "deviceType": "mobile", "browser": "Safari", "questionCount": 12 }
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_interviews_study_id ON interviews(study_id);
CREATE INDEX idx_interviews_token ON interviews(token);
CREATE INDEX idx_interviews_status ON interviews(status);
CREATE INDEX idx_interviews_created_at ON interviews(created_at DESC);

-- ============================================
-- REPORTS TABLE
-- ============================================

CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  study_id UUID NOT NULL REFERENCES studies(id) ON DELETE CASCADE,
  
  -- Report content
  summary TEXT,
  
  -- Key insights as structured data
  -- Array of insight objects with evidence
  -- Example: [{ "headline": "...", "evidence": [{ "quote": "...", "interviewId": "..." }] }]
  insights JSONB DEFAULT '[]'::jsonb,
  
  -- Share settings
  share_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  is_public BOOLEAN DEFAULT false,
  
  -- Generation metadata
  generated_at TIMESTAMPTZ,
  generation_metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One report per study
CREATE UNIQUE INDEX idx_reports_study_id ON reports(study_id);
CREATE INDEX idx_reports_share_token ON reports(share_token);

-- ============================================
-- JOBS TABLE (Async processing)
-- ============================================

CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Job configuration
  type job_type NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Example for transcription: { "interviewId": "...", "audioPath": "..." }
  
  -- Status tracking
  status job_status NOT NULL DEFAULT 'queued',
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  
  -- Result data
  result JSONB,
  error_message TEXT,
  
  -- Timing
  scheduled_for TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for job processing
CREATE INDEX idx_jobs_status_scheduled ON jobs(status, scheduled_for) 
  WHERE status = 'queued';
CREATE INDEX idx_jobs_type ON jobs(type);
CREATE INDEX idx_jobs_created_at ON jobs(created_at DESC);

-- ============================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_studies_updated_at
  BEFORE UPDATE ON studies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_voice_profiles_updated_at
  BEFORE UPDATE ON voice_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interview_guides_updated_at
  BEFORE UPDATE ON interview_guides
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interviews_updated_at
  BEFORE UPDATE ON interviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Studies: Users can only access their own studies
CREATE POLICY studies_user_policy ON studies
  FOR ALL USING (auth.uid() = user_id);

-- Voice Profiles: Users can only access their own voice profiles
CREATE POLICY voice_profiles_user_policy ON voice_profiles
  FOR ALL USING (auth.uid() = user_id);

-- Interview Guides: Users can access guides for their studies
CREATE POLICY interview_guides_user_policy ON interview_guides
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM studies 
      WHERE studies.id = interview_guides.study_id 
      AND studies.user_id = auth.uid()
    )
  );

-- Interviews: Users can access interviews for their studies
-- Also allow public access via token for participants
CREATE POLICY interviews_user_policy ON interviews
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM studies 
      WHERE studies.id = interviews.study_id 
      AND studies.user_id = auth.uid()
    )
  );

-- Reports: Users can access reports for their studies
-- Also allow public access via share_token
CREATE POLICY reports_user_policy ON reports
  FOR ALL USING (
    is_public = true
    OR EXISTS (
      SELECT 1 FROM studies 
      WHERE studies.id = reports.study_id 
      AND studies.user_id = auth.uid()
    )
  );

-- Jobs: Service role only (no direct user access)
-- Jobs are managed by the backend worker
CREATE POLICY jobs_service_policy ON jobs
  FOR ALL USING (false);  -- Blocked for all users, service role bypasses RLS

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE studies IS 'Core study/project entity containing research configuration';
COMMENT ON TABLE voice_profiles IS 'Preset and cloned voice configurations for AI interviewer';
COMMENT ON TABLE interview_guides IS 'Structured interview questions and probes';
COMMENT ON TABLE interviews IS 'Individual participant interview sessions';
COMMENT ON TABLE reports IS 'Generated insights and summaries from completed interviews';
COMMENT ON TABLE jobs IS 'Async background job queue for transcription, synthesis, etc.';
