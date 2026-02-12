'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export interface MediaDeviceInfo {
  deviceId: string;
  label: string;
  kind: 'audioinput' | 'videoinput' | 'audiooutput';
}

export interface UseMediaDevicesReturn {
  /** All detected audio input devices */
  audioInputs: MediaDeviceInfo[];
  /** All detected video input devices */
  videoInputs: MediaDeviceInfo[];
  /** Currently selected audio input device ID */
  selectedAudioInput: string;
  /** Currently selected video input device ID */
  selectedVideoInput: string;
  /** Set the selected audio input */
  setSelectedAudioInput: (deviceId: string) => void;
  /** Set the selected video input */
  setSelectedVideoInput: (deviceId: string) => void;
  /** Active media stream from getUserMedia */
  stream: MediaStream | null;
  /** Request permissions and enumerate devices */
  requestPermissions: (opts: { audio: boolean; video: boolean }) => Promise<boolean>;
  /** Whether permissions have been granted */
  permissionsGranted: boolean;
  /** Error message if any */
  error: string | null;
  /** Audio level 0-1 (for mic visualization) */
  audioLevel: number;
  /** Stop all tracks and clean up */
  cleanup: () => void;
  /** Prevent automatic cleanup on unmount (for stream ownership transfer) */
  preventCleanup: () => void;
}

export function useMediaDevices(): UseMediaDevicesReturn {
  const [audioInputs, setAudioInputs] = useState<MediaDeviceInfo[]>([]);
  const [videoInputs, setVideoInputs] = useState<MediaDeviceInfo[]>([]);
  const [selectedAudioInput, setSelectedAudioInput] = useState('');
  const [selectedVideoInput, setSelectedVideoInput] = useState('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);
  const needsVideoRef = useRef(false);
  const shouldCleanupRef = useRef(true);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    cancelAnimationFrame(animFrameRef.current);
    setAudioLevel(0);
  }, []);

  const startAudioLevelMonitor = useCallback((mediaStream: MediaStream) => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = new AudioContext();
    }
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;
    const source = ctx.createMediaStreamSource(mediaStream);
    source.connect(analyser);
    analyserRef.current = analyser;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
      const avg = sum / dataArray.length / 255;
      setAudioLevel(avg);
      animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);
  }, []);

  const acquireStream = useCallback(async (
    audioDeviceId: string,
    videoDeviceId: string,
    needsVideo: boolean
  ) => {
    stopStream();
    setError(null);

    const constraints: MediaStreamConstraints = {
      audio: audioDeviceId
        ? { deviceId: { exact: audioDeviceId } }
        : true,
    };
    if (needsVideo) {
      constraints.video = videoDeviceId
        ? { deviceId: { exact: videoDeviceId }, facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
        : { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } };
    }

    try {
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = newStream;
      setStream(newStream);
      startAudioLevelMonitor(newStream);
      return true;
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setError('Permission denied. Please allow access in your browser settings.');
        } else if (err.name === 'NotFoundError') {
          setError('Device not found. Please check your connections.');
        } else {
          setError('Unable to access devices. Please check your browser settings.');
        }
      }
      return false;
    }
  }, [stopStream, startAudioLevelMonitor]);

  const enumerateDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audio = devices
        .filter((d) => d.kind === 'audioinput' && d.deviceId)
        .map((d) => ({
          deviceId: d.deviceId,
          label: d.label || `Microphone ${d.deviceId.slice(0, 4)}`,
          kind: d.kind as 'audioinput',
        }));
      const video = devices
        .filter((d) => d.kind === 'videoinput' && d.deviceId)
        .map((d) => ({
          deviceId: d.deviceId,
          label: d.label || `Camera ${d.deviceId.slice(0, 4)}`,
          kind: d.kind as 'videoinput',
        }));

      setAudioInputs(audio);
      setVideoInputs(video);

      return { audio, video };
    } catch {
      return { audio: [], video: [] };
    }
  }, []);

  const requestPermissions = useCallback(async (opts: { audio: boolean; video: boolean }): Promise<boolean> => {
    needsVideoRef.current = opts.video;
    setError(null);

    const ok = await acquireStream('', '', opts.video);
    if (!ok) return false;

    // After granting permissions, enumerate to get labels
    const { audio, video } = await enumerateDevices();

    // Auto-select first device
    if (audio.length > 0) setSelectedAudioInput(audio[0].deviceId);
    if (video.length > 0 && opts.video) setSelectedVideoInput(video[0].deviceId);

    setPermissionsGranted(true);
    return true;
  }, [acquireStream, enumerateDevices]);

  // When selected device changes, re-acquire the stream
  const handleAudioInputChange = useCallback((deviceId: string) => {
    setSelectedAudioInput(deviceId);
    if (permissionsGranted) {
      acquireStream(deviceId, selectedVideoInput, needsVideoRef.current);
    }
  }, [permissionsGranted, selectedVideoInput, acquireStream]);

  const handleVideoInputChange = useCallback((deviceId: string) => {
    setSelectedVideoInput(deviceId);
    if (permissionsGranted) {
      acquireStream(selectedAudioInput, deviceId, needsVideoRef.current);
    }
  }, [permissionsGranted, selectedAudioInput, acquireStream]);

  const cleanup = useCallback(() => {
    stopStream();
    cancelAnimationFrame(animFrameRef.current);
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
    }
  }, [stopStream]);

  const preventCleanup = useCallback(() => {
    shouldCleanupRef.current = false;
  }, []);

  // Clean up on unmount (unless cleanup was prevented via preventCleanup)
  useEffect(() => {
    return () => {
      if (!shouldCleanupRef.current) {
        // Stream ownership transferred — don't stop tracks
        cancelAnimationFrame(animFrameRef.current);
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close().catch(() => {});
        }
        return;
      }

      // Normal cleanup path
      stopStream();
      cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [stopStream]);

  return {
    audioInputs,
    videoInputs,
    selectedAudioInput,
    selectedVideoInput,
    setSelectedAudioInput: handleAudioInputChange,
    setSelectedVideoInput: handleVideoInputChange,
    stream,
    requestPermissions,
    permissionsGranted,
    error,
    audioLevel,
    cleanup,
    preventCleanup,
  };
}
