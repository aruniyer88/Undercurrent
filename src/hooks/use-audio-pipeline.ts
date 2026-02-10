'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import type { AudioPipelineState, AudioPipelineControls } from '@/lib/types/interview';

/**
 * Orchestrates TTS playback, audio recording, and transcription.
 * Provides AnalyserNodes for orb visualization.
 */
export function useAudioPipeline(): AudioPipelineControls {
  const [state, setState] = useState<AudioPipelineState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [ttsAnalyser, setTtsAnalyser] = useState<AnalyserNode | null>(null);
  const [micAnalyser, setMicAnalyser] = useState<AnalyserNode | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const ttsAbortRef = useRef<AbortController | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const getAudioContext = useCallback((): AudioContext => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = new AudioContext();
    }
    // Resume if suspended (Safari requirement)
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  // ============================
  // TTS PLAYBACK
  // ============================

  const speak = useCallback(
    async (text: string, voiceId: string, sessionId?: string): Promise<void> => {
      // Abort any in-flight TTS fetch
      ttsAbortRef.current?.abort();

      // Stop any currently playing source
      if (currentSourceRef.current) {
        try { currentSourceRef.current.stop(); } catch { /* already stopped */ }
        currentSourceRef.current = null;
      }
      setTtsAnalyser(null);

      const controller = new AbortController();
      ttsAbortRef.current = controller;

      setError(null);
      setState('synthesizing');

      try {
        const response = await fetch('/api/elevenlabs/synthesize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, voice_id: voiceId, session_id: sessionId }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`TTS failed: ${response.status}`);
        }

        const audioData = await response.arrayBuffer();

        // If aborted while decoding, bail
        if (controller.signal.aborted) return;

        const ctx = getAudioContext();
        const audioBuffer = await ctx.decodeAudioData(audioData);

        if (controller.signal.aborted) return;

        // Set up audio graph: source → analyser → destination
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;

        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(analyser);
        analyser.connect(ctx.destination);

        currentSourceRef.current = source;
        setTtsAnalyser(analyser);
        setState('playing');

        // Play and wait for completion
        return new Promise<void>((resolve) => {
          source.onended = () => {
            currentSourceRef.current = null;
            setTtsAnalyser(null);
            setState('idle');
            resolve();
          };
          source.start(0);
        });
      } catch (err) {
        // Aborted fetches are not errors
        if (err instanceof DOMException && err.name === 'AbortError') return;
        console.error('TTS error:', err);
        setError(err instanceof Error ? err.message : 'TTS failed');
        setState('error');
      }
    },
    [getAudioContext]
  );

  const stopSpeaking = useCallback(() => {
    // Abort any in-flight TTS fetch
    ttsAbortRef.current?.abort();
    ttsAbortRef.current = null;

    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.stop();
      } catch {
        // May already be stopped
      }
      currentSourceRef.current = null;
    }
    setTtsAnalyser(null);
    setState('idle');
  }, []);

  // ============================
  // RECORDING
  // ============================

  const startRecording = useCallback(async (): Promise<void> => {
    setError(null);
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      mediaStreamRef.current = stream;

      // Create mic analyser
      const ctx = getAudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.7;
      const micSource = ctx.createMediaStreamSource(stream);
      micSource.connect(analyser);
      setMicAnalyser(analyser);

      // Determine MIME type
      const mimeType = getSupportedMimeType();
      const recorder = new MediaRecorder(stream, { mimeType });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current = recorder;
      recorder.start(100);
      setState('recording');
    } catch (err) {
      console.error('Recording error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start recording');
      setState('error');
    }
  }, [getAudioContext]);

  const stopRecording = useCallback(async (sessionId?: string): Promise<string | null> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === 'inactive') {
        resolve(null);
        return;
      }

      recorder.onstop = async () => {
        // Clean up mic stream
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((t) => t.stop());
          mediaStreamRef.current = null;
        }
        setMicAnalyser(null);

        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        });

        if (blob.size === 0) {
          setState('idle');
          resolve(null);
          return;
        }

        // Transcribe
        setState('transcribing');
        try {
          const formData = new FormData();
          formData.append('audio', blob, 'recording.webm');
          if (sessionId) formData.append('session_id', sessionId);

          const res = await fetch('/api/openai/transcribe', {
            method: 'POST',
            body: formData,
          });

          if (!res.ok) throw new Error(`Transcription failed: ${res.status}`);
          const { text } = await res.json();
          setState('idle');
          resolve(text || null);
        } catch (err) {
          console.error('Transcription error:', err);
          setError('Failed to transcribe audio');
          setState('error');
          resolve(null);
        }
      };

      recorder.stop();
    });
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [stopSpeaking]);

  return {
    state,
    speak,
    stopSpeaking,
    startRecording,
    stopRecording,
    ttsAnalyser,
    micAnalyser,
    error,
  };
}

function getSupportedMimeType(): string {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
  ];
  for (const type of types) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return 'audio/webm';
}
