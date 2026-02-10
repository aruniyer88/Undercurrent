'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { QuestionRendererProps } from '@/lib/types/interview';
import type { SelectConfig } from '@/lib/types/database';

export function MultiSelectRenderer({ item, onSubmit }: QuestionRendererProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const config = item.item_config as SelectConfig;
  const options = config?.options || [];

  const toggleOption = (option: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(option)) {
        next.delete(option);
      } else {
        next.add(option);
      }
      return next;
    });
  };

  const handleSubmit = () => {
    if (selected.size === 0) return;
    onSubmit({
      flowItemId: item.id,
      selectedOptions: Array.from(selected),
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl md:text-2xl font-medium text-neutral-900 leading-relaxed">
        {item.question_text}
      </h2>
      <p className="text-sm text-neutral-500">Select all that apply</p>

      <div className="space-y-2">
        {options.map((option, i) => {
          const isSelected = selected.has(option);
          return (
            <motion.button
              key={option}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.2 }}
              onClick={() => toggleOption(option)}
              className={cn(
                'w-full p-4 rounded-xl border-2 text-left transition-colors flex items-center gap-3',
                isSelected
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-neutral-200 bg-white hover:border-neutral-300'
              )}
            >
              <div
                className={cn(
                  'w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0',
                  isSelected
                    ? 'border-primary-500 bg-primary-500'
                    : 'border-neutral-300'
                )}
              >
                {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
              </div>
              <span className="text-neutral-800">{option}</span>
            </motion.button>
          );
        })}
      </div>

      <Button
        onClick={handleSubmit}
        disabled={selected.size === 0}
        className="w-full h-12 bg-primary-600 hover:bg-primary-700"
      >
        Continue
      </Button>
    </div>
  );
}
