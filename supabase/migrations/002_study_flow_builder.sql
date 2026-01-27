-- ============================================
-- STUDY FLOW BUILDER MIGRATION
-- Adds Step 1 fields to studies + Step 2 flow tables
-- ============================================

-- ============================================
-- PART 1: UPDATE STUDIES TABLE FOR STEP 1
-- Add proper fields for Project Basics data
-- ============================================

-- Add separate columns for about_interviewer and language
ALTER TABLE studies
ADD COLUMN IF NOT EXISTS about_interviewer TEXT,
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'English';

COMMENT ON COLUMN studies.about_interviewer IS 'Context about who the interviewer is (from Step 1 Project Basics)';
COMMENT ON COLUMN studies.language IS 'Interview language (from Step 1 Project Basics)';

-- ============================================
-- PART 2: ITEM TYPE ENUM
-- ============================================

CREATE TYPE flow_item_type AS ENUM (
  'open_ended',
  'single_select',
  'multi_select',
  'rating_scale',
  'ranking',
  'instruction',
  'ai_conversation'
);

-- ============================================
-- PART 3: STUDY FLOWS TABLE
-- One per study, contains welcome screen config
-- ============================================

CREATE TABLE study_flows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  study_id UUID NOT NULL REFERENCES studies(id) ON DELETE CASCADE,

  -- Welcome screen configuration
  welcome_title TEXT NOT NULL DEFAULT '',
  welcome_message TEXT NOT NULL DEFAULT '',
  welcome_logo_url TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One flow per study
  UNIQUE(study_id)
);

-- Index
CREATE INDEX idx_study_flows_study_id ON study_flows(study_id);

-- Apply updated_at trigger
CREATE TRIGGER update_study_flows_updated_at
  BEFORE UPDATE ON study_flows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS: Users can only access flows for their own studies
ALTER TABLE study_flows ENABLE ROW LEVEL SECURITY;

CREATE POLICY study_flows_user_policy ON study_flows
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM studies
      WHERE studies.id = study_flows.study_id
      AND studies.user_id = auth.uid()
    )
  );

COMMENT ON TABLE study_flows IS 'Study flow container with welcome screen configuration';

-- ============================================
-- PART 4: FLOW SECTIONS TABLE
-- Multiple per flow, orderable
-- ============================================

CREATE TABLE flow_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  study_flow_id UUID NOT NULL REFERENCES study_flows(id) ON DELETE CASCADE,

  -- Section configuration
  title TEXT NOT NULL,                -- "Section 1", "Section 2", etc.
  intro TEXT,                         -- Optional section introduction
  display_order INT NOT NULL,         -- 0, 1, 2... for ordering

  -- Stimulus (optional)
  stimulus_type TEXT,                 -- 'image', 'website', 'youtube', or null
  stimulus_config JSONB,              -- {url: "...", caption: "..."} etc.

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique order within flow
  UNIQUE(study_flow_id, display_order)
);

-- Indexes
CREATE INDEX idx_flow_sections_study_flow ON flow_sections(study_flow_id);

-- Apply updated_at trigger
CREATE TRIGGER update_flow_sections_updated_at
  BEFORE UPDATE ON flow_sections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS: Users can access sections for their study flows
ALTER TABLE flow_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY flow_sections_user_policy ON flow_sections
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM study_flows sf
      JOIN studies s ON s.id = sf.study_id
      WHERE sf.id = flow_sections.study_flow_id
      AND s.user_id = auth.uid()
    )
  );

COMMENT ON TABLE flow_sections IS 'Sections within a study flow, each can have optional stimulus';

-- ============================================
-- PART 5: FLOW ITEMS TABLE
-- Questions, instructions, AI conversations
-- ============================================

CREATE TABLE flow_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_id UUID NOT NULL REFERENCES flow_sections(id) ON DELETE CASCADE,

  -- Common fields
  item_type flow_item_type NOT NULL,
  display_order INT NOT NULL,         -- 0, 1, 2... for ordering within section

  -- Question text (used by all question types, null for instruction)
  question_text TEXT,

  -- Response mode (for applicable types)
  response_mode TEXT,                 -- 'voice', 'text', 'screen'

  -- Type-specific configuration stored as JSONB
  item_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  /*
    item_config examples by type:

    open_ended: {
      "probing_mode": "auto",
      "custom_probes": ["probe 1", "probe 2"]
    }

    single_select / multi_select: {
      "options": ["Option 1", "Option 2", "Option 3"]
    }

    rating_scale: {
      "scale_size": 7,
      "low_label": "Not at all",
      "high_label": "Extremely"
    }

    ranking: {
      "items": ["Item A", "Item B", "Item C"]
    }

    instruction: {
      "content": "Please read carefully..."
    }

    ai_conversation: {
      "duration_seconds": 120,
      "basis": "prior_answers",
      "custom_instructions": "..."
    }
  */

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique order within section
  UNIQUE(section_id, display_order)
);

-- Indexes
CREATE INDEX idx_flow_items_section ON flow_items(section_id);
CREATE INDEX idx_flow_items_type ON flow_items(item_type);

-- Apply updated_at trigger
CREATE TRIGGER update_flow_items_updated_at
  BEFORE UPDATE ON flow_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS: Users can access items for their sections
ALTER TABLE flow_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY flow_items_user_policy ON flow_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM flow_sections fs
      JOIN study_flows sf ON sf.id = fs.study_flow_id
      JOIN studies s ON s.id = sf.study_id
      WHERE fs.id = flow_items.section_id
      AND s.user_id = auth.uid()
    )
  );

COMMENT ON TABLE flow_items IS 'Individual items (questions, instructions, AI conversations) within sections';

-- ============================================
-- PART 6: FLOW RESPONSES TABLE
-- Participant responses for analysis
-- ============================================

CREATE TABLE flow_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  study_id UUID NOT NULL REFERENCES studies(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  flow_item_id UUID NOT NULL REFERENCES flow_items(id) ON DELETE CASCADE,

  -- Response data (use appropriate column based on item_type)
  text_response TEXT,                 -- open_ended: transcribed voice or typed text
  selected_options TEXT[],            -- single/multi select: selected option values
  rating_value INT,                   -- rating_scale: 1-10
  ranked_items TEXT[],                -- ranking: ordered item values

  -- AI conversation specific
  conversation_transcript JSONB,      -- Array of {role, content, timestamp}
  conversation_duration_seconds INT,  -- Actual duration

  -- Metadata for analysis
  response_metadata JSONB,            -- Sentiment scores, themes, keywords
  audio_url TEXT,                     -- Storage URL for voice recordings

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One response per participant per item
  UNIQUE(participant_id, flow_item_id)
);

-- Indexes for analysis queries
CREATE INDEX idx_flow_responses_study ON flow_responses(study_id);
CREATE INDEX idx_flow_responses_item ON flow_responses(flow_item_id);
CREATE INDEX idx_flow_responses_participant ON flow_responses(participant_id);

-- RLS: Users can access responses for their studies
ALTER TABLE flow_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY flow_responses_user_policy ON flow_responses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM studies
      WHERE studies.id = flow_responses.study_id
      AND studies.user_id = auth.uid()
    )
  );

COMMENT ON TABLE flow_responses IS 'Participant responses to flow items, normalized for analysis';

-- ============================================
-- PART 7: HELPFUL VIEWS FOR ANALYSIS
-- ============================================

-- View to get all questions in a study with their section info
CREATE OR REPLACE VIEW study_questions_view AS
SELECT
  s.id as study_id,
  s.title as study_title,
  sf.id as flow_id,
  fs.id as section_id,
  fs.title as section_title,
  fs.display_order as section_order,
  fi.id as item_id,
  fi.item_type,
  fi.question_text,
  fi.response_mode,
  fi.item_config,
  fi.display_order as item_order
FROM studies s
JOIN study_flows sf ON sf.study_id = s.id
JOIN flow_sections fs ON fs.study_flow_id = sf.id
JOIN flow_items fi ON fi.section_id = fs.id
ORDER BY s.id, fs.display_order, fi.display_order;

-- View to aggregate responses by item
CREATE OR REPLACE VIEW item_responses_summary AS
SELECT
  fi.id as item_id,
  fi.item_type,
  fi.question_text,
  COUNT(fr.id) as response_count,
  -- Rating stats (only meaningful for rating_scale)
  AVG(fr.rating_value) as avg_rating,
  MIN(fr.rating_value) as min_rating,
  MAX(fr.rating_value) as max_rating
FROM flow_items fi
LEFT JOIN flow_responses fr ON fr.flow_item_id = fi.id
GROUP BY fi.id, fi.item_type, fi.question_text;

COMMENT ON VIEW study_questions_view IS 'Denormalized view of all questions in studies with section context';
COMMENT ON VIEW item_responses_summary IS 'Aggregated response statistics per item';
