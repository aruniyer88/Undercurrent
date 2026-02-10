-- Migration 011: Add elevenlabs_agent_id to studies
-- Stores the per-study ElevenLabs Conversational AI agent ID.
-- Agent is created at publish time for streaming studies and deleted on close.

ALTER TABLE studies
ADD COLUMN elevenlabs_agent_id TEXT;
