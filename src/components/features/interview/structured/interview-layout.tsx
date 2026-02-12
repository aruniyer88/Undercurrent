'use client';

import { useRef, useEffect } from 'react';
import type { InterviewLayoutVariant, AudioPipelineState } from '@/lib/types/interview';
import { StimulusDisplay } from '../shared/stimulus-display';
import { AmbientOrb } from '../shared/ambient-orb';
import { VideoPip } from '../shared/video-pip';
import { AITextOverlay } from './ai-text-overlay';
import type { FlowSectionWithItems } from '@/lib/types/database';
import type { OrbState } from '@/lib/types/interview';

interface InterviewLayoutProps {
  variant: InterviewLayoutVariant;
  /** AI question text currently being spoken */
  aiText: string;
  audioState: AudioPipelineState;
  /** Camera stream for video modes */
  cameraStream: MediaStream | null;
  /** Current section (for stimulus) */
  section: FlowSectionWithItems;
  /** Orb state for voice-only variant */
  orbState: OrbState;
  /** TTS analyser node for orb animation */
  ttsAnalyser: AnalyserNode | null;
  /** Question UI rendered by parent */
  children?: React.ReactNode;
}

export function InterviewLayout({
  variant,
  aiText,
  audioState,
  cameraStream,
  section,
  orbState,
  ttsAnalyser,
  children,
}: InterviewLayoutProps) {
  switch (variant) {
    case 'video-only':
      return (
        <VideoOnlyLayout
          aiText={aiText}
          audioState={audioState}
          cameraStream={cameraStream}
        />
      );
    case 'video-stimulus':
      return (
        <VideoStimulusLayout
          aiText={aiText}
          audioState={audioState}
          cameraStream={cameraStream}
          section={section}
        />
      );
    case 'video-stimulus-ui':
      return (
        <VideoStimulusUILayout
          aiText={aiText}
          audioState={audioState}
          cameraStream={cameraStream}
          section={section}
        >
          {children}
        </VideoStimulusUILayout>
      );
    case 'video-ui':
      return (
        <VideoUILayout
          aiText={aiText}
          audioState={audioState}
          cameraStream={cameraStream}
        >
          {children}
        </VideoUILayout>
      );
    case 'voice-only':
      return (
        <VoiceOnlyLayout
          aiText={aiText}
          audioState={audioState}
          orbState={orbState}
          ttsAnalyser={ttsAnalyser}
        />
      );
    case 'voice-stimulus':
      return (
        <VoiceStimulusLayout
          aiText={aiText}
          audioState={audioState}
          section={section}
        />
      );
    case 'voice-stimulus-ui':
      return (
        <VoiceStimulusUILayout
          aiText={aiText}
          audioState={audioState}
          section={section}
        >
          {children}
        </VoiceStimulusUILayout>
      );
    case 'voice-ui':
      return (
        <VoiceUILayout
          aiText={aiText}
          audioState={audioState}
        >
          {children}
        </VoiceUILayout>
      );
  }
}

// ============================================
// 7A. VIDEO-ONLY: Full-screen camera + AI text overlay
// ============================================

function VideoOnlyLayout({
  aiText,
  audioState,
  cameraStream,
}: {
  aiText: string;
  audioState: AudioPipelineState;
  cameraStream: MediaStream | null;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  return (
    <div className="fixed inset-0 pb-20">
      {/* Full-screen camera */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover -scale-x-100"
      />

      {/* AI text overlay */}
      <AITextOverlay text={aiText} audioState={audioState} />
    </div>
  );
}

// ============================================
// 7B. VIDEO-STIMULUS: Camera PiP + stimulus center
// ============================================

function VideoStimulusLayout({
  aiText,
  audioState,
  cameraStream,
  section,
}: {
  aiText: string;
  audioState: AudioPipelineState;
  cameraStream: MediaStream | null;
  section: FlowSectionWithItems;
}) {
  return (
    <div className="fixed inset-0 pb-20">
      {/* Stimulus fills main area */}
      <div className="absolute inset-0 flex items-center justify-center p-4 pt-20">
        {section.stimulus_type && (
          <StimulusDisplay
            type={section.stimulus_type}
            config={section.stimulus_config}
            className="max-h-full"
          />
        )}
      </div>

      {/* AI text overlay */}
      <AITextOverlay text={aiText} audioState={audioState} />

      {/* Camera PiP */}
      <VideoPip stream={cameraStream} />
    </div>
  );
}

// ============================================
// 7C. VIDEO-STIMULUS-UI: Camera PiP + stimulus + question UI split
// ============================================

function VideoStimulusUILayout({
  aiText,
  audioState,
  cameraStream,
  section,
  children,
}: {
  aiText: string;
  audioState: AudioPipelineState;
  cameraStream: MediaStream | null;
  section: FlowSectionWithItems;
  children?: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 pb-20">
      {/* AI text overlay spanning full width */}
      <AITextOverlay text={aiText} audioState={audioState} />

      {/* Desktop: split grid. Mobile: vertical stack */}
      <div className="absolute inset-0 pt-20 flex flex-col md:grid md:grid-cols-[3fr_2fr]">
        {/* Stimulus */}
        <div className="flex-1 md:flex-auto overflow-auto p-4 flex items-center justify-center">
          {section.stimulus_type && (
            <StimulusDisplay
              type={section.stimulus_type}
              config={section.stimulus_config}
              className="max-h-full"
            />
          )}
        </div>

        {/* Question UI */}
        <div className="flex-shrink-0 md:flex-auto overflow-auto p-4 md:border-l md:border-white/10 bg-neutral-50/95 md:bg-white/95">
          {children}
        </div>
      </div>

      {/* Camera PiP */}
      <VideoPip stream={cameraStream} />
    </div>
  );
}

// ============================================
// 7D. VIDEO-UI: Camera PiP + question UI only
// ============================================

function VideoUILayout({
  aiText,
  audioState,
  cameraStream,
  children,
}: {
  aiText: string;
  audioState: AudioPipelineState;
  cameraStream: MediaStream | null;
  children?: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 pb-20 bg-neutral-50">
      {/* AI text overlay */}
      <AITextOverlay text={aiText} audioState={audioState} />

      {/* Question UI centered */}
      <div className="absolute inset-0 pt-20 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full">
          {children}
        </div>
      </div>

      {/* Camera PiP */}
      <VideoPip stream={cameraStream} />
    </div>
  );
}

// ============================================
// 7E. VOICE-ONLY: Large orb center + AI text overlay
// ============================================

function VoiceOnlyLayout({
  aiText,
  audioState,
  orbState,
  ttsAnalyser,
}: {
  aiText: string;
  audioState: AudioPipelineState;
  orbState: OrbState;
  ttsAnalyser: AnalyserNode | null;
}) {
  return (
    <div className="fixed inset-0 pb-20 bg-neutral-950">
      {/* AI text overlay */}
      <AITextOverlay text={aiText} audioState={audioState} />

      {/* Large centered orb */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
        <AmbientOrb
          state={orbState}
          size="large"
          analyserNode={ttsAnalyser}
        />
        <p className="text-sm text-white/50">AI Interviewer</p>
      </div>
    </div>
  );
}

// ============================================
// 7F. VOICE-STIMULUS: Stimulus center + AI text overlay (no orb)
// ============================================

function VoiceStimulusLayout({
  aiText,
  audioState,
  section,
}: {
  aiText: string;
  audioState: AudioPipelineState;
  section: FlowSectionWithItems;
}) {
  return (
    <div className="fixed inset-0 pb-20 bg-neutral-50">
      {/* AI text overlay */}
      <AITextOverlay text={aiText} audioState={audioState} />

      {/* Stimulus fills main area */}
      <div className="absolute inset-0 pt-20 flex items-center justify-center p-4">
        {section.stimulus_type && (
          <StimulusDisplay
            type={section.stimulus_type}
            config={section.stimulus_config}
            className="max-h-full"
          />
        )}
      </div>
    </div>
  );
}

// ============================================
// 7G. VOICE-STIMULUS-UI: Stimulus + question UI split (no orb)
// ============================================

function VoiceStimulusUILayout({
  aiText,
  audioState,
  section,
  children,
}: {
  aiText: string;
  audioState: AudioPipelineState;
  section: FlowSectionWithItems;
  children?: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 pb-20 bg-neutral-50">
      {/* AI text overlay */}
      <AITextOverlay text={aiText} audioState={audioState} />

      {/* Desktop: split. Mobile: stack */}
      <div className="absolute inset-0 pt-20 flex flex-col md:grid md:grid-cols-[3fr_2fr]">
        {/* Stimulus */}
        <div className="flex-1 md:flex-auto overflow-auto p-4 flex items-center justify-center">
          {section.stimulus_type && (
            <StimulusDisplay
              type={section.stimulus_type}
              config={section.stimulus_config}
              className="max-h-full"
            />
          )}
        </div>

        {/* Question UI */}
        <div className="flex-shrink-0 md:flex-auto overflow-auto p-4 md:border-l md:border-neutral-200 bg-white">
          {children}
        </div>
      </div>
    </div>
  );
}

// ============================================
// 7H. VOICE-UI: Question UI center (no orb)
// ============================================

function VoiceUILayout({
  aiText,
  audioState,
  children,
}: {
  aiText: string;
  audioState: AudioPipelineState;
  children?: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 pb-20 bg-neutral-50">
      {/* AI text overlay */}
      <AITextOverlay text={aiText} audioState={audioState} />

      {/* Question UI centered */}
      <div className="absolute inset-0 pt-20 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full">
          {children}
        </div>
      </div>
    </div>
  );
}
