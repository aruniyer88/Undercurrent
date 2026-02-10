'use client';

import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { OrbProps } from '@/lib/types/interview';

const RING_COUNT = 3;

/**
 * Ambient orb visualization with 4 states:
 * - idle: gentle breathing pulse
 * - speaking: multi-ring audio-reactive animation (frequency-driven)
 * - listening: soft teal pulse (state-based, not tightly audio-reactive)
 * - thinking: rotating gradient sweep
 */
export function AmbientOrb({ state, size, analyserNode, getFrequencyData, className }: OrbProps) {
  const animFrameRef = useRef<number>(0);
  const [ringScales, setRingScales] = useState<number[]>(
    Array(RING_COUNT).fill(1)
  );

  const isLarge = size === 'large';
  const baseSize = isLarge ? 192 : 48;

  // Audio-reactive animation loop for 'speaking' state
  useEffect(() => {
    if (state !== 'speaking' || (!analyserNode && !getFrequencyData)) {
      setRingScales(Array(RING_COUNT).fill(1));
      return;
    }

    // Use AnalyserNode directly, or the getFrequencyData callback (ElevenLabs SDK)
    const dataArray = analyserNode
      ? new Uint8Array(analyserNode.frequencyBinCount)
      : null;

    const animate = () => {
      let freqData: Uint8Array;
      if (analyserNode && dataArray) {
        analyserNode.getByteFrequencyData(dataArray);
        freqData = dataArray;
      } else if (getFrequencyData) {
        freqData = getFrequencyData();
      } else {
        return;
      }

      // Split frequency data into bands for each ring
      const bandSize = Math.max(1, Math.floor(freqData.length / RING_COUNT));
      const scales = Array.from({ length: RING_COUNT }, (_, i) => {
        const start = i * bandSize;
        const end = Math.min(start + bandSize, freqData.length);
        let sum = 0;
        for (let j = start; j < end; j++) {
          sum += freqData[j];
        }
        const avg = sum / Math.max(1, end - start) / 255; // Normalize to 0-1
        // Map to scale range: outer rings (low freq) = larger movement
        const maxScale = 1 + (0.3 - i * 0.08);
        return 1 + avg * (maxScale - 1);
      });

      setRingScales(scales);
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [state, analyserNode, getFrequencyData]);

  // Color scheme per state
  const getGradient = (ringIndex: number) => {
    switch (state) {
      case 'speaking':
        return ringIndex === 0
          ? 'from-blue-400/40 to-purple-500/40'
          : ringIndex === 1
            ? 'from-blue-500/30 to-purple-400/30'
            : 'from-blue-600/20 to-purple-300/20';
      case 'listening':
        return 'from-teal-400/30 to-emerald-400/30';
      case 'thinking':
        return 'from-violet-400/30 to-indigo-500/30';
      default: // idle
        return 'from-neutral-300/20 to-neutral-400/20';
    }
  };

  return (
    <div
      className={cn('relative flex items-center justify-center', className)}
      style={{ width: baseSize, height: baseSize }}
    >
      {/* Rings (outer to inner) */}
      {Array.from({ length: RING_COUNT }, (_, i) => {
        const ringFraction = 1 - i * 0.2; // 1.0, 0.8, 0.6
        const ringSize = baseSize * ringFraction;

        return (
          <motion.div
            key={i}
            className={cn(
              'absolute rounded-full bg-gradient-to-br',
              getGradient(i)
            )}
            style={{
              width: ringSize,
              height: ringSize,
            }}
            animate={
              state === 'idle'
                ? {
                    scale: [0.95, 1.05, 0.95],
                    transition: {
                      duration: 3,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: i * 0.3,
                    },
                  }
                : state === 'speaking'
                  ? { scale: ringScales[i] }
                  : state === 'listening'
                    ? {
                        scale: [1, 1.08, 1],
                        transition: {
                          duration: 1.5,
                          repeat: Infinity,
                          ease: 'easeInOut',
                          delay: i * 0.15,
                        },
                      }
                    : state === 'thinking'
                      ? {
                          rotate: [0, 360],
                          scale: [1, 1.02, 1],
                          transition: {
                            rotate: {
                              duration: 3 + i,
                              repeat: Infinity,
                              ease: 'linear',
                            },
                            scale: {
                              duration: 2,
                              repeat: Infinity,
                              ease: 'easeInOut',
                            },
                          },
                        }
                      : {}
            }
            transition={
              state === 'speaking'
                ? { duration: 0.05, ease: 'linear' }
                : undefined
            }
          />
        );
      })}

      {/* Center dot */}
      <motion.div
        className={cn(
          'absolute rounded-full',
          state === 'speaking'
            ? 'bg-blue-400/60'
            : state === 'listening'
              ? 'bg-teal-400/60'
              : state === 'thinking'
                ? 'bg-violet-400/60'
                : 'bg-neutral-300/40'
        )}
        style={{
          width: baseSize * 0.3,
          height: baseSize * 0.3,
        }}
        animate={
          state === 'idle'
            ? {
                scale: [1, 1.1, 1],
                opacity: [0.4, 0.6, 0.4],
              }
            : {}
        }
        transition={
          state === 'idle'
            ? { duration: 3, repeat: Infinity, ease: 'easeInOut' }
            : undefined
        }
      />
    </div>
  );
}
