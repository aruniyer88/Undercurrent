'use client';

import { useState, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useInterview } from '../interview-context';
import { ProgressBar } from '../shared/progress-bar';
import { InterviewHeader } from '../shared/interview-header';
import { AmbientOrb } from '../shared/ambient-orb';
import { QuestionRenderer } from './question-renderer';
import { StimulusDisplay } from '../shared/stimulus-display';
import type { StructuredInterviewProps, QuestionResponse, QuestionNavigationState, OrbState } from '@/lib/types/interview';

const questionVariants = {
  enter: { opacity: 0, x: 60 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -60 },
};

export function StructuredInterview({ onComplete }: StructuredInterviewProps) {
  const { sections, totalQuestions, audio, sessionId, voiceProfile, completeSession } = useInterview();

  const [nav, setNav] = useState<QuestionNavigationState>({
    sectionIndex: 0,
    itemIndex: 0,
    questionNumber: 1,
  });
  const [orbState, setOrbState] = useState<OrbState>('idle');
  const [questionReady, setQuestionReady] = useState(false);

  const currentSection = sections[nav.sectionIndex];
  const currentItem = currentSection?.items?.[nav.itemIndex] ?? null;
  const hasStimulus = !!currentSection?.stimulus_type;
  const progress = (nav.questionNumber / totalQuestions) * 100;
  const voiceId = voiceProfile?.provider_voice_id;

  // Destructure stable callbacks so the effect doesn't re-fire when
  // transient audio state (ttsAnalyser, pipeline state, etc.) changes.
  const speakFn = audio.speak;
  const stopSpeakingFn = audio.stopSpeaking;

  // Read question aloud via TTS when it changes.
  useEffect(() => {
    let cancelled = false;

    if (!currentItem || !voiceId) {
      setQuestionReady(true);
      return;
    }

    const questionText = currentItem.question_text;
    if (!questionText) {
      setQuestionReady(true);
      return;
    }

    // Add warm greeting for first question
    let textToSpeak = questionText;
    if (nav.questionNumber === 1) {
      // Calculate total time estimate
      const totalSeconds = sections.reduce((sum, s) => sum + (s.time_limit_seconds || 120), 0);
      const totalMinutes = Math.round(totalSeconds / 60);
      const timeEstimate = totalMinutes <= 10
        ? "about 10 minutes"
        : totalMinutes <= 20
        ? "about 15-20 minutes"
        : totalMinutes <= 30
        ? "about 20-30 minutes"
        : `about ${Math.round(totalMinutes / 10) * 10} minutes`;

      const greeting = `Hi! Thank you so much for joining this interview. Before we begin, I want to let you know this conversation should take ${timeEstimate}. We'll be having a natural discussion, so feel free to take your time with your responses. If you need to pause at any point, just let me know. Ready? Let's start with the first question: `;

      textToSpeak = greeting + questionText;
    }

    setQuestionReady(false);
    setOrbState('speaking');

    speakFn(textToSpeak, voiceId, sessionId ?? undefined).then(() => {
      if (cancelled) return;
      setOrbState('idle');
      setQuestionReady(true);
    }).catch(() => {
      if (cancelled) return;
      setOrbState('idle');
      setQuestionReady(true);
    });

    return () => {
      cancelled = true;
      stopSpeakingFn();
    };
  }, [nav.sectionIndex, nav.itemIndex, nav.questionNumber, currentItem, voiceId, sessionId, sections, speakFn, stopSpeakingFn]);

  const handleSubmit = useCallback(
    async (response: QuestionResponse) => {
      // Store response
      if (sessionId) {
        try {
          await fetch('/api/interview/submit-response', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              session_id: sessionId,
              flow_item_id: response.flowItemId,
              text_response: response.textResponse || null,
              selected_options: response.selectedOptions || null,
              rating_value: response.ratingValue ?? null,
              ranked_items: response.rankedItems || null,
              conversation_transcript: response.conversationTranscript || null,
              conversation_duration_seconds: response.conversationDurationSeconds ?? null,
            }),
          });
        } catch (err) {
          console.error('Failed to submit response:', err);
        }
      }

      // Navigate to next question or complete
      const items = currentSection?.items || [];
      if (nav.itemIndex < items.length - 1) {
        setNav((prev) => ({
          sectionIndex: prev.sectionIndex,
          itemIndex: prev.itemIndex + 1,
          questionNumber: prev.questionNumber + 1,
        }));
      } else if (nav.sectionIndex < sections.length - 1) {
        setNav((prev) => ({
          sectionIndex: prev.sectionIndex + 1,
          itemIndex: 0,
          questionNumber: prev.questionNumber + 1,
        }));
      } else {
        // Complete the session before transitioning
        await completeSession();
        onComplete();
      }
    },
    [sessionId, currentSection, nav, sections, onComplete, completeSession]
  );

  const questionKey = currentItem
    ? `${nav.sectionIndex}-${nav.itemIndex}`
    : 'empty';

  const activeAnalyser = orbState === 'speaking' ? audio.ttsAnalyser : null;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-neutral-50">
      {/* Progress */}
      <ProgressBar progress={progress} />

      {/* Header */}
      <InterviewHeader
        questionNumber={nav.questionNumber}
        totalQuestions={totalQuestions}
        className="px-6 py-3 border-b border-neutral-200"
      />

      {/* Content Area */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Stimulus (left on desktop, top on mobile) */}
        {hasStimulus && (
          <div className="md:w-1/2 max-h-[40vh] md:max-h-none overflow-auto border-b md:border-b-0 md:border-r border-neutral-200">
            <StimulusDisplay
              type={currentSection.stimulus_type!}
              config={currentSection.stimulus_config}
            />
          </div>
        )}

        {/* Question + Response Area */}
        <div className={`flex-1 flex flex-col items-center justify-center p-6 ${hasStimulus ? '' : 'max-w-2xl mx-auto w-full'}`}>
          <AnimatePresence mode="wait">
            {currentItem && (
              <motion.div
                key={questionKey}
                variants={questionVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="w-full"
              >
                <QuestionRenderer
                  item={currentItem}
                  section={currentSection}
                  onSubmit={handleSubmit}
                  audio={audio}
                  isActive={questionReady}
                  sessionId={sessionId ?? undefined}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Small orb below the question */}
          <div className="mt-6">
            <AmbientOrb
              state={orbState}
              size="small"
              analyserNode={activeAnalyser}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 text-center border-t border-neutral-200">
        <p className="text-xs text-neutral-400">
          Powered by Undercurrent
        </p>
      </div>
    </div>
  );
}
