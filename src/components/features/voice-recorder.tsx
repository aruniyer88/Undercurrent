"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Mic,
  MicOff,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useVoiceRecorder } from "@/hooks/use-voice-recorder";
import {
  RecordingLanguage,
  RECORDING_PARAGRAPHS,
  LANGUAGE_LABELS,
} from "@/lib/elevenlabs/types";

type RecorderState =
  | "language-select"
  | "permission"
  | "ready"
  | "countdown"
  | "recording"
  | "preview";

interface VoiceRecorderProps {
  onRecordingComplete: (blob: Blob, language: RecordingLanguage) => void;
  onCancel: () => void;
}

export function VoiceRecorder({
  onRecordingComplete,
  onCancel,
}: VoiceRecorderProps) {
  const [state, setState] = useState<RecorderState>("language-select");
  const [language, setLanguage] = useState<RecordingLanguage>("english");
  const [countdown, setCountdown] = useState(5);
  const [isPlaying, setIsPlaying] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const {
    isRecording,
    duration,
    audioBlob,
    audioUrl,
    error,
    permissionState,
    startRecording,
    resetRecording,
    checkPermission,
  } = useVoiceRecorder({
    maxDuration: 30000, // Fixed 30 seconds
  });

  // Handle countdown and auto-start recording
  useEffect(() => {
    if (state === "countdown" && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (state === "countdown" && countdown === 0) {
      setState("recording");
      startRecording();
    }
  }, [state, countdown, startRecording]);

  // Handle recording completion
  useEffect(() => {
    if (!isRecording && audioBlob && state === "recording") {
      setState("preview");
    }
  }, [isRecording, audioBlob, state]);

  // Handle audio playback
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.onended = () => setIsPlaying(false);
    }
  }, [audioUrl]);

  const handleLanguageSelect = useCallback(async () => {
    const hasPermission = await checkPermission();
    if (hasPermission) {
      setState("ready");
    } else {
      setState("permission");
    }
  }, [checkPermission]);

  const handleRequestPermission = useCallback(async () => {
    const hasPermission = await checkPermission();
    if (hasPermission) {
      setState("ready");
    }
  }, [checkPermission]);

  const handleStartCountdown = useCallback(() => {
    setCountdown(5);
    setState("countdown");
  }, []);

  const handleReRecord = useCallback(() => {
    resetRecording();
    setState("ready");
  }, [resetRecording]);

  const handleUseRecording = useCallback(() => {
    if (audioBlob) {
      onRecordingComplete(audioBlob, language);
    }
  }, [audioBlob, language, onRecordingComplete]);

  const togglePlayback = useCallback(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  }, [isPlaying]);

  // Calculate remaining time
  const remainingSeconds = Math.max(0, Math.ceil((30000 - duration) / 1000));

  return (
    <div className="space-y-6">
      {/* Language Selection */}
      {state === "language-select" && (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
              <Mic className="w-8 h-8 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900">
              Record Your Voice
            </h3>
            <p className="text-sm text-neutral-500 mt-2">
              We&apos;ll show you a paragraph to read aloud for 30 seconds
            </p>
          </div>

          <div className="space-y-2">
            <Label>What language do you want to communicate with users in?</Label>
            <Select
              value={language}
              onValueChange={(value) => setLanguage(value as RecordingLanguage)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(LANGUAGE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleLanguageSelect}
              className="flex-1 bg-primary-600 hover:bg-primary-700"
            >
              Continue
            </Button>
          </div>
        </div>
      )}

      {/* Permission Request */}
      {state === "permission" && (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <MicOff className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900">
              Microphone Access Required
            </h3>
            <p className="text-sm text-neutral-500 mt-2">
              {error ||
                "Please allow microphone access to record your voice."}
            </p>
          </div>

          {permissionState === "denied" && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">How to enable microphone:</p>
                  <ol className="list-decimal ml-4 mt-1 space-y-1">
                    <li>Click the lock/site info icon in your browser address bar</li>
                    <li>Find &quot;Microphone&quot; and change it to &quot;Allow&quot;</li>
                    <li>Refresh this page and try again</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleRequestPermission}
              className="flex-1 bg-primary-600 hover:bg-primary-700"
              disabled={permissionState === "checking"}
            >
              {permissionState === "checking" ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                "Try Again"
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Ready to Record */}
      {state === "ready" && (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Mic className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900">
              Ready to Record
            </h3>
            <p className="text-sm text-neutral-500 mt-2">
              Click start to begin. You&apos;ll have 30 seconds to read the paragraph.
            </p>
          </div>

          {/* Preview of paragraph */}
          <div className="bg-neutral-50 rounded-lg p-4 max-h-32 overflow-y-auto">
            <p className="text-sm text-neutral-600 italic">
              &quot;{RECORDING_PARAGRAPHS[language].slice(0, 150)}...&quot;
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleStartCountdown}
              className="flex-1 bg-primary-600 hover:bg-primary-700"
            >
              <Mic className="w-4 h-4 mr-2" />
              Start Recording
            </Button>
          </div>
        </div>
      )}

      {/* Countdown */}
      {state === "countdown" && (
        <div className="space-y-6">
          <div className="text-center py-8">
            <div className="text-7xl font-bold text-primary-600 mb-4">
              {countdown}
            </div>
            <p className="text-lg text-neutral-600">
              Recording starts in...
            </p>
          </div>
        </div>
      )}

      {/* Recording */}
      {state === "recording" && (
        <div className="space-y-6">
          {/* Timer and status */}
          <div className="text-center">
            <div className="relative w-20 h-20 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full bg-red-100 animate-pulse" />
              <div className="absolute inset-2 rounded-full bg-red-500 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">
                  {remainingSeconds}
                </span>
              </div>
            </div>
            <p className="text-sm text-red-600 font-medium">
              Recording... {remainingSeconds}s remaining
            </p>
          </div>

          {/* Paragraph to read */}
          <div className="bg-neutral-50 rounded-lg p-6 border-2 border-primary-200">
            <p className="text-neutral-800 leading-relaxed">
              {RECORDING_PARAGRAPHS[language]}
            </p>
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-600 transition-all duration-100"
              style={{ width: `${(duration / 30000) * 100}%` }}
            />
          </div>

          <p className="text-xs text-center text-neutral-500">
            Recording will stop automatically at 30 seconds
          </p>
        </div>
      )}

      {/* Preview */}
      {state === "preview" && audioUrl && (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900">
              Recording Complete
            </h3>
            <p className="text-sm text-neutral-500 mt-2">
              Listen to your recording and decide if you&apos;d like to use it
            </p>
          </div>

          {/* Audio player */}
          <div className="bg-neutral-50 rounded-lg p-4">
            <audio ref={audioRef} src={audioUrl} className="hidden" />
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={togglePlayback}
                className="h-12 w-12 rounded-full"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
              </Button>
              <div className="flex-1">
                <p className="font-medium text-neutral-900">Your Recording</p>
                <p className="text-sm text-neutral-500">
                  {Math.ceil(duration / 1000)} seconds
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={handleReRecord} className="flex-1">
              <RotateCcw className="w-4 h-4 mr-2" />
              Re-record
            </Button>
            <Button
              onClick={handleUseRecording}
              className="flex-1 bg-primary-600 hover:bg-primary-700"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Use This Recording
            </Button>
          </div>
        </div>
      )}

      {/* Error display */}
      {error && state !== "permission" && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
