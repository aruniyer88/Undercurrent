"use client";

import { TranscriptQuestionBlock } from "./transcript-question-block";
import type { TranscriptSection } from "@/lib/types/responses";
import type { WaveformPlayerHandle } from "./response-detail-player";

interface ResponseDetailTranscriptProps {
  transcript: TranscriptSection[];
  sessionStartedAt: string | null;
  playerRef: React.RefObject<WaveformPlayerHandle | null>;
}

export function ResponseDetailTranscript({
  transcript,
  sessionStartedAt,
  playerRef,
}: ResponseDetailTranscriptProps) {
  if (!transcript || transcript.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-text-muted">
        No transcript data available for this session.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {transcript.map((section) => (
        <div key={section.section.id}>
          {/* Section header */}
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 pb-2 border-b border-border-subtle">
            {section.section.title}
          </h3>

          {/* Questions in this section */}
          <div className="space-y-4">
            {section.questions.map((q) => {
              // Skip items with no turns and no question text
              if (!q.item.question_text && q.turns.length === 0) return null;

              return (
                <TranscriptQuestionBlock
                  key={q.item.id}
                  questionText={q.item.question_text || "(No question text)"}
                  turns={q.turns}
                  sessionStartedAt={sessionStartedAt}
                  playerRef={playerRef}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
