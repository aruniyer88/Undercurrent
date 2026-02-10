'use client';

import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { QuestionRendererProps } from '@/lib/types/interview';
import type { AIConversationConfig } from '@/lib/types/database';

export function AiConversationRenderer({ item, onSubmit }: QuestionRendererProps) {
  const config = item.item_config as AIConversationConfig;
  const durationSeconds = config?.duration_seconds || 60;

  const [elapsed, setElapsed] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript] = useState<
    Array<{ role: 'user' | 'assistant'; content: string; timestamp: string }>
  >([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer
  useEffect(() => {
    if (!isRecording) return;
    timerRef.current = setInterval(() => {
      setElapsed((prev) => {
        if (prev + 1 >= durationSeconds) {
          // Time's up — auto-submit
          handleComplete();
          return prev + 1;
        }
        return prev + 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecording]);

  const handleStart = () => {
    setIsRecording(true);
    setElapsed(0);
    // In Phase 2, this will trigger the audio pipeline for AI-driven conversation
  };

  const handleComplete = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
    onSubmit({
      flowItemId: item.id,
      conversationTranscript: transcript.length > 0 ? transcript : null,
      conversationDurationSeconds: elapsed,
    });
  };

  const remaining = Math.max(0, durationSeconds - elapsed);
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  return (
    <div className="space-y-6">
      <h2 className="text-xl md:text-2xl font-medium text-neutral-900 leading-relaxed">
        {item.question_text}
      </h2>

      {/* Timer */}
      <div className="text-center">
        <span className="text-3xl font-mono font-light text-neutral-700">
          {minutes}:{seconds.toString().padStart(2, '0')}
        </span>
        <p className="text-sm text-neutral-500 mt-1">
          {isRecording ? 'Conversation in progress' : `${Math.floor(durationSeconds / 60)} minute conversation`}
        </p>
      </div>

      {/* Conversation transcript */}
      {transcript.length > 0 && (
        <div className="max-h-48 overflow-y-auto space-y-2 p-3 bg-neutral-50 rounded-lg">
          {transcript.map((entry, i) => (
            <p key={i} className={`text-sm ${entry.role === 'assistant' ? 'text-primary-700' : 'text-neutral-700'}`}>
              <span className="font-medium">{entry.role === 'assistant' ? 'AI' : 'You'}:</span>{' '}
              {entry.content}
            </p>
          ))}
        </div>
      )}

      {/* Controls */}
      {!isRecording ? (
        <Button
          onClick={handleStart}
          className="w-full h-12 bg-primary-600 hover:bg-primary-700"
        >
          <Mic className="w-4 h-4 mr-2" />
          Start Conversation
        </Button>
      ) : (
        <div className="flex flex-col items-center space-y-4">
          <button
            onClick={handleComplete}
            className="w-20 h-20 rounded-full bg-error-500 animate-pulse flex items-center justify-center shadow-lg"
          >
            <MicOff className="w-8 h-8 text-white" />
          </button>
          <p className="text-sm text-neutral-500">Tap to end conversation</p>
        </div>
      )}
    </div>
  );
}
