'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { PauseCircle, Play, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useInterview } from '../interview-context';
import type { PauseScreenProps } from '@/lib/types/interview';

export function PauseScreen({ onResume }: PauseScreenProps) {
  const { token, sessionId, resumeInterview, setCurrentScreen } = useInterview();
  const [copied, setCopied] = useState(false);
  const [isResuming, setIsResuming] = useState(false);

  const resumeLink = typeof window !== 'undefined'
    ? `${window.location.origin}/interview/${token}?resume=${sessionId}`
    : '';

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(resumeLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select text
    }
  }, [resumeLink]);

  const handleResume = useCallback(async () => {
    setIsResuming(true);
    await resumeInterview();
    setCurrentScreen('interview');
    onResume();
  }, [resumeInterview, setCurrentScreen, onResume]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="max-w-md w-full mx-4 text-center"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        {/* Icon */}
        <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-6">
          <PauseCircle className="w-10 h-10 text-white/80" />
        </div>

        <h2 className="text-2xl font-bold text-white mb-3">
          Interview Paused
        </h2>

        <p className="text-white/60 mb-8">
          Your progress has been saved. You can resume now or come back later using the link below.
        </p>

        {/* Resume Link */}
        {resumeLink && (
          <div className="bg-white/10 rounded-lg p-3 mb-6">
            <p className="text-xs text-white/40 mb-1">Resume link</p>
            <div className="flex items-center gap-2">
              <p className="text-sm text-white/80 truncate flex-1 font-mono">
                {resumeLink}
              </p>
              <button
                onClick={handleCopy}
                className="shrink-0 p-2 rounded-md hover:bg-white/10 transition-colors"
                aria-label="Copy link"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4 text-white/60" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Resume Button */}
        <Button
          onClick={handleResume}
          disabled={isResuming}
          className="w-full h-12 bg-white text-neutral-900 hover:bg-white/90"
        >
          <Play className="w-4 h-4 mr-2" />
          {isResuming ? 'Resuming...' : 'Resume Interview'}
        </Button>
      </motion.div>
    </motion.div>
  );
}
