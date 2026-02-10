'use client';

import { useRef, useCallback, useEffect } from 'react';

interface UseAudioAnalyserReturn {
  /** Connect an AudioNode or MediaStream to the analyser */
  connect: (source: AudioNode | MediaStream) => AnalyserNode | null;
  /** Disconnect and clean up */
  disconnect: () => void;
  /** Get the current AnalyserNode (null if not connected) */
  analyserNode: AnalyserNode | null;
  /** Get the AudioContext */
  audioContext: AudioContext | null;
}

/**
 * Wraps Web Audio AnalyserNode for real-time audio visualization.
 * Used by the ambient orb to react to TTS playback and mic input.
 */
export function useAudioAnalyser(): UseAudioAnalyserReturn {
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<AudioNode | null>(null);

  const getOrCreateContext = useCallback((): AudioContext => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = new AudioContext();
    }
    return audioContextRef.current;
  }, []);

  const connect = useCallback(
    (source: AudioNode | MediaStream): AnalyserNode | null => {
      try {
        const ctx = getOrCreateContext();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;

        let sourceNode: AudioNode;
        if (source instanceof MediaStream) {
          sourceNode = ctx.createMediaStreamSource(source);
        } else {
          sourceNode = source;
        }

        sourceNode.connect(analyser);
        // Don't connect analyser to destination for mic input — prevents feedback
        // For TTS playback, the caller should connect to destination separately

        sourceRef.current = sourceNode;
        analyserRef.current = analyser;

        return analyser;
      } catch (err) {
        console.error('Failed to create audio analyser:', err);
        return null;
      }
    },
    [getOrCreateContext]
  );

  const disconnect = useCallback(() => {
    try {
      if (sourceRef.current) {
        sourceRef.current.disconnect();
        sourceRef.current = null;
      }
      if (analyserRef.current) {
        analyserRef.current.disconnect();
        analyserRef.current = null;
      }
    } catch {
      // Ignore disconnect errors
    }
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      disconnect();
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [disconnect]);

  return {
    connect,
    disconnect,
    analyserNode: analyserRef.current,
    audioContext: audioContextRef.current,
  };
}
