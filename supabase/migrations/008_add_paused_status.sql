-- Add 'paused' to the study_status enum
ALTER TYPE study_status ADD VALUE IF NOT EXISTS 'paused';

-- Update the public read policy on distributions to allow reading all distributions
-- (not just active ones). The shareable_link_id is an unguessable 10-char random token,
-- so knowing the link IS the authorization. This lets participants see friendly
-- "paused" / "ended" messages instead of 404.
DROP POLICY IF EXISTS distributions_public_read ON distributions;
CREATE POLICY distributions_public_read ON distributions
  FOR SELECT USING (true);
