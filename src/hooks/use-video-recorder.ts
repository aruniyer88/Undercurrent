"use client";

import { useState, useRef, useCallback, useEffect } from "react";

// Network Information API types (not in standard TypeScript lib)
interface NetworkInformation {
  effectiveType?: "slow-2g" | "2g" | "3g" | "4g";
}

interface NavigatorWithConnection extends Navigator {
  connection?: NetworkInformation;
}
import type {
  VideoMetadata,
  VideoUploadSession,
  PermissionState,
  CameraPermissions,
} from "@/lib/types/video-recording";
import {
  MAX_RECORDING_DURATION_MS,
  CHUNK_INTERVAL_MS,
  CAMERA_MONITOR_INTERVAL_MS,
  DEFAULT_VIDEO_QUALITY,
  FALLBACK_VIDEO_QUALITY,
  LOW_BANDWIDTH_QUALITY,
  VIDEO_QUALITY_CONSTRAINTS,
} from "@/lib/types/video-recording";

interface UseVideoRecorderOptions {
  cameraRequired: boolean;
  itemId: string;
  studyId: string;
  participantId: string;
  onRecordingComplete?: (metadata: VideoMetadata) => void;
  onCameraLost?: () => void;
  onMaxDurationReached?: () => void;
}

interface UseVideoRecorderReturn {
  // State
  isRecording: boolean;
  duration: number;
  error: string | null;
  permissionState: PermissionState;
  isCameraActive: boolean;
  uploadProgress: number; // % of chunks uploaded
  stream: MediaStream | null;

  // Actions
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<VideoMetadata | null>;
  markAnswerStart: () => void;
  markAnswerEnd: () => void;
  checkPermissions: () => Promise<CameraPermissions>;
  toggleCamera: () => void;
}

export function useVideoRecorder(
  options: UseVideoRecorderOptions
): UseVideoRecorderReturn {
  const {
    cameraRequired,
    itemId,
    studyId,
    participantId,
    onRecordingComplete,
    onCameraLost,
    onMaxDurationReached,
  } = options;

  // State
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<PermissionState>("checking");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const cameraMonitorRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const timestampRef = useRef({
    questionStartTime: null as number | null,
    answerStartTime: null as number | null,
    answerEndTime: null as number | null,
  });
  const uploadedChunksRef = useRef<number>(0);
  const totalChunksRef = useRef<number>(0);
  const sessionRef = useRef<VideoUploadSession | null>(null);
  const failedChunksRef = useRef<Map<number, Blob>>(new Map());

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (cameraMonitorRef.current) {
        clearInterval(cameraMonitorRef.current);
      }
    };
  }, []);

  // Check permissions on mount
  useEffect(() => {
    checkPermissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkPermissions = useCallback(async (): Promise<CameraPermissions> => {
    setPermissionState("checking");

    try {
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
        video: {
          facingMode: "user",
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      stream.getTracks().forEach((track) => track.stop());

      setPermissionState("granted");
      setError(null);
      return { camera: true, microphone: true };
    } catch (err) {
      if (err instanceof Error) {
        if (
          err.name === "NotAllowedError" ||
          err.name === "PermissionDeniedError"
        ) {
          setPermissionState("denied");
          setError("Camera and microphone access denied. Please enable in browser settings.");
        } else if (err.name === "NotFoundError") {
          setPermissionState("denied");
          setError("No camera or microphone found. Please connect these devices.");
        } else {
          setPermissionState("denied");
          setError(`Media error: ${err.message}`);
        }
      }
      return { camera: false, microphone: false };
    }
  }, []);

  const getAdaptiveVideoConstraints = useCallback(() => {
    // Check network quality
    const connection = (navigator as NavigatorWithConnection).connection;
    let quality = DEFAULT_VIDEO_QUALITY;

    if (connection) {
      const effectiveType = connection.effectiveType;
      if (effectiveType === "3g" || effectiveType === "slow-2g") {
        quality = LOW_BANDWIDTH_QUALITY;
      } else if (effectiveType === "2g") {
        quality = FALLBACK_VIDEO_QUALITY;
      }
    }

    const constraints = VIDEO_QUALITY_CONSTRAINTS[quality];

    return {
      width: { ideal: constraints.width },
      height: { ideal: constraints.height },
      frameRate: { ideal: constraints.frameRate },
      facingMode: "user",
    };
  }, []);

  const initializeUploadSession = useCallback(async (): Promise<VideoUploadSession> => {
    const response = await fetch("/api/videos/start-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studyId,
        participantId,
        itemId,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to initialize upload session");
    }

    return response.json();
  }, [studyId, participantId, itemId]);

  const uploadChunk = useCallback(
    async (chunk: Blob, index: number): Promise<void> => {
      if (!sessionRef.current) return;

      const formData = new FormData();
      formData.append("chunk", chunk);
      formData.append("chunkIndex", index.toString());
      formData.append("sessionId", sessionRef.current.sessionId);
      formData.append("studyId", studyId);
      formData.append("participantId", participantId);

      // Retry up to 3 times
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const response = await fetch("/api/videos/upload-chunk", {
            method: "POST",
            body: formData,
          });

          if (response.ok) {
            uploadedChunksRef.current++;
            failedChunksRef.current.delete(index);
            setUploadProgress(
              Math.round((uploadedChunksRef.current / totalChunksRef.current) * 100)
            );
            return;
          }
        } catch (error) {
          console.error(`Chunk ${index} upload failed (attempt ${attempt + 1}):`, error);
          if (attempt === 2) {
            // Store failed chunk for retry
            failedChunksRef.current.set(index, chunk);
          } else {
            // Wait before retry with exponential backoff
            await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000));
          }
        }
      }
    },
    [studyId, participantId]
  );

  const retryFailedChunks = useCallback(async (): Promise<void> => {
    const failedChunks = Array.from(failedChunksRef.current.entries());

    for (const [index, chunk] of failedChunks) {
      await uploadChunk(chunk, index);
    }
  }, [uploadChunk]);

  const startCameraMonitoring = useCallback(() => {
    if (!cameraRequired || !streamRef.current) return;

    cameraMonitorRef.current = setInterval(() => {
      const videoTrack = streamRef.current?.getVideoTracks()[0];
      const isActive = videoTrack?.enabled && videoTrack?.readyState === "live";

      setIsCameraActive(!!isActive);

      if (!isActive) {
        onCameraLost?.();
      }
    }, CAMERA_MONITOR_INTERVAL_MS);
  }, [cameraRequired, onCameraLost]);

  const stopCameraMonitoring = useCallback(() => {
    if (cameraMonitorRef.current) {
      clearInterval(cameraMonitorRef.current);
      cameraMonitorRef.current = null;
    }
  }, []);

  const markAnswerStart = useCallback(() => {
    timestampRef.current.answerStartTime = Date.now();
  }, []);

  const markAnswerEnd = useCallback(() => {
    timestampRef.current.answerEndTime = Date.now();
  }, []);

  const toggleCamera = useCallback(() => {
    if (!streamRef.current) return;

    const videoTrack = streamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsCameraActive(videoTrack.enabled);
    }
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    uploadedChunksRef.current = 0;
    totalChunksRef.current = 0;
    failedChunksRef.current.clear();
    setUploadProgress(0);

    try {
      // Initialize upload session
      const session = await initializeUploadSession();
      sessionRef.current = session;

      // Get media stream with adaptive quality
      const videoConstraints = getAdaptiveVideoConstraints();
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
        video: videoConstraints,
      });

      streamRef.current = mediaStream;
      setStream(mediaStream);
      setPermissionState("granted");
      setIsCameraActive(true);

      // Determine best supported MIME type
      const mimeType = getSupportedVideoMimeType();

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(mediaStream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      // Handle data available - upload chunks as they come
      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          const chunkIndex = totalChunksRef.current;
          totalChunksRef.current++;

          // Upload chunk immediately (non-blocking)
          uploadChunk(event.data, chunkIndex).catch((error) => {
            console.error(`Failed to upload chunk ${chunkIndex}:`, error);
          });
        }
      };

      // Handle stop
      mediaRecorder.onstop = async () => {
        setIsRecording(false);
        stopCameraMonitoring();

        // Retry any failed chunks
        await retryFailedChunks();

        // Clean up stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
          setStream(null);
        }
      };

      // Start recording with chunk interval
      mediaRecorder.start(CHUNK_INTERVAL_MS);
      setIsRecording(true);
      startTimeRef.current = Date.now();
      timestampRef.current.questionStartTime = Date.now();
      setDuration(0);

      // Start camera monitoring if required
      if (cameraRequired) {
        startCameraMonitoring();
      }

      // Start duration timer
      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        setDuration(elapsed);

        // Auto-stop at max duration
        if (elapsed >= MAX_RECORDING_DURATION_MS) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          if (
            mediaRecorderRef.current &&
            mediaRecorderRef.current.state !== "inactive"
          ) {
            mediaRecorderRef.current.stop();
          }
          onMaxDurationReached?.();
        }
      }, 100);
    } catch (err) {
      if (err instanceof Error) {
        if (
          err.name === "NotAllowedError" ||
          err.name === "PermissionDeniedError"
        ) {
          setPermissionState("denied");
          setError("Camera access denied. Please enable in browser settings.");
        } else if (err.name === "NotFoundError") {
          setError("No camera found. Please connect a camera.");
        } else {
          setError(`Failed to start recording: ${err.message}`);
        }
      }
    }
  }, [
    cameraRequired,
    getAdaptiveVideoConstraints,
    initializeUploadSession,
    onMaxDurationReached,
    retryFailedChunks,
    startCameraMonitoring,
    stopCameraMonitoring,
    uploadChunk,
  ]);

  const stopRecording = useCallback(async (): Promise<VideoMetadata | null> => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }

    setIsRecording(false);

    if (!sessionRef.current) return null;

    // Calculate timestamp offsets
    const answerStartOffset =
      (timestampRef.current.answerStartTime || 0) -
      (timestampRef.current.questionStartTime || 0);
    const answerEndOffset =
      (timestampRef.current.answerEndTime || Date.now()) -
      (timestampRef.current.questionStartTime || 0);

    // Get resolution from stream
    const videoTrack = streamRef.current?.getVideoTracks()[0];
    const settings = videoTrack?.getSettings();
    const resolution = settings
      ? `${settings.width}x${settings.height}`
      : "unknown";

    const metadata: VideoMetadata = {
      sessionId: sessionRef.current.sessionId,
      totalChunks: totalChunksRef.current,
      totalDuration: duration,
      answerStartOffset,
      answerEndOffset,
      format: "webm",
      resolution,
    };

    // Finalize upload on backend
    try {
      const response = await fetch("/api/videos/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...metadata,
          studyId,
          participantId,
          itemId,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        metadata.videoUrl = result.videoUrl;
        onRecordingComplete?.(metadata);
      } else {
        throw new Error("Failed to finalize video upload");
      }
    } catch (err) {
      console.error("Finalization error:", err);
      setError("Failed to finalize video. Please try again.");
      return null;
    }

    return metadata;
  }, [duration, itemId, onRecordingComplete, participantId, studyId]);

  return {
    isRecording,
    duration,
    error,
    permissionState,
    isCameraActive,
    uploadProgress,
    stream,
    startRecording,
    stopRecording,
    markAnswerStart,
    markAnswerEnd,
    checkPermissions,
    toggleCamera,
  };
}

// Helper to get best supported MIME type for video recording
function getSupportedVideoMimeType(): string {
  const types = [
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
    "video/mp4",
  ];

  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }

  // Fallback
  return "video/webm";
}
