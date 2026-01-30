"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface UseVoiceRecorderOptions {
  maxDuration?: number; // in milliseconds, default 30000 (30 seconds)
  onRecordingComplete?: (blob: Blob) => void;
}

interface UseVoiceRecorderReturn {
  // State
  isRecording: boolean;
  duration: number; // Current recording duration in milliseconds
  audioBlob: Blob | null;
  audioUrl: string | null;
  error: string | null;
  permissionState: "prompt" | "granted" | "denied" | "checking";

  // Actions
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  resetRecording: () => void;
  checkPermission: () => Promise<boolean>;
}

export function useVoiceRecorder(
  options: UseVoiceRecorderOptions = {}
): UseVoiceRecorderReturn {
  const { maxDuration = 30000, onRecordingComplete } = options;

  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<
    "prompt" | "granted" | "denied" | "checking"
  >("checking");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [audioUrl]);

  // Check permission on mount
  useEffect(() => {
    checkPermission();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkPermission = useCallback(async (): Promise<boolean> => {
    setPermissionState("checking");

    try {
      // Try to check permission status if available
      if (navigator.permissions) {
        try {
          const result = await navigator.permissions.query({
            name: "microphone" as PermissionName,
          });
          if (result.state === "granted") {
            setPermissionState("granted");
            return true;
          } else if (result.state === "denied") {
            setPermissionState("denied");
            setError(
              "Microphone access denied. Please enable in browser settings."
            );
            return false;
          }
        } catch {
          // Permission query not supported, fall through to getUserMedia
        }
      }

      // Try to get media to trigger permission prompt
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setPermissionState("granted");
      setError(null);
      return true;
    } catch (err) {
      if (err instanceof Error) {
        if (
          err.name === "NotAllowedError" ||
          err.name === "PermissionDeniedError"
        ) {
          setPermissionState("denied");
          setError(
            "Microphone access denied. Please enable in browser settings."
          );
        } else if (err.name === "NotFoundError") {
          setPermissionState("denied");
          setError("No microphone found. Please connect a microphone.");
        } else {
          setPermissionState("denied");
          setError(`Microphone error: ${err.message}`);
        }
      }
      return false;
    }
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    chunksRef.current = [];

    try {
      // Get audio stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      streamRef.current = stream;
      setPermissionState("granted");

      // Determine best supported MIME type
      const mimeType = getSupportedMimeType();

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);

        // Create URL for preview
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        // Callback
        onRecordingComplete?.(blob);

        // Clean up stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
      };

      // Start recording
      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      startTimeRef.current = Date.now();
      setDuration(0);

      // Start duration timer
      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        setDuration(elapsed);

        // Auto-stop at max duration
        if (elapsed >= maxDuration) {
          // Inline stop logic to avoid circular dependency
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
        }
      }, 100);
    } catch (err) {
      if (err instanceof Error) {
        if (
          err.name === "NotAllowedError" ||
          err.name === "PermissionDeniedError"
        ) {
          setPermissionState("denied");
          setError(
            "Microphone access denied. Please enable in browser settings."
          );
        } else if (err.name === "NotFoundError") {
          setError("No microphone found. Please connect a microphone.");
        } else {
          setError(`Failed to start recording: ${err.message}`);
        }
      }
    }
  }, [maxDuration, onRecordingComplete]);

  const stopRecording = useCallback(() => {
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
  }, []);

  const resetRecording = useCallback(() => {
    // Clean up existing recording
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
    setError(null);
    chunksRef.current = [];
  }, [audioUrl]);

  return {
    isRecording,
    duration,
    audioBlob,
    audioUrl,
    error,
    permissionState,
    startRecording,
    stopRecording,
    resetRecording,
    checkPermission,
  };
}

// Helper to get best supported MIME type for recording
function getSupportedMimeType(): string {
  const types = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];

  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }

  // Fallback
  return "audio/webm";
}
