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
  | 'welcome'
  | 'consent'
  | 'permission'
  | 'interview'
  | 'thank-you';

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
  /** Speak text via ElevenLabs TTS. Pass sessionId for authenticated API access. */
  speak: (text: string, voiceId: string, sessionId?: string) => Promise<void>;
  /** Stop TTS playback */
  stopSpeaking: () => void;
  /** Start recording participant audio */
  startRecording: () => Promise<void>;
  /** Stop recording and get transcription. Pass sessionId for authenticated API access. */
  stopRecording: (sessionId?: string) => Promise<string | null>;
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

  // Camera stream (video mode) — preserved from permission screen for use during interview
  cameraStream: MediaStream | null;
  setCameraStream: (stream: MediaStream | null) => void;

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

export interface ConsentScreenProps {
  onContinue: () => void;
}

export interface PermissionScreenProps {
  onContinue: () => void;
}

export interface ThankYouScreenProps {
  redirectUrl?: string | null;
}
