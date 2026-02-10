'use client';

import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { QuestionRendererProps } from '@/lib/types/interview';
import type { InstructionConfig } from '@/lib/types/database';

export function InstructionRenderer({ item, onSubmit }: QuestionRendererProps) {
  const config = item.item_config as InstructionConfig;

  return (
    <div className="space-y-6">
      {item.question_text && (
        <h2 className="text-xl md:text-2xl font-medium text-neutral-900 leading-relaxed">
          {item.question_text}
        </h2>
      )}

      {config?.content && (
        <div className="prose prose-neutral max-w-none">
          <p className="text-neutral-600 leading-relaxed whitespace-pre-wrap">
            {config.content}
          </p>
        </div>
      )}

      <Button
        onClick={() => onSubmit({ flowItemId: item.id })}
        className="w-full h-12 bg-primary-600 hover:bg-primary-700"
      >
        Continue
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
}
