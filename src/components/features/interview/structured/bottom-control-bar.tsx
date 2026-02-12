'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Settings, PauseCircle } from 'lucide-react';
import { MicButton } from './mic-button';
import { SettingsModal } from './settings-modal';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import type { MicButtonState, AudioPipelineControls } from '@/lib/types/interview';
import type { UseMediaDevicesReturn } from '@/hooks/use-media-devices';

interface BottomControlBarProps {
  micState: MicButtonState;
  onMicClick: () => void;
  onPause: () => void;
  progress: number;
  audio: AudioPipelineControls;
  devices?: UseMediaDevicesReturn;
  showCamera: boolean;
}

export function BottomControlBar({
  micState,
  onMicClick,
  onPause,
  progress,
  devices,
  showCamera,
}: BottomControlBarProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Spacebar shortcut for recording toggle
  const handleSpacebar = useCallback(() => {
    if (micState === 'ready' || micState === 'recording' || micState === 'ai-speaking') {
      onMicClick();
    }
  }, [micState, onMicClick]);

  useKeyboardShortcuts({ onSpacebar: handleSpacebar });

  return (
    <>
      {/* Control Bar */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 z-30"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        {/* Bar content */}
        <div className="bg-neutral-900/90 backdrop-blur-lg border-t border-white/10">
          <div className="flex items-center justify-between px-4 py-3 max-w-4xl mx-auto">
            {/* Left: Settings */}
            <button
              onClick={() => setSettingsOpen(true)}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* Center: Mic Button */}
            <MicButton state={micState} onClick={onMicClick} />

            {/* Right: Pause */}
            <button
              onClick={onPause}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Pause interview"
            >
              <PauseCircle className="w-5 h-5" />
            </button>
          </div>

          {/* Progress line */}
          <div className="h-0.5 bg-white/10">
            <motion.div
              className="h-full bg-primary-500"
              animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>
      </motion.div>

      {/* Settings Modal */}
      {devices && (
        <SettingsModal
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          devices={devices}
          showCamera={showCamera}
        />
      )}
    </>
  );
}
