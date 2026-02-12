'use client';

import { X, Mic, Video } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { UseMediaDevicesReturn } from '@/hooks/use-media-devices';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  devices: UseMediaDevicesReturn;
  showCamera: boolean;
}

export function SettingsModal({ isOpen, onClose, devices, showCamera }: SettingsModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl p-6 max-w-md mx-auto md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-neutral-900">
                Interview Settings
              </h3>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="space-y-4">
              {/* Camera Dropdown */}
              {showCamera && devices.videoInputs.length > 0 && (
                <div className="space-y-1">
                  <Label className="text-sm text-neutral-600 flex items-center gap-2">
                    <Video className="w-4 h-4" />
                    Camera
                  </Label>
                  <select
                    value={devices.selectedVideoInput}
                    onChange={(e) => devices.setSelectedVideoInput(e.target.value)}
                    className="w-full h-10 rounded-lg border border-neutral-200 bg-white px-3 text-sm"
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
                  <Label className="text-sm text-neutral-600 flex items-center gap-2">
                    <Mic className="w-4 h-4" />
                    Microphone
                  </Label>
                  <select
                    value={devices.selectedAudioInput}
                    onChange={(e) => devices.setSelectedAudioInput(e.target.value)}
                    className="w-full h-10 rounded-lg border border-neutral-200 bg-white px-3 text-sm"
                  >
                    {devices.audioInputs.map((d) => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
