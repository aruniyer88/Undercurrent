'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useInterview } from '../interview-context';
import type { ConnectingScreenProps } from '@/lib/types/interview';

const MIN_DISPLAY_MS = 1500;

export function ConnectingScreen({ onReady }: ConnectingScreenProps) {
  const { startSession, resumeInterview, isResuming } = useInterview();
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    const startTime = Date.now();

    const init = async () => {
      if (isResuming) {
        await resumeInterview();
      } else {
        await startSession();
      }

      // Ensure minimum display time
      const elapsed = Date.now() - startTime;
      const remaining = MIN_DISPLAY_MS - elapsed;
      if (remaining > 0) {
        await new Promise((resolve) => setTimeout(resolve, remaining));
      }

      onReady();
    };

    init();
  }, [startSession, resumeInterview, isResuming, onReady]);

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-6 bg-neutral-50">
      <motion.div
        className="text-center"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        {/* Spinner */}
        <motion.div
          className="w-16 h-16 mx-auto mb-6"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 className="w-16 h-16 text-primary-500" />
        </motion.div>

        <h2 className="text-xl font-bold text-neutral-900 mb-2">
          Connecting...
        </h2>
        <p className="text-neutral-500">
          {isResuming
            ? 'Restoring your session'
            : 'Setting up your interview'}
        </p>
      </motion.div>
    </div>
  );
}
