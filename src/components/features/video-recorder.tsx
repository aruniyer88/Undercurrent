"use client";

import { useEffect, useRef, useState } from "react";
import { useVideoRecorder } from "@/hooks/use-video-recorder";
import type { VideoMetadata } from "@/lib/types/video-recording";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Video,
  VideoOff,
  Mic,
  AlertTriangle,
  Loader2,
  Circle,
} from "lucide-react";
import { cn } from "@/lib/utils";

type RecorderState =
  | "permission-check"
  | "permission-denied"
  | "camera-preview"
  | "countdown"
  | "recording"
  | "uploading";

interface VideoRecorderProps {
  studyId: string;
  participantId: string;
  itemId: string;
  cameraRequired: boolean;
  onRecordingComplete: (metadata: VideoMetadata) => void;
  onCameraLost?: () => void;
  onMaxDurationReached?: () => void;
}

export function VideoRecorder({
  studyId,
  participantId,
  itemId,
  cameraRequired,
  onRecordingComplete,
  onCameraLost,
  onMaxDurationReached,
}: VideoRecorderProps) {
  const [state, setState] = useState<RecorderState>("permission-check");
  const [countdown, setCountdown] = useState(3);
  const [isMobile, setIsMobile] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const {
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
  } = useVideoRecorder({
    cameraRequired,
    itemId,
    studyId,
    participantId,
    onRecordingComplete: async (metadata) => {
      setState("uploading");
      onRecordingComplete(metadata);
    },
    onCameraLost,
    onMaxDurationReached: () => {
      onMaxDurationReached?.();
      handleStopRecording();
    },
  });

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Handle permission check
  useEffect(() => {
    if (state === "permission-check") {
      checkPermissions().then((permissions) => {
        if (permissions.camera && permissions.microphone) {
          setState("camera-preview");
        } else if (cameraRequired) {
          setState("permission-denied");
        } else {
          setState("camera-preview");
        }
      });
    }
  }, [state, checkPermissions, cameraRequired]);

  // Update video element when stream changes
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Handle permission denied
  useEffect(() => {
    if (permissionState === "denied" && cameraRequired) {
      setState("permission-denied");
    }
  }, [permissionState, cameraRequired]);

  const handleStartCountdown = () => {
    setState("countdown");
    setCountdown(3);

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          handleStartRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleStartRecording = async () => {
    setState("recording");
    await startRecording();
    markAnswerStart();
  };

  const handleStopRecording = async () => {
    markAnswerEnd();
    setState("uploading");
    await stopRecording();
  };

  const formatDuration = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const formatMaxDuration = (): string => {
    return "30:00"; // 30 minutes max
  };

  // Permission denied screen
  if (state === "permission-denied") {
    return (
      <Card className={cn("w-full", isMobile ? "h-screen" : "max-w-4xl mx-auto")}>
        <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
          <AlertTriangle className="w-16 h-16 text-destructive" />
          <h3 className="text-xl font-semibold">Camera Access Required</h3>
          <p className="text-center text-muted-foreground max-w-md">
            {cameraRequired
              ? "This interview requires camera access. Please enable camera and microphone permissions in your browser settings to continue."
              : "Camera access was denied. You can continue with voice-only responses, but video will not be recorded."}
          </p>
          {error && (
            <Alert variant="destructive" className="max-w-md">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button onClick={() => window.location.reload()}>
            Retry Permissions
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Permission check screen
  if (state === "permission-check") {
    return (
      <Card className={cn("w-full", isMobile ? "h-screen" : "max-w-4xl mx-auto")}>
        <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
          <Loader2 className="w-16 h-16 animate-spin text-primary" />
          <h3 className="text-xl font-semibold">Checking Permissions</h3>
          <p className="text-center text-muted-foreground max-w-md">
            Requesting access to your camera and microphone...
          </p>
        </CardContent>
      </Card>
    );
  }

  // Uploading screen
  if (state === "uploading") {
    return (
      <Card className={cn("w-full", isMobile ? "h-screen" : "max-w-4xl mx-auto")}>
        <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
          <Loader2 className="w-16 h-16 animate-spin text-primary" />
          <h3 className="text-xl font-semibold">Finalizing Recording</h3>
          <p className="text-center text-muted-foreground max-w-md">
            Uploading your video response... {uploadProgress}%
          </p>
          <div className="w-full max-w-md bg-secondary rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Main recording interface
  return (
    <div className={cn("video-recorder", isMobile && "h-screen")}>
      <div
        className={cn(
          "recorder-container relative",
          isMobile ? "w-full h-full" : "max-w-4xl mx-auto rounded-lg overflow-hidden"
        )}
      >
        {/* Video preview */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={cn(
            "video-preview w-full object-cover bg-black",
            isMobile ? "h-full" : "aspect-video"
          )}
        />

        {/* Countdown overlay */}
        {state === "countdown" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-9xl font-bold text-white animate-pulse">
              {countdown}
            </div>
          </div>
        )}

        {/* Recording controls overlay */}
        {(state === "camera-preview" || state === "recording") && (
          <div className="controls-overlay absolute inset-0 pointer-events-none">
            {/* Top bar - recording indicator and duration */}
            {isRecording && (
              <div className="absolute top-4 left-0 right-0 flex items-center justify-between px-4 pointer-events-auto">
                <div className="flex items-center gap-2 bg-black/70 rounded-full px-4 py-2">
                  <Circle className="w-3 h-3 fill-red-500 text-red-500 animate-pulse" />
                  <span className="text-white text-sm font-medium">REC</span>
                </div>
                <div className="bg-black/70 rounded-full px-4 py-2">
                  <span className="text-white text-sm font-mono">
                    {formatDuration(duration)} / {formatMaxDuration()}
                  </span>
                </div>
              </div>
            )}

            {/* Bottom bar - camera toggle */}
            <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-4 px-4 pointer-events-auto">
              {state === "camera-preview" && (
                <Button
                  onClick={handleStartCountdown}
                  size="lg"
                  className="min-w-[200px]"
                >
                  <Video className="w-5 h-5 mr-2" />
                  Start Recording
                </Button>
              )}

              {isRecording && (
                <Button
                  onClick={toggleCamera}
                  variant={isCameraActive ? "secondary" : "destructive"}
                  size="lg"
                  className="rounded-full w-14 h-14 p-0"
                >
                  {isCameraActive ? (
                    <Video className="w-6 h-6" />
                  ) : (
                    <VideoOff className="w-6 h-6" />
                  )}
                </Button>
              )}
            </div>

            {/* Warning when camera is off */}
            {isRecording && !isCameraActive && !cameraRequired && (
              <div className="absolute top-20 left-0 right-0 px-4 pointer-events-auto">
                <Alert variant="default" className="bg-yellow-500/90 text-white border-yellow-600">
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription>
                    Camera is turned off. Only audio is being recorded.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Permission status (preview mode) */}
            {state === "camera-preview" && (
              <div className="absolute top-4 left-4 right-4 pointer-events-auto">
                <Card className="bg-black/70 border-none">
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center gap-2 text-white">
                      <Video className="w-4 h-4 text-green-400" />
                      <span className="text-sm">Camera ready</span>
                    </div>
                    <div className="flex items-center gap-2 text-white">
                      <Mic className="w-4 h-4 text-green-400" />
                      <span className="text-sm">Microphone ready</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
