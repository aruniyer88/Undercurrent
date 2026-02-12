// ============================================
// INTERVIEW EXPERIENCE TYPES
// Types for the participant interview UI
// ============================================

import type {
  Study,
  StudyFlowWithSections,
  FlowSectionWithItems,
  FlowItem,
  VoiceProfile,
  Distribution,
  InterviewSession,
} from './database';

// ============================================
// SCREEN & NAVIGATION
// ============================================

export type InterviewScreen =
  | 'welcome'       // Redesigned: merged consent + language
  | 'onboarding'    // 3-slide carousel
  | 'device-setup'  // Replaces permission-screen
  | 'connecting'    // Brief transition
  | 'interview'     // Completely redesigned
  | 'paused'        // Pause screen
  | 'thank-you';

// ============================================
// LAYOUT VARIANTS
// ============================================

/** Layout variants for the live interview screen */
export type InterviewLayoutVariant =
  | 'video-only'           // Camera bg, AI text overlay
  | 'video-stimulus'       // Camera PiP, stimulus center
  | 'video-stimulus-ui'    // Camera PiP, stimulus + question UI split
  | 'video-ui'             // Camera PiP, question UI only (no stimulus)
  | 'voice-only'           // Large orb center, AI text overlay
  | 'voice-stimulus'       // Stimulus center, AI text overlay
  | 'voice-stimulus-ui'    // Stimulus + question UI, AI text overlay
  | 'voice-ui';            // Question UI center, AI text overlay

/** Determine layout variant from current interview state */
export function getLayoutVariant(
  interviewMode: 'video' | 'voice',
  hasStimulus: boolean,
  hasScreenUI: boolean
): InterviewLayoutVariant {
  if (interviewMode === 'video') {
    if (hasStimulus && hasScreenUI) return 'video-stimulus-ui';
    if (hasStimulus) return 'video-stimulus';
    if (hasScreenUI) return 'video-ui';
    return 'video-only';
  }
  // voice mode
  if (hasStimulus && hasScreenUI) return 'voice-stimulus-ui';
  if (hasStimulus) return 'voice-stimulus';
  if (hasScreenUI) return 'voice-ui';
  return 'voice-only';
}

/** Item types that render interactive on-screen UI (not voice-only) */
const SCREEN_UI_ITEM_TYPES = new Set([
  'single_select',
  'multi_select',
  'rating_scale',
  'ranking',
]);

export function itemHasScreenUI(itemType: string): boolean {
  return SCREEN_UI_ITEM_TYPES.has(itemType);
}

// ============================================
// MIC BUTTON STATES
// ============================================

export type MicButtonState = 'ready' | 'recording' | 'processing' | 'ai-speaking';

// ============================================
// ORB STATES
// ============================================

export type OrbState = 'idle' | 'speaking' | 'listening' | 'thinking';
export type OrbSize = 'small' | 'large';

export interface OrbProps {
  state: OrbState;
  size: OrbSize;
  /** AnalyserNode for audio-reactive animation (structured interview) */
  analyserNode?: AnalyserNode | null;
  /** Alternative: raw frequency data callback (ElevenLabs ConvAI SDK) */
  getFrequencyData?: () => Uint8Array;
  className?: string;
}

// ============================================
// AUDIO PIPELINE
// ============================================

export type AudioPipelineState =
  | 'idle'
  | 'synthesizing' // Fetching TTS audio
  | 'playing'      // Playing TTS audio
  | 'recording'    // Recording participant
  | 'transcribing' // Sending to Whisper
  | 'error';

export interface AudioPipelineControls {
  state: AudioPipelineState;
  /** Speak text via ElevenLabs TTS. Pass sessionId for authenticated API access. Optional language ISO code for multilingual TTS. */
  speak: (text: string, voiceId: string, sessionId?: string, language?: string) => Promise<void>;
  /** Stop TTS playback */
  stopSpeaking: () => void;
  /** Start recording participant audio */
  startRecording: () => Promise<void>;
  /** Stop recording and get transcription. Pass sessionId for authenticated API access. */
  stopRecording: (sessionId?: string) => Promise<string | null>;
  /** Stop TTS playback and immediately start recording (interrupt flow) */
  interruptAndRecord: (sessionId?: string) => Promise<void>;
  /** AnalyserNode for TTS audio visualization */
  ttsAnalyser: AnalyserNode | null;
  /** AnalyserNode for mic audio visualization */
  micAnalyser: AnalyserNode | null;
  /** Current error message */
  error: string | null;
}

// ============================================
// INTERVIEW SESSION CONTEXT
// ============================================

export interface ResumeProgress {
  sessionId: string;
  sectionIndex: number;
  itemIndex: number;
}

export interface InterviewContextValue {
  // Study data
  study: Study;
  studyFlow: StudyFlowWithSections;
  voiceProfile: VoiceProfile | null;
  distribution: Distribution | null;
  token: string;

  // Session
  session: InterviewSession | null;
  sessionId: string | null;

  // Navigation
  currentScreen: InterviewScreen;
  setCurrentScreen: (screen: InterviewScreen) => void;

  // Participant
  participantName: string;
  setParticipantName: (name: string) => void;
  participantEmail: string;
  setParticipantEmail: (email: string) => void;

  // Audio pipeline
  audio: AudioPipelineControls;

  // Permissions
  permissionsGranted: boolean;
  setPermissionsGranted: (granted: boolean) => void;

  // Camera stream (video mode) — preserved from device setup for use during interview
  cameraStream: MediaStream | null;
  setCameraStream: (stream: MediaStream | null) => void;

  // Pause / Resume
  isPaused: boolean;
  pauseInterview: () => Promise<void>;
  resumeInterview: () => Promise<void>;
  isResuming: boolean;
  answeredItemIds: Set<string>;
  resumeProgress: ResumeProgress | null;

  // Onboarding
  onboardingComplete: boolean;
  setOnboardingComplete: (complete: boolean) => void;

  // Session management
  startSession: () => Promise<string | null>;
  completeSession: () => Promise<void>;

  // Sorted sections and items for easy traversal
  sections: FlowSectionWithItems[];
  totalQuestions: number;
}

// ============================================
// QUESTION RENDERER PROPS
// ============================================

export interface QuestionRendererProps {
  item: FlowItem;
  section: FlowSectionWithItems;
  onSubmit: (response: QuestionResponse) => void;
  audio: AudioPipelineControls;
  isActive: boolean;
  /** Active interview session ID — passed to audio pipeline for API auth */
  sessionId?: string;
  /** Compact layout for split views */
  variant?: 'default' | 'compact';
}

export interface QuestionResponse {
  flowItemId: string;
  textResponse?: string | null;
  selectedOptions?: string[] | null;
  ratingValue?: number | null;
  rankedItems?: string[] | null;
  audioBlob?: Blob | null;
  conversationTranscript?: Array<{ role: 'user' | 'assistant'; content: string; timestamp: string }> | null;
  conversationDurationSeconds?: number | null;
}

// ============================================
// STRUCTURED INTERVIEW
// ============================================

export interface StructuredInterviewProps {
  onComplete: () => void;
}

export interface QuestionNavigationState {
  sectionIndex: number;
  itemIndex: number;
  /** Flat index across all sections */
  questionNumber: number;
}

// ============================================
// STREAMING INTERVIEW
// ============================================

export interface StreamingInterviewProps {
  onComplete: () => void;
}

export interface ConversationEntry {
  id: string;
  speaker: 'ai' | 'participant';
  text: string;
  timestamp: string;
}

// ============================================
// SCREEN PROPS
// ============================================

export interface WelcomeScreenProps {
  onContinue: () => void;
}

export interface OnboardingScreenProps {
  onContinue: () => void;
  onBack: () => void;
  studyType?: 'structured' | 'streaming';
  interviewMode?: 'video' | 'voice';
}

export interface DeviceSetupScreenProps {
  onContinue: () => void;
}

export interface ConnectingScreenProps {
  onReady: () => void;
}

export interface PauseScreenProps {
  onResume: () => void;
}

export interface ThankYouScreenProps {
  redirectUrl?: string | null;
}

// Legacy — kept for backwards compat during transition
export interface ConsentScreenProps {
  onContinue: () => void;
}

export interface PermissionScreenProps {
  onContinue: () => void;
}
