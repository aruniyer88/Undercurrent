'use client';

import type { QuestionRendererProps } from '@/lib/types/interview';
import { OpenEndedRenderer } from './renderers/open-ended-renderer';
import { SingleSelectRenderer } from './renderers/single-select-renderer';
import { MultiSelectRenderer } from './renderers/multi-select-renderer';
import { RatingScaleRenderer } from './renderers/rating-scale-renderer';
import { RankingRenderer } from './renderers/ranking-renderer';
import { InstructionRenderer } from './renderers/instruction-renderer';
import { AiConversationRenderer } from './renderers/ai-conversation-renderer';

export function QuestionRenderer(props: QuestionRendererProps) {
  switch (props.item.item_type) {
    case 'open_ended':
      return <OpenEndedRenderer {...props} />;
    case 'single_select':
      return <SingleSelectRenderer {...props} />;
    case 'multi_select':
      return <MultiSelectRenderer {...props} />;
    case 'rating_scale':
      return <RatingScaleRenderer {...props} />;
    case 'ranking':
      return <RankingRenderer {...props} />;
    case 'instruction':
      return <InstructionRenderer {...props} />;
    case 'ai_conversation':
      return <AiConversationRenderer {...props} />;
    default:
      return (
        <div className="text-center text-neutral-500">
          <p>Unknown question type</p>
        </div>
      );
  }
}
