'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AudioPipelineState } from '@/lib/types/interview';

interface AITextOverlayProps {
  text: string;
  /** Audio pipeline state — drives word reveal timing */
  audioState: AudioPipelineState;
  /** Estimated TTS duration in ms (for word reveal pacing) */
  ttsDurationMs?: number;
  className?: string;
}

/**
 * Semi-transparent overlay at the top of the viewport.
 * Words appear progressively while AI speaks via TTS.
 * Collapsible via chevron toggle.
 */
export function AITextOverlay({ text, audioState, ttsDurationMs, className }: AITextOverlayProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [visibleWordCount, setVisibleWordCount] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const words = useMemo(() => text.split(/\s+/).filter(Boolean), [text]);
  const totalWords = words.length;

  // Progressive word reveal during TTS playback
  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (audioState === 'playing' && totalWords > 0) {
      // Estimate ms per word from TTS duration, or use ~250ms/word default
      const msPerWord = ttsDurationMs
        ? ttsDurationMs / totalWords
        : 250;

      setVisibleWordCount(0);
      let count = 0;

      intervalRef.current = setInterval(() => {
        count++;
        setVisibleWordCount(count);
        if (count >= totalWords) {
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
      }, msPerWord);
    } else if (audioState === 'idle' || audioState === 'error') {
      // Show all words when TTS finishes
      setVisibleWordCount(totalWords);
    } else if (audioState === 'synthesizing') {
      // Reset while synthesizing
      setVisibleWordCount(0);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [audioState, totalWords, ttsDurationMs]);

  // Reset when text changes
  useEffect(() => {
    setVisibleWordCount(0);
  }, [text]);

  if (!text) return null;

  return (
    <div className={cn('absolute top-0 left-0 right-0 z-10', className)}>
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-black/60 backdrop-blur-sm px-6 py-4 text-white"
          >
            <p className="text-lg md:text-xl leading-relaxed max-w-3xl mx-auto">
              {words.map((word, i) => (
                <motion.span
                  key={`${text}-${i}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: i < visibleWordCount ? 1 : 0 }}
                  transition={{ duration: 0.15 }}
                  className="inline"
                >
                  {word}{' '}
                </motion.span>
              ))}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chevron toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={cn(
          'mx-auto flex items-center justify-center w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm text-white/70 hover:text-white transition-colors',
          isCollapsed ? 'mt-2 ml-4' : '-mt-1 ml-4'
        )}
        aria-label={isCollapsed ? 'Show AI text' : 'Hide AI text'}
      >
        {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
      </button>
    </div>
  );
}
