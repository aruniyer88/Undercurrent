'use client';

import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface VideoPipProps {
  stream: MediaStream | null;
  className?: string;
}

export function VideoPip({ stream, className }: VideoPipProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const dragConstraintsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  if (!stream) return null;

  return (
    <>
      {/* Drag constraints container (full viewport) */}
      <div ref={dragConstraintsRef} className="fixed inset-0 pointer-events-none z-40" />

      <motion.div
        drag
        dragConstraints={dragConstraintsRef}
        dragElastic={0.1}
        className={`fixed bottom-4 right-4 z-50 rounded-xl overflow-hidden shadow-lg border-2 border-white/20 cursor-grab active:cursor-grabbing ${className || ''}`}
        style={{ width: 160, height: 120 }}
        whileDrag={{ scale: 1.05 }}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover -scale-x-100"
        />
        {/* Recording indicator */}
        <div className="absolute top-2 left-2 flex items-center gap-1">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-[10px] text-white font-medium drop-shadow">REC</span>
        </div>
      </motion.div>
    </>
  );
}
