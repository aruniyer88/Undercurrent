'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { QuestionRendererProps } from '@/lib/types/interview';
import type { RatingScaleConfig } from '@/lib/types/database';

export function RatingScaleRenderer({ item, onSubmit }: QuestionRendererProps) {
  const [value, setValue] = useState<number | null>(null);
  const config = item.item_config as RatingScaleConfig;
  const scaleSize = config?.scale_size || 5;
  const points = Array.from({ length: scaleSize }, (_, i) => i + 1);

  const handleSubmit = () => {
    if (value === null) return;
    onSubmit({
      flowItemId: item.id,
      ratingValue: value,
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl md:text-2xl font-medium text-neutral-900 leading-relaxed">
        {item.question_text}
      </h2>

      {/* Scale */}
      <div className="space-y-2">
        <div className="flex justify-center gap-2 flex-wrap">
          {points.map((point, i) => (
            <motion.button
              key={point}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03, duration: 0.2 }}
              onClick={() => setValue(point)}
              className={cn(
                'w-12 h-12 md:w-14 md:h-14 rounded-xl border-2 font-semibold text-lg transition-all',
                value === point
                  ? 'border-primary-500 bg-primary-500 text-white scale-110'
                  : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300'
              )}
            >
              {point}
            </motion.button>
          ))}
        </div>

        {/* Labels */}
        {(config?.low_label || config?.high_label) && (
          <div className="flex justify-between px-1">
            <span className="text-xs text-neutral-500">{config.low_label || ''}</span>
            <span className="text-xs text-neutral-500">{config.high_label || ''}</span>
          </div>
        )}
      </div>

      <Button
        onClick={handleSubmit}
        disabled={value === null}
        className="w-full h-12 bg-primary-600 hover:bg-primary-700"
      >
        Continue
      </Button>
    </div>
  );
}
