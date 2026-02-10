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
      return data.session.id;
    } catch (err) {
      console.error('Failed to start interview session:', err);
      return null;
    }
  }, [study.id, study.study_type, study.interview_mode, study.language, participantName, participantEmail, distribution?.id]);

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
    } catch (err) {
      console.error('Failed to complete session:', err);
    }
  }, [sessionId, distribution?.id]);

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
