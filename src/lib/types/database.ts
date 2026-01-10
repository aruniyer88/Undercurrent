// ============================================
// UNDERCURRENT DATABASE TYPES
// TypeScript types matching the Supabase schema
// ============================================

// ============================================
// ENUM TYPES
// ============================================

export type StudyStatus = 
  | 'draft'
  | 'ready_for_test'
  | 'tested'
  | 'live'
  | 'closed';

export type ProjectType = 
  | 'discovery'
  | 'concept_testing'
  | 'creative_testing'
  | 'brand_health';

export type VoiceType = 
  | 'preset'
  | 'cloned';

export type InterviewStatus = 
  | 'created'
  | 'in_progress'
  | 'completed'
  | 'failed';

export type JobStatus = 
  | 'queued'
  | 'running'
  | 'done'
  | 'failed';

export type JobType = 
  | 'transcription'
  | 'synthesis'
  | 'voice_clone';

// ============================================
// TABLE TYPES
// ============================================

export interface Study {
  id: string;
  user_id: string;
  title: string;
  status: StudyStatus;
  project_type: ProjectType | null;
  objective: string | null;
  topics: string[] | null;
  success_criteria: string | null;
  audience: string | null;
  guidelines: string | null;
  intro_text: string | null;
  brief_messages: BriefMessage[];
  voice_profile_id: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  closed_at: string | null;
}

export interface VoiceProfile {
  id: string;
  user_id: string;
  name: string;
  type: VoiceType;
  description: string | null;
  provider_voice_id: string | null;
  style_config: VoiceStyleConfig;
  samples_storage_paths: string[] | null;
  consent_confirmed: boolean;
  consent_confirmed_at: string | null;
  consent_owner_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface InterviewGuide {
  id: string;
  study_id: string;
  sections: GuideSection[];
  approved_at: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Interview {
  id: string;
  study_id: string;
  token: string;
  status: InterviewStatus;
  participant_name: string | null;
  participant_metadata: Record<string, unknown>;
  recording_path: string | null;
  transcript_path: string | null;
  transcript_text: string | null;
  started_at: string | null;
  completed_at: string | null;
  duration_seconds: number | null;
  is_test: boolean;
  metadata: InterviewMetadata;
  created_at: string;
  updated_at: string;
}

export interface Report {
  id: string;
  study_id: string;
  summary: string | null;
  insights: Insight[];
  share_token: string;
  is_public: boolean;
  generated_at: string | null;
  generation_metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: string;
  type: JobType;
  payload: Record<string, unknown>;
  status: JobStatus;
  attempts: number;
  max_attempts: number;
  result: Record<string, unknown> | null;
  error_message: string | null;
  scheduled_for: string;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// NESTED/JSONB TYPES
// ============================================

export interface BriefMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface VoiceStyleConfig {
  tone?: 'warm' | 'neutral' | 'direct';
  pacing?: 'slow' | 'normal' | 'fast';
  dialect?: string;
  keyPhrases?: string[];
}

export interface GuideSection {
  id: string;
  title: string;
  questions: GuideQuestion[];
}

export interface GuideQuestion {
  id: string;
  text: string;
  probes: string[];
}

export interface InterviewMetadata {
  deviceType?: string;
  browser?: string;
  questionCount?: number;
  [key: string]: unknown;
}

export interface Insight {
  id: string;
  headline: string;
  description?: string;
  evidence: InsightEvidence[];
}

export interface InsightEvidence {
  quote: string;
  interviewId: string;
  timestamp?: number;
}

// ============================================
// INSERT/UPDATE TYPES
// ============================================

export type StudyInsert = Omit<Study, 'id' | 'created_at' | 'updated_at'>;
export type StudyUpdate = Partial<Omit<Study, 'id' | 'created_at' | 'updated_at'>>;

export type VoiceProfileInsert = Omit<VoiceProfile, 'id' | 'created_at' | 'updated_at'>;
export type VoiceProfileUpdate = Partial<Omit<VoiceProfile, 'id' | 'created_at' | 'updated_at'>>;

export type InterviewGuideInsert = Omit<InterviewGuide, 'id' | 'created_at' | 'updated_at'>;
export type InterviewGuideUpdate = Partial<Omit<InterviewGuide, 'id' | 'created_at' | 'updated_at'>>;

export type InterviewInsert = Omit<Interview, 'id' | 'token' | 'created_at' | 'updated_at'>;
export type InterviewUpdate = Partial<Omit<Interview, 'id' | 'token' | 'created_at' | 'updated_at'>>;

export type ReportInsert = Omit<Report, 'id' | 'share_token' | 'created_at' | 'updated_at'>;
export type ReportUpdate = Partial<Omit<Report, 'id' | 'share_token' | 'created_at' | 'updated_at'>>;

export type JobInsert = Omit<Job, 'id' | 'created_at' | 'updated_at'>;
export type JobUpdate = Partial<Omit<Job, 'id' | 'created_at' | 'updated_at'>>;

// ============================================
// QUERY RESULT TYPES (with relations)
// ============================================

export interface StudyWithRelations extends Study {
  voice_profile?: VoiceProfile | null;
  interview_guide?: InterviewGuide | null;
  interviews?: Interview[];
  report?: Report | null;
}

export interface InterviewWithStudy extends Interview {
  study?: Study;
}

