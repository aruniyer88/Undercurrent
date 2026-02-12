'use client';

import { useState, useCallback } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import type { QuestionRendererProps } from '@/lib/types/interview';

export function OpenEndedRenderer({ item, onSubmit, audio, isActive, sessionId }: QuestionRendererProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const handleTapToSpeak = useCallback(async () => {
    if (isRecording) {
      // Stop recording → transcribe → submit
      setIsRecording(false);
      setIsTranscribing(true);

      const transcription = await audio.stopRecording(sessionId);

      setIsTranscribing(false);

      if (transcription) {
        onSubmit({
          flowItemId: item.id,
          textResponse: transcription,
        });
      }
      // If transcription failed/empty, stay on the question so user can retry
    } else {
      // Start recording
      await audio.startRecording();
      setIsRecording(true);
    }
  }, [isRecording, audio, onSubmit, item.id, sessionId]);

  return (
    <div className="space-y-6">
      {/* Question Text */}
      <h2 className="text-xl md:text-2xl font-medium text-neutral-900 leading-relaxed">
        {item.question_text}
      </h2>

      {/* Voice Response */}
      <div className="flex flex-col items-center space-y-4">
        {isTranscribing ? (
          <>
            <div className="w-20 h-20 rounded-full flex items-center justify-center bg-neutral-100">
              <Loader2 className="w-8 h-8 text-neutral-500 animate-spin" />
            </div>
            <p className="text-sm text-neutral-500">Processing your response...</p>
          </>
        ) : (
          <>
            <button
              onClick={handleTapToSpeak}
              disabled={!isActive && !isRecording}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-lg ${
                isRecording
                  ? 'bg-red-500 animate-pulse scale-110'
                  : isActive
                    ? 'bg-primary-100 hover:bg-primary-200'
                    : 'bg-neutral-100 cursor-not-allowed'
              }`}
            >
              {isRecording ? (
                <Square className="w-7 h-7 text-white" />
              ) : (
                <Mic className="w-8 h-8 text-primary-600" />
              )}
            </button>
            <p className="text-sm text-neutral-500">
              {isRecording
                ? 'Tap when done speaking'
                : isActive
                  ? 'Tap to start speaking'
                  : 'Listening to the question...'}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
