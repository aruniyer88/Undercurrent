// ============================================
// RESPONSES TAB UI TYPES
// Types for the responses list, detail, and overview
// ============================================

import type {
  ReviewStatus,
  InterviewSession,
  ConversationTurn,
  FlowItem,
  FlowSection,
  ScreenerQuestion,
  ScreenerResponse,
} from './database';

// ============================================
// COMPLETION STATUS (derived, not stored)
// ============================================

export type CompletionStatus = 'complete' | 'in_progress' | 'not_started';

export function deriveCompletionStatus(
  session: Pick<InterviewSession, 'started_at' | 'completed_at'>
): CompletionStatus {
  if (session.completed_at) return 'complete';
  if (session.started_at) return 'in_progress';
  return 'not_started';
}

// ============================================
// RESPONSE LIST
// ============================================

export interface ResponseListItem {
  id: string;
  rowNumber: number;
  participantName: string | null;
  participantEmail: string | null;
  startedAt: string | null;
  completedAt: string | null;
  completionStatus: CompletionStatus;
  reviewStatus: ReviewStatus;
  language: string | null;
  durationSeconds: number | null;
  recordingUrl: string | null;
}

export interface ResponseStats {
  totalSessions: number;
  completedSessions: number;
  acceptedSessions: number;
  avgDurationSeconds: number | null;
}

export interface ResponseFilters {
  completion: CompletionStatus | 'all';
  review: ReviewStatus | 'all';
  page: number;
  limit: number;
}

// ============================================
// RESPONSE DETAIL
// ============================================

export interface ResponseDetailData {
  session: InterviewSession;
  conversationTurns: ConversationTurn[];
  screenerResponses: (ScreenerResponse & {
    screener_question: ScreenerQuestion;
  })[];
  // Turns organized by section/item for transcript rendering
  transcript: TranscriptSection[];
}

export interface TranscriptSection {
  section: FlowSection;
  questions: TranscriptQuestion[];
}

export interface TranscriptQuestion {
  item: FlowItem;
  turns: ConversationTurn[];
}

// ============================================
// AUDIO SEGMENTS (for waveform player)
// ============================================

export interface AudioSegment {
  flowItemId: string;
  label: string;
  startMs: number;
  endMs: number;
  color: string;
}

// ============================================
// BULK ACTIONS
// ============================================

export type BulkReviewAction = 'accept_all' | 'reject_all' | 'reject_incomplete';

// ============================================
// EXPORT
// ============================================

export type ExportFormat = 'csv' | 'json';
