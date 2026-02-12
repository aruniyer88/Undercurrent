'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  type ReactNode,
} from 'react';
import type {
  Study,
  StudyFlowWithSections,
  FlowSectionWithItems,
  VoiceProfile,
  Distribution,
  InterviewSession,
} from '@/lib/types/database';
import type {
  InterviewContextValue,
  InterviewScreen,
  ResumeProgress,
} from '@/lib/types/interview';
import { useAudioPipeline } from '@/hooks/use-audio-pipeline';

const InterviewContext = createContext<InterviewContextValue | null>(null);

export function useInterview() {
  const ctx = useContext(InterviewContext);
  if (!ctx) throw new Error('useInterview must be used within InterviewProvider');
  return ctx;
}

interface InterviewProviderProps {
  study: Study;
  studyFlow: StudyFlowWithSections;
  voiceProfile: VoiceProfile | null;
  distribution: Distribution | null;
  token: string;
  children: ReactNode;
}

function getSessionStorageKey(token: string) {
  return `uc_session_${token}`;
}

export function InterviewProvider({
  study,
  studyFlow,
  voiceProfile,
  distribution,
  token,
  children,
}: InterviewProviderProps) {
  const [currentScreen, setCurrentScreen] = useState<InterviewScreen>('welcome');
  const [participantName, setParticipantName] = useState('');
  const [participantEmail, setParticipantEmail] = useState('');
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Pause / Resume state
  const [isPaused, setIsPaused] = useState(false);
  const [isResuming, setIsResuming] = useState(false);
  const [answeredItemIds, setAnsweredItemIds] = useState<Set<string>>(new Set());
  const [resumeProgress, setResumeProgress] = useState<ResumeProgress | null>(null);

  // Onboarding
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  // Sort sections and their items by display_order
  const sections = useMemo<FlowSectionWithItems[]>(() => {
    const raw = studyFlow.sections || [];
    return [...raw]
      .sort((a, b) => a.display_order - b.display_order)
      .map((section) => ({
        ...section,
        items: [...(section.items || [])].sort(
          (a, b) => a.display_order - b.display_order
        ),
      }));
  }, [studyFlow.sections]);

  const totalQuestions = useMemo(
    () => sections.reduce((acc, s) => acc + (s.items?.length || 0), 0),
    [sections]
  );

  // Detect resume from localStorage or URL param on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const resumeSessionId = urlParams.get('resume');
    const storedSessionId = localStorage.getItem(getSessionStorageKey(token));
    const targetSessionId = resumeSessionId || storedSessionId;

    if (!targetSessionId) return;

    // Check if session is resumable
    fetch(`/api/interview/check-session?session_id=${targetSessionId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.resumable) {
          setIsResuming(true);
          setSessionId(targetSessionId);
          if (data.session_summary?.participant_name) {
            setParticipantName(data.session_summary.participant_name);
          }
          if (data.session_summary?.participant_email) {
            setParticipantEmail(data.session_summary.participant_email);
          }
        } else {
          // Session not resumable — clear stored data
          localStorage.removeItem(getSessionStorageKey(token));
        }
      })
      .catch(() => {
        // Silently fail — treat as fresh session
        localStorage.removeItem(getSessionStorageKey(token));
      });
  }, [token]);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [cameraStream]);

  // Audio pipeline — TTS playback, recording, transcription
  const audio = useAudioPipeline();

  const startSession = useCallback(async (): Promise<string | null> => {
    try {
      const res = await fetch('/api/interview/start-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          study_id: study.id,
          study_type: study.study_type,
          interview_mode: study.interview_mode,
          participant_name: participantName || null,
          participant_email: participantEmail || null,
          language: study.language || null,
          distribution_id: distribution?.id || null,
        }),
      });
      if (!res.ok) throw new Error('Failed to start session');
      const data = await res.json();
      setSession(data.session);
      setSessionId(data.session.id);
      // Persist session ID for resume
      localStorage.setItem(getSessionStorageKey(token), data.session.id);
      return data.session.id;
    } catch (err) {
      console.error('Failed to start interview session:', err);
      return null;
    }
  }, [study.id, study.study_type, study.interview_mode, study.language, participantName, participantEmail, distribution?.id, token]);

  const completeSession = useCallback(async () => {
    if (!sessionId) return;
    try {
      await fetch('/api/interview/complete-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          distribution_id: distribution?.id || null,
        }),
      });
      // Clear stored session on completion
      localStorage.removeItem(getSessionStorageKey(token));
    } catch (err) {
      console.error('Failed to complete session:', err);
    }
  }, [sessionId, distribution?.id, token]);

  const pauseInterview = useCallback(async () => {
    if (!sessionId) return;
    setIsPaused(true);
    try {
      await fetch('/api/interview/pause-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      });
    } catch (err) {
      console.error('Failed to pause session:', err);
    }
  }, [sessionId]);

  const resumeInterview = useCallback(async () => {
    if (!sessionId) return;
    try {
      const res = await fetch('/api/interview/resume-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      });
      if (!res.ok) throw new Error('Failed to resume session');
      const data = await res.json();
      setSession(data.session);
      setAnsweredItemIds(new Set(data.answered_item_ids || []));

      // Compute first unanswered question
      const answered = new Set(data.answered_item_ids || []);
      let found = false;
      for (let si = 0; si < sections.length && !found; si++) {
        const items = sections[si].items || [];
        for (let ii = 0; ii < items.length && !found; ii++) {
          if (!answered.has(items[ii].id)) {
            setResumeProgress({ sessionId, sectionIndex: si, itemIndex: ii });
            found = true;
          }
        }
      }

      setIsPaused(false);
      setIsResuming(false);
    } catch (err) {
      console.error('Failed to resume session:', err);
    }
  }, [sessionId, sections]);

  const value = useMemo<InterviewContextValue>(
    () => ({
      study,
      studyFlow,
      voiceProfile,
      distribution,
      token,
      session,
      sessionId,
      currentScreen,
      setCurrentScreen,
      participantName,
      setParticipantName,
      participantEmail,
      setParticipantEmail,
      permissionsGranted,
      setPermissionsGranted,
      cameraStream,
      setCameraStream,
      audio,
      isPaused,
      pauseInterview,
      resumeInterview,
      isResuming,
      answeredItemIds,
      resumeProgress,
      onboardingComplete,
      setOnboardingComplete,
      startSession,
      completeSession,
      sections,
      totalQuestions,
    }),
    [
      study,
      studyFlow,
      voiceProfile,
      distribution,
      token,
      session,
      sessionId,
      currentScreen,
      participantName,
      participantEmail,
      permissionsGranted,
      cameraStream,
      audio,
      isPaused,
      pauseInterview,
      resumeInterview,
      isResuming,
      answeredItemIds,
      resumeProgress,
      onboardingComplete,
      startSession,
      completeSession,
      sections,
      totalQuestions,
    ]
  );

  return (
    <InterviewContext.Provider value={value}>
      {children}
    </InterviewContext.Provider>
  );
}
