'use client';

import { motion } from 'framer-motion';
import { Mic, Square, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MicButtonState } from '@/lib/types/interview';

interface MicButtonProps {
  state: MicButtonState;
  onClick: () => void;
  disabled?: boolean;
}

const stateConfig: Record<MicButtonState, {
  icon: React.ReactNode;
  bg: string;
  label: string;
}> = {
  ready: {
    icon: <Mic className="w-7 h-7 text-white" />,
    bg: 'bg-primary-600 hover:bg-primary-700',
    label: 'Click once to start recording',
  },
  recording: {
    icon: <Square className="w-6 h-6 text-white" />,
    bg: 'bg-red-500',
    label: 'Recording... click to submit',
  },
  processing: {
    icon: <Loader2 className="w-7 h-7 text-white animate-spin" />,
    bg: 'bg-neutral-500',
    label: 'Responding...',
  },
  'ai-speaking': {
    icon: <Mic className="w-7 h-7 text-white/60" />,
    bg: 'bg-neutral-700 hover:bg-neutral-600',
    label: 'Click to interrupt',
  },
};

export function MicButton({ state, onClick, disabled }: MicButtonProps) {
  const config = stateConfig[state];

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Label — permanently visible above button */}
      <motion.p
        key={state}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-xs text-white/80 font-medium whitespace-nowrap"
      >
        {config.label}
      </motion.p>

      {/* Button */}
      <div className="relative">
        {/* Pulsating glow for ready state */}
        {state === 'ready' && (
          <motion.div
            className="absolute inset-0 rounded-full bg-primary-500/30"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.4, 0, 0.4],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}

        {/* Recording pulse ring */}
        {state === 'recording' && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-red-400"
            animate={{
              scale: [1, 1.4],
              opacity: [0.6, 0],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />
        )}

        {/* AI speaking subtle pulse */}
        {state === 'ai-speaking' && (
          <motion.div
            className="absolute inset-0 rounded-full bg-neutral-500/20"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        <button
          onClick={onClick}
          disabled={disabled || state === 'processing'}
          className={cn(
            'relative z-10 rounded-full flex items-center justify-center transition-all shadow-lg',
            'w-14 h-14 md:w-14 md:h-14',
            config.bg,
            (disabled || state === 'processing') && 'opacity-60 cursor-not-allowed'
          )}
        >
          {config.icon}
        </button>
      </div>
    </div>
  );
}
