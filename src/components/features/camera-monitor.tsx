"use client";

import { useEffect, useRef } from "react";
import { CAMERA_MONITOR_INTERVAL_MS } from "@/lib/types/video-recording";

interface CameraMonitorProps {
  stream: MediaStream | null;
  onCameraLost: () => void;
  onCameraRestored: () => void;
}

/**
 * Silent monitoring component that tracks camera state
 * Only active when camera is required
 * Renders no UI - purely for monitoring
 */
export function CameraMonitor({
  stream,
  onCameraLost,
  onCameraRestored,
}: CameraMonitorProps) {
  const previousStateRef = useRef<boolean>(true);
  const monitorRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!stream) return;

    // Start monitoring camera state
    monitorRef.current = setInterval(() => {
      const videoTrack = stream.getVideoTracks()[0];
      const isActive = videoTrack?.enabled && videoTrack?.readyState === "live";

      // Detect state changes
      if (previousStateRef.current && !isActive) {
        // Camera was active, now lost
        onCameraLost();
      } else if (!previousStateRef.current && isActive) {
        // Camera was lost, now restored
        onCameraRestored();
      }

      previousStateRef.current = isActive;
    }, CAMERA_MONITOR_INTERVAL_MS);

    // Cleanup on unmount
    return () => {
      if (monitorRef.current) {
        clearInterval(monitorRef.current);
        monitorRef.current = null;
      }
    };
  }, [stream, onCameraLost, onCameraRestored]);

  // Listen for track ended event (permission revoked)
  useEffect(() => {
    if (!stream) return;

    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) return;

    const handleEnded = () => {
      onCameraLost();
    };

    videoTrack.addEventListener("ended", handleEnded);

    return () => {
      videoTrack.removeEventListener("ended", handleEnded);
    };
  }, [stream, onCameraLost]);

  // This component renders nothing - it's purely for side effects
  return null;
}
