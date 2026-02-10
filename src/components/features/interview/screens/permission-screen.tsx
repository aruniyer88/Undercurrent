'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Mic, Video, VideoOff, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useInterview } from '../interview-context';
import type { PermissionScreenProps } from '@/lib/types/interview';

export function PermissionScreen({ onContinue }: PermissionScreenProps) {
  const { study, setPermissionsGranted, setCameraStream, startSession } = useInterview();
  const [deviceReady, setDeviceReady] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  // Live camera preview
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const isVideo = study.interview_mode === 'video';
  const DeviceIcon = isVideo ? Video : Mic;
  const deviceLabel = isVideo ? 'camera and microphone' : 'microphone';

  // Clean up local ref on unmount (context owns the stream after handleStart)
  useEffect(() => {
    return () => {
      // Only stop if we still own the stream (user left before clicking Start)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const checkDevice = useCallback(async () => {
    setIsChecking(true);
    setError(null);

    const constraints: MediaStreamConstraints = {
      audio: true,
      ...(isVideo && { video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } }),
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // Show live preview for video mode and store in context for later use
      if (isVideo && videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraStream(stream);
      } else {
        // Audio only — stop tracks since we just needed permission
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }

      setDeviceReady(true);
      setPermissionsGranted(true);
    } catch (err) {
      setDeviceReady(false);
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setError(
            isVideo
              ? study.camera_required
                ? 'Camera and microphone access is required for this interview. Please allow access in your browser settings.'
                : 'Microphone access is required. Camera is optional but recommended.'
              : 'Microphone access is required for this interview. Please allow access in your browser settings.'
          );
        } else if (err.name === 'NotFoundError') {
          setError(
            isVideo
              ? 'Camera or microphone not found. Please check your devices.'
              : 'Microphone not found. Please check your device.'
          );
        } else {
          setError('Unable to access your devices. Please check your browser settings.');
        }
      }
    } finally {
      setIsChecking(false);
    }
  }, [isVideo, study.camera_required, setPermissionsGranted, setCameraStream]);

  const handleStart = async () => {
    setIsStarting(true);
    // Detach preview but keep stream alive — context owns it now for video PIP
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    streamRef.current = null;
    await startSession();
    setIsStarting(false);
    onContinue();
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-6 bg-neutral-50">
      <motion.div
        className="max-w-lg w-full text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {/* Camera Preview or Icon */}
        {isVideo && deviceReady ? (
          <div className="w-48 h-36 rounded-2xl overflow-hidden mx-auto mb-6 bg-neutral-900">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover -scale-x-100"
            />
          </div>
        ) : (
          <div
            className={cn(
              'w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6',
              deviceReady ? 'bg-success-100' : 'bg-neutral-100'
            )}
          >
            {deviceReady ? (
              <CheckCircle2 className="w-10 h-10 text-success-600" />
            ) : (
              <DeviceIcon className="w-10 h-10 text-neutral-400" />
            )}
          </div>
        )}

        <h1 className="text-2xl font-bold text-neutral-900 mb-4">
          {deviceReady
            ? `${isVideo ? 'Camera and microphone' : 'Microphone'} ready!`
            : `Check your ${deviceLabel}`}
        </h1>

        <p className="text-neutral-600 mb-8">
          {deviceReady
            ? `Your ${deviceLabel} ${isVideo ? 'are' : 'is'} working. You're all set to begin.`
            : `We need access to your ${deviceLabel} to record your responses.`}
        </p>

        {/* Error State */}
        {error && !deviceReady && (
          <div className="bg-error-50 border border-error-200 rounded-lg p-4 mb-6 text-left">
            <div className="flex items-start gap-2">
              <VideoOff className="w-5 h-5 text-error-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-error-700">{error}</p>
            </div>
          </div>
        )}

        {/* Permission Request Button */}
        {!deviceReady && (
          <Button
            onClick={checkDevice}
            disabled={isChecking}
            variant="outline"
            className="mb-6"
          >
            {isChecking ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <DeviceIcon className="w-4 h-4 mr-2" />
            )}
            {isChecking
              ? 'Checking...'
              : `Allow ${isVideo ? 'Camera & Microphone' : 'Microphone'} Access`}
          </Button>
        )}

        {/* Start Interview Button */}
        <Button
          onClick={handleStart}
          disabled={!deviceReady || isStarting}
          className="w-full h-12 bg-primary-600 hover:bg-primary-700"
        >
          {isStarting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <ArrowRight className="w-4 h-4 mr-2" />
          )}
          {isStarting ? 'Starting...' : 'Start Interview'}
        </Button>
      </motion.div>
    </div>
  );
}
