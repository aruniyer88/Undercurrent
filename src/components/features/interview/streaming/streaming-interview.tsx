'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useInterview } from '../interview-context';
import { AmbientOrb } from '../shared/ambient-orb';
import { StimulusDisplay } from '../shared/stimulus-display';
import { VideoPip } from '../shared/video-pip';
import { ConversationDisplay } from './conversation-display';
import { useElevenLabsConversation } from '@/hooks/use-elevenlabs-conversation';
import type { StreamingInterviewProps } from '@/lib/types/interview';

export function StreamingInterview({ onComplete }: StreamingInterviewProps) {
  const { sections, study, completeSession, sessionId, cameraStream, setCameraStream } = useInterview();

  const [showStimulus, setShowStimulus] = useState(false);
  const [stimulusSectionIdx, setStimulusSectionIdx] = useState(0);
  const hasCompleted = useRef(false);

  const {
    start,
    stop,
    orbState,
    status,
    entries,
    error,
    conversation,
  } = useElevenLabsConversation({
    studyId: study.id,
  });

  // Start the conversation when component mounts
  useEffect(() => {
    let cancelled = false;

    // Small delay to let the UI render before starting
    const timer = setTimeout(() => {
      if (!cancelled) {
        start();
      }
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle conversation end — when agent disconnects, complete session
  useEffect(() => {
    if (status === 'disconnected' && entries.length > 0 && !hasCompleted.current) {
      hasCompleted.current = true;
      // Stop camera stream
      if (cameraStream) {
        cameraStream.getTracks().forEach((t) => t.stop());
        setCameraStream(null);
      }
      completeSession().then(() => onComplete());
    }
  }, [status, entries.length, completeSession, onComplete, cameraStream, setCameraStream]);

  // Save transcript periodically to the session (via conversation turns)
  const lastSavedCount = useRef(0);
  useEffect(() => {
    if (!sessionId || entries.length <= lastSavedCount.current) return;

    // Save new entries
    const newEntries = entries.slice(lastSavedCount.current);
    lastSavedCount.current = entries.length;

    // Fire and forget — save turns in the background
    for (const entry of newEntries) {
      fetch('/api/interview/submit-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          flow_item_id: null,
          conversation_turn: {
            role: entry.speaker === 'ai' ? 'assistant' : 'user',
            content: entry.text,
            timestamp: entry.timestamp,
          },
        }),
      }).catch((err) => console.error('Failed to save turn:', err));
    }
  }, [entries, sessionId]);

  // Show stimulus for the first section that has one
  useEffect(() => {
    const idx = sections.findIndex((s) => !!s.stimulus_type);
    if (idx >= 0) {
      setStimulusSectionIdx(idx);
      setShowStimulus(true);
      const timer = setTimeout(() => setShowStimulus(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [sections]);

  // Get frequency data callbacks for the orb — memoize to avoid re-renders
  const getOutputFrequencyData = useCallback(() => {
    if (conversation) {
      return conversation.getOutputByteFrequencyData();
    }
    return new Uint8Array(0);
  }, [conversation]);

  const getInputFrequencyData = useCallback(() => {
    if (conversation) {
      return conversation.getInputByteFrequencyData();
    }
    return new Uint8Array(0);
  }, [conversation]);

  // Pick the right frequency data source based on orb state
  const activeGetFrequencyData = orbState === 'speaking'
    ? getOutputFrequencyData
    : orbState === 'listening'
      ? getInputFrequencyData
      : undefined;

  const stimulusSection = sections[stimulusSectionIdx];

  return (
    <div className="min-h-[100dvh] bg-neutral-900 text-white flex flex-col items-center justify-center relative">
      {/* Status indicator */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-10">
        <span className="text-sm text-neutral-400">
          {status === 'connecting' ? 'Connecting...' : status === 'connected' ? 'Interview in progress' : ''}
        </span>
      </div>

      {/* Error banner */}
      {error && (
        <div className="absolute top-16 left-6 right-6 z-10 bg-red-900/80 border border-red-700 rounded-lg px-4 py-3">
          <p className="text-sm text-red-200 text-center">{error}</p>
          <button
            onClick={() => start()}
            className="block mx-auto mt-2 text-xs text-red-300 underline hover:text-white"
          >
            Try again
          </button>
        </div>
      )}

      {/* Stimulus overlay */}
      {showStimulus && stimulusSection?.stimulus_type && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 p-8">
          <div className="max-w-lg w-full bg-neutral-800 rounded-2xl overflow-hidden">
            <StimulusDisplay
              type={stimulusSection.stimulus_type}
              config={stimulusSection.stimulus_config}
              className="[&_p]:text-neutral-300"
            />
            <button
              onClick={() => setShowStimulus(false)}
              className="w-full py-3 text-sm text-neutral-400 hover:text-white transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Central Orb */}
      <div className="flex-1 flex items-center justify-center">
        <AmbientOrb
          state={orbState}
          size="large"
          getFrequencyData={activeGetFrequencyData}
        />
      </div>

      {/* Floating Transcript */}
      <ConversationDisplay entries={entries} />

      {/* Camera PIP (video mode) */}
      <VideoPip stream={cameraStream} />

      {/* Footer */}
      <div className="absolute bottom-6 left-0 right-0 text-center">
        <p className="text-xs text-neutral-600">
          Powered by Undercurrent
        </p>
      </div>
    </div>
  );
}
