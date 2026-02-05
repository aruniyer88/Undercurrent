// ============================================
// VIDEO RECORDING TYPES
// Types for video recording functionality
// ============================================

export type VideoQuality = '360p' | '480p' | '720p' | '1080p';
export type VideoFormat = 'webm' | 'mp4';

export interface VideoConstraints {
  width: number;
  height: number;
  frameRate: number;
}

export const VIDEO_QUALITY_CONSTRAINTS: Record<VideoQuality, VideoConstraints> = {
  '360p': { width: 640, height: 360, frameRate: 24 },
  '480p': { width: 854, height: 480, frameRate: 24 },
  '720p': { width: 1280, height: 720, frameRate: 30 },
  '1080p': { width: 1920, height: 1080, frameRate: 30 }
};

// Default quality settings
export const DEFAULT_VIDEO_QUALITY: VideoQuality = '720p';
export const FALLBACK_VIDEO_QUALITY: VideoQuality = '480p';
export const LOW_BANDWIDTH_QUALITY: VideoQuality = '360p';

// Recording constraints
export const MAX_RECORDING_DURATION_MS = 30 * 60 * 1000; // 30 minutes
export const CHUNK_INTERVAL_MS = 3000; // Upload every 3 seconds
export const MAX_RETRY_ATTEMPTS = 3;
export const CAMERA_MONITOR_INTERVAL_MS = 500;

// Video metadata returned after recording
export interface VideoMetadata {
  sessionId: string;
  totalChunks: number;
  totalDuration: number; // milliseconds
  answerStartOffset: number; // milliseconds from video start
  answerEndOffset: number; // milliseconds from video end
  format: string;
  resolution: string;
  videoUrl?: string; // Set by backend after finalization
}

// Upload session information
export interface VideoUploadSession {
  sessionId: string;
  sessionPath: string;
  uploadEndpoint: string;
}

// Browser support check result
export interface BrowserSupportResult {
  supported: boolean;
  message?: string;
  supportedMimeTypes?: string[];
}

// Permission states
export type PermissionState = 'prompt' | 'granted' | 'denied' | 'checking';

// Recording states
export type RecorderState =
  | 'permission-check'
  | 'permission-denied'
  | 'camera-preview'
  | 'countdown'
  | 'recording'
  | 'uploading';

// Camera permissions
export interface CameraPermissions {
  camera: boolean;
  microphone: boolean;
}
