"use client";

import { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Volume2 } from "lucide-react";
import { formatDuration } from "@/lib/utils/format";

export interface WaveformPlayerHandle {
  seekTo: (seconds: number) => void;
}

interface ResponseDetailPlayerProps {
  recordingUrl: string | null;
}

export const ResponseDetailPlayer = forwardRef<
  WaveformPlayerHandle,
  ResponseDetailPlayerProps
>(function ResponseDetailPlayer({ recordingUrl }, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<unknown>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isReady, setIsReady] = useState(false);

  useImperativeHandle(ref, () => ({
    seekTo: (seconds: number) => {
      const ws = wavesurferRef.current as { seekTo?: (ratio: number) => void; getDuration?: () => number } | null;
      if (ws?.seekTo && ws?.getDuration) {
        const dur = ws.getDuration();
        if (dur > 0) {
          ws.seekTo(seconds / dur);
        }
      }
    },
  }));

  useEffect(() => {
    if (!recordingUrl || !containerRef.current) return;

    let ws: {
      destroy: () => void;
      on: (event: string, cb: (...args: unknown[]) => void) => void;
      getCurrentTime: () => number;
      getDuration: () => number;
      playPause: () => void;
      seekTo: (ratio: number) => void;
    } | null = null;

    const initWaveSurfer = async () => {
      const WaveSurfer = (await import("wavesurfer.js")).default;
      if (!containerRef.current) return;

      ws = WaveSurfer.create({
        container: containerRef.current,
        waveColor: "#d1d5db",
        progressColor: "#6366f1",
        cursorColor: "#6366f1",
        barWidth: 2,
        barGap: 1,
        barRadius: 2,
        height: 64,
        normalize: true,
      }) as typeof ws;

      ws!.on("ready", () => {
        setIsReady(true);
        setDuration(ws!.getDuration());
      });

      ws!.on("audioprocess", () => {
        setCurrentTime(ws!.getCurrentTime());
      });

      ws!.on("play", () => setIsPlaying(true));
      ws!.on("pause", () => setIsPlaying(false));
      ws!.on("finish", () => setIsPlaying(false));

      ws!.on("error", (err: unknown) => {
        console.error("WaveSurfer error:", err);
      });

      (ws as unknown as { load: (url: string) => void }).load(recordingUrl);
      wavesurferRef.current = ws;
    };

    initWaveSurfer();

    return () => {
      ws?.destroy();
      wavesurferRef.current = null;
      setIsReady(false);
      setIsPlaying(false);
    };
  }, [recordingUrl]);

  const togglePlay = useCallback(() => {
    const ws = wavesurferRef.current as { playPause?: () => void } | null;
    ws?.playPause?.();
  }, []);

  if (!recordingUrl) {
    return (
      <div className="bg-surface rounded-lg border border-border-subtle p-6 flex items-center justify-center text-sm text-text-muted">
        <Volume2 className="w-4 h-4 mr-2" />
        No recording available
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-lg border border-border-subtle p-4">
      <div className="flex items-center gap-3">
        <Button
          size="sm"
          variant="outline"
          onClick={togglePlay}
          disabled={!isReady}
          className="h-8 w-8 p-0 flex-shrink-0"
        >
          {isPlaying ? (
            <Pause className="w-3.5 h-3.5" />
          ) : (
            <Play className="w-3.5 h-3.5" />
          )}
        </Button>
        <div ref={containerRef} className="flex-1 min-w-0" />
        <span className="text-xs text-text-muted flex-shrink-0 tabular-nums">
          {formatDuration(currentTime)} / {formatDuration(duration)}
        </span>
      </div>
    </div>
  );
});
