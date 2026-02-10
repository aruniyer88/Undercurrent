'use client';

import { AnimatePresence, motion } from 'framer-motion';
import type { ConversationEntry } from '@/lib/types/interview';

interface ConversationDisplayProps {
  entries: ConversationEntry[];
}

export function ConversationDisplay({ entries }: ConversationDisplayProps) {
  // Show only the last 3 entries as floating subtitles
  const visible = entries.slice(-3);

  return (
    <div className="absolute bottom-20 left-6 right-6 space-y-2">
      <AnimatePresence>
        {visible.map((entry) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            <p className="text-sm text-white/80 leading-relaxed">
              {entry.text}
            </p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
