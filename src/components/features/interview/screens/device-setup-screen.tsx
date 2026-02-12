'use client';

import { useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Mic, Video, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useInterview } from '../interview-context';
import { useMediaDevices } from '@/hooks/use-media-devices';
import type { DeviceSetupScreenProps } from '@/lib/types/interview';

export function DeviceSetupScreen({ onContinue }: DeviceSetupScreenProps) {
  const { study, setPermissionsGranted, setCameraStream } = useInterview();
  const devices = useMediaDevices();
  const videoRef = useRef<HTMLVideoElement>(null);

  const isVideo = study.interview_mode === 'video';

  // Request permissions on mount
  useEffect(() => {
    devices.requestPermissions({ audio: true, video: isVideo });
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Attach stream to video preview
  useEffect(() => {
    if (videoRef.current && devices.stream && isVideo) {
      videoRef.current.srcObject = devices.stream;
    }
  }, [devices.stream, isVideo]);

  const handleStart = useCallback(() => {
    if (isVideo && devices.stream) {
      // Prevent useMediaDevices from cleaning up the stream on unmount
      devices.preventCleanup();
      // Transfer stream ownership to context
      setCameraStream(devices.stream);
    }
    setPermissionsGranted(true);
    onContinue();
  }, [isVideo, devices, setCameraStream, setPermissionsGranted, onContinue]);

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-6 bg-neutral-50">
      <motion.div
        className="max-w-2xl w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {isVideo ? (
          <VideoSetupLayout
            videoRef={videoRef}
            devices={devices}
            onStart={handleStart}
          />
        ) : (
          <VoiceSetupLayout
            devices={devices}
            onStart={handleStart}
          />
        )}
      </motion.div>
    </div>
  );
}

// ============================================
// VIDEO INTERVIEW MODE — Camera preview + controls
// ============================================

function VideoSetupLayout({
  videoRef,
  devices,
  onStart,
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  devices: ReturnType<typeof import('@/hooks/use-media-devices').useMediaDevices>;
  onStart: () => void;
}) {
  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Camera Preview */}
      <div className="md:w-1/2">
        <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-neutral-900 relative">
          {devices.permissionsGranted ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover -scale-x-100"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Video className="w-12 h-12 text-neutral-600" />
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="md:w-1/2 flex flex-col justify-center space-y-4">
        <h2 className="text-xl font-bold text-neutral-900">
          Set up your devices
        </h2>

        {/* Error */}
        {devices.error && (
          <div className="bg-error-50 border border-error-200 rounded-lg p-3">
            <p className="text-sm text-error-700">{devices.error}</p>
          </div>
        )}

        {/* Camera Dropdown */}
        {devices.videoInputs.length > 0 && (
          <div className="space-y-1">
            <Label className="text-sm text-neutral-600">Camera</Label>
            <select
              value={devices.selectedVideoInput}
              onChange={(e) => devices.setSelectedVideoInput(e.target.value)}
              className="w-full h-9 rounded-lg border border-neutral-200 bg-white pl-3 pr-10 text-sm appearance-none cursor-pointer"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: 'right 0.75rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.5em 1.5em',
              }}
            >
              {devices.videoInputs.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Microphone Dropdown */}
        {devices.audioInputs.length > 0 && (
          <div className="space-y-1">
            <Label className="text-sm text-neutral-600">Microphone</Label>
            <select
              value={devices.selectedAudioInput}
              onChange={(e) => devices.setSelectedAudioInput(e.target.value)}
              className="w-full h-9 rounded-lg border border-neutral-200 bg-white pl-3 pr-10 text-sm appearance-none cursor-pointer"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: 'right 0.75rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.5em 1.5em',
              }}
            >
              {devices.audioInputs.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Status */}
        {!devices.permissionsGranted && (
          <p className="text-sm text-neutral-500">
            Waiting for camera and microphone...
          </p>
        )}

        {/* Start Button */}
        <Button
          onClick={onStart}
          disabled={!devices.permissionsGranted}
          className="w-full h-12 bg-primary-600 hover:bg-primary-700"
        >
          <ArrowRight className="w-4 h-4 mr-2" />
          Start Interview
        </Button>
      </div>
    </div>
  );
}

// ============================================
// VOICE-ONLY MODE — Mic visualization + controls
// ============================================

function VoiceSetupLayout({
  devices,
  onStart,
}: {
  devices: ReturnType<typeof import('@/hooks/use-media-devices').useMediaDevices>;
  onStart: () => void;
}) {
  return (
    <div className="max-w-md mx-auto text-center space-y-6">
      <h2 className="text-xl font-bold text-neutral-900">
        Check your microphone
      </h2>

      {/* Mic Visualization */}
      <div className="flex justify-center">
        <div className="relative w-32 h-32">
          {/* Audio level ring */}
          <motion.div
            className={cn(
              'absolute inset-0 rounded-full border-4 transition-colors',
              devices.permissionsGranted
                ? 'border-primary-400'
                : 'border-neutral-200'
            )}
            animate={
              devices.permissionsGranted
                ? { scale: 1 + devices.audioLevel * 0.3 }
                : {}
            }
            transition={{ duration: 0.1, ease: 'linear' }}
          />
          {/* Center mic icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            {devices.permissionsGranted ? (
              <Mic className="w-16 h-16 text-primary-500" />
            ) : (
              <Mic className="w-16 h-16 text-neutral-400" />
            )}
          </div>
        </div>
      </div>

      {/* Error */}
      {devices.error && (
        <div className="bg-error-50 border border-error-200 rounded-lg p-3 text-left">
          <p className="text-sm text-error-700">{devices.error}</p>
        </div>
      )}

      {/* Status */}
      {devices.permissionsGranted ? (
        <div className="flex items-center justify-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-success-600" />
          <p className="text-sm font-medium text-success-700">
            Your microphone is working!
          </p>
        </div>
      ) : (
        <p className="text-sm text-neutral-500">
          Waiting for microphone...
        </p>
      )}

      {/* Microphone Dropdown */}
      {devices.audioInputs.length > 0 && (
        <div className="space-y-1 text-left">
          <Label className="text-sm text-neutral-600">Microphone</Label>
          <select
            value={devices.selectedAudioInput}
            onChange={(e) => devices.setSelectedAudioInput(e.target.value)}
            className="w-full h-9 rounded-lg border border-neutral-200 bg-white pl-3 pr-10 text-sm appearance-none cursor-pointer"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: 'right 0.75rem center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '1.5em 1.5em',
            }}
          >
            {devices.audioInputs.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Start Button */}
      <Button
        onClick={onStart}
        disabled={!devices.permissionsGranted}
        className="w-full h-12 bg-primary-600 hover:bg-primary-700"
      >
        <ArrowRight className="w-4 h-4 mr-2" />
        Start Interview
      </Button>
    </div>
  );
}
