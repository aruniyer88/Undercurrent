-- Add video recording support to Undercurrent
-- Phase 1: Database Schema
-- Created: 2026-02-02

-- Add camera configuration to studies table
ALTER TABLE studies
ADD COLUMN camera_required BOOLEAN DEFAULT false;

COMMENT ON COLUMN studies.camera_required IS 'Whether camera access is mandatory (true) or optional (false) for video interviews';

-- Add video fields to flow_responses table with timestamp tagging
ALTER TABLE flow_responses
ADD COLUMN video_url TEXT,
ADD COLUMN video_thumbnail_url TEXT,
ADD COLUMN video_duration_seconds INT,
ADD COLUMN video_format TEXT,
ADD COLUMN video_resolution TEXT,
ADD COLUMN video_start_timestamp TIMESTAMPTZ,
ADD COLUMN video_end_timestamp TIMESTAMPTZ,
ADD COLUMN video_start_offset_ms INT,
ADD COLUMN video_end_offset_ms INT;

-- Index for efficient video response queries
CREATE INDEX idx_flow_responses_video
ON flow_responses(video_url) WHERE video_url IS NOT NULL;

-- Comments for timestamp fields (for reel clipping)
COMMENT ON COLUMN flow_responses.video_start_timestamp IS 'UTC timestamp when participant started answering this question';
COMMENT ON COLUMN flow_responses.video_end_timestamp IS 'UTC timestamp when participant finished answering this question';
COMMENT ON COLUMN flow_responses.video_start_offset_ms IS 'Millisecond offset from video start for answer beginning (for reel clipping)';
COMMENT ON COLUMN flow_responses.video_end_offset_ms IS 'Millisecond offset from video start for answer end (for reel clipping)';

-- Update flow_items response_mode constraint to include 'video'
ALTER TABLE flow_items
DROP CONSTRAINT IF EXISTS flow_items_response_mode_check;

ALTER TABLE flow_items
ADD CONSTRAINT flow_items_response_mode_check
CHECK (response_mode IN ('voice', 'text', 'screen', 'video'));

-- Create storage buckets for video content
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('interview-videos', 'interview-videos', false),
  ('video-thumbnails', 'video-thumbnails', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for interview videos
CREATE POLICY "Users can upload videos for their studies"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'interview-videos' AND
  auth.uid() IN (
    SELECT user_id FROM studies
    WHERE id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Users can read videos from their studies"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'interview-videos' AND
  auth.uid() IN (
    SELECT user_id FROM studies
    WHERE id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Users can delete videos from their studies"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'interview-videos' AND
  auth.uid() IN (
    SELECT user_id FROM studies
    WHERE id::text = (storage.foldername(name))[1]
  )
);

-- RLS policies for video thumbnails
CREATE POLICY "Users can upload thumbnails for their studies"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'video-thumbnails' AND
  auth.uid() IN (
    SELECT user_id FROM studies
    WHERE id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Users can read thumbnails from their studies"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'video-thumbnails' AND
  auth.uid() IN (
    SELECT user_id FROM studies
    WHERE id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Users can delete thumbnails from their studies"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'video-thumbnails' AND
  auth.uid() IN (
    SELECT user_id FROM studies
    WHERE id::text = (storage.foldername(name))[1]
  )
);
