'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useInterview } from '../interview-context';
import { InterviewLayout } from './interview-layout';
import { BottomControlBar } from './bottom-control-bar';
import { QuestionRenderer } from './question-renderer';
import {
  getLayoutVariant,
  itemHasScreenUI,
  type StructuredInterviewProps,
  type QuestionResponse,
  type QuestionNavigationState,
  type OrbState,
  type MicButtonState,
} from '@/lib/types/interview';
import { STUDY_LANGUAGE_TO_ISO } from '@/lib/elevenlabs/types';

const questionVariants = {
  enter: { opacity: 0, x: 60 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -60 },
};

export function StructuredInterview({ onComplete }: StructuredInterviewProps) {
  const {
    study,
    sections,
    totalQuestions,
    audio,
    sessionId,
    voiceProfile,
    completeSession,
    cameraStream,
    isResuming,
    resumeProgress,
    pauseInterview,
    setCurrentScreen,
  } = useInterview();

  // Initialize nav — from resume progress if available
  const [nav, setNav] = useState<QuestionNavigationState>(() => {
    if (resumeProgress) {
      // Compute questionNumber from sectionIndex/itemIndex
      let qn = 1;
      for (let si = 0; si < resumeProgress.sectionIndex; si++) {
        qn += (sections[si]?.items?.length || 0);
      }
      qn += resumeProgress.itemIndex;
      return {
        sectionIndex: resumeProgress.sectionIndex,
        itemIndex: resumeProgress.itemIndex,
        questionNumber: qn,
      };
    }
    return { sectionIndex: 0, itemIndex: 0, questionNumber: 1 };
  });

  const [orbState, setOrbState] = useState<OrbState>('idle');
  const [questionReady, setQuestionReady] = useState(false);
  const [currentAiText, setCurrentAiText] = useState('');

  const currentSection = sections[nav.sectionIndex];
  const currentItem = currentSection?.items?.[nav.itemIndex] ?? null;
  const hasStimulus = !!currentSection?.stimulus_type;
  const hasScreenUI = currentItem ? itemHasScreenUI(currentItem.item_type) : false;
  const progress = (nav.questionNumber / totalQuestions) * 100;
  const voiceId = voiceProfile?.provider_voice_id;
  const studyLangCode = STUDY_LANGUAGE_TO_ISO[study.language || 'English'] || 'en';
  const isVideo = study.interview_mode === 'video';

  // Determine layout variant
  const layoutVariant = useMemo(
    () => getLayoutVariant(
      isVideo ? 'video' : 'voice',
      hasStimulus,
      hasScreenUI
    ),
    [isVideo, hasStimulus, hasScreenUI]
  );

  // Derive mic button state from audio pipeline + orb state
  const micState: MicButtonState = useMemo(() => {
    if (audio.state === 'recording') return 'recording';
    if (audio.state === 'transcribing') return 'processing';
    if (audio.state === 'playing' || audio.state === 'synthesizing') return 'ai-speaking';
    return 'ready';
  }, [audio.state]);

  // Stable callbacks to avoid re-triggering TTS effect
  const speakFn = audio.speak;
  const stopSpeakingFn = audio.stopSpeaking;

  // Read question aloud via TTS when it changes
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

    // Build text to speak
    let textToSpeak = questionText;

    // Add warm greeting for first question (skip on resume)
    if (nav.questionNumber === 1 && !isResuming) {
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

    setCurrentAiText(questionText);
    setQuestionReady(false);
    setOrbState('speaking');

    speakFn(textToSpeak, voiceId, sessionId ?? undefined, studyLangCode).then(() => {
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
  }, [nav.sectionIndex, nav.itemIndex, nav.questionNumber, currentItem, voiceId, sessionId, sections, speakFn, stopSpeakingFn, isResuming, studyLangCode]);

  // Handle mic button interactions
  const handleMicClick = useCallback(() => {
    if (micState === 'ready') {
      audio.startRecording();
      setOrbState('listening');
    } else if (micState === 'recording') {
      // Stop recording → transcribe → auto-submit for open-ended
      setOrbState('thinking');
      audio.stopRecording(sessionId ?? undefined).then((transcription) => {
        if (transcription && currentItem) {
          handleSubmit({
            flowItemId: currentItem.id,
            textResponse: transcription,
          });
        } else {
          setOrbState('idle');
        }
      });
    } else if (micState === 'ai-speaking') {
      // Interrupt TTS and start recording
      audio.interruptAndRecord(sessionId ?? undefined);
      setOrbState('listening');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [micState, audio, sessionId, currentItem]);

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
              current_section_index: nav.sectionIndex,
              current_item_index: nav.itemIndex,
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
        await completeSession();
        onComplete();
      }
    },
    [sessionId, currentSection, nav, sections, onComplete, completeSession]
  );

  const handlePause = useCallback(async () => {
    audio.stopSpeaking();
    await pauseInterview();
    setCurrentScreen('paused');
  }, [audio, pauseInterview, setCurrentScreen]);

  const questionKey = currentItem
    ? `${nav.sectionIndex}-${nav.itemIndex}`
    : 'empty';

  // For open-ended items, the mic button handles submission.
  // For screen UI items (selects, rating, ranking), the renderer handles submission.
  const showScreenUI = hasScreenUI && currentItem;

  return (
    <div className="min-h-[100dvh] relative">
      {/* Layout — handles all 8 variants */}
      {currentSection && (
        <InterviewLayout
          variant={layoutVariant}
          aiText={currentAiText}
          audioState={audio.state}
          cameraStream={cameraStream}
          section={currentSection}
          orbState={orbState}
          ttsAnalyser={audio.ttsAnalyser}
        >
          {/* Question UI (only rendered for screen UI items) */}
          {showScreenUI && (
            <AnimatePresence mode="wait">
              <motion.div
                key={questionKey}
                variants={questionVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              >
                <QuestionRenderer
                  item={currentItem}
                  section={currentSection}
                  onSubmit={handleSubmit}
                  audio={audio}
                  isActive={questionReady}
                  sessionId={sessionId ?? undefined}
                  variant={hasStimulus ? 'compact' : 'default'}
                />
              </motion.div>
            </AnimatePresence>
          )}
        </InterviewLayout>
      )}

      {/* Bottom Control Bar — always visible */}
      <BottomControlBar
        micState={micState}
        onMicClick={handleMicClick}
        onPause={handlePause}
        progress={progress}
        audio={audio}
        showCamera={isVideo}
      />
    </div>
  );
}
