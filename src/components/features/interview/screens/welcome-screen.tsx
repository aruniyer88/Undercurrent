'use client';

import { motion } from 'framer-motion';
import { Volume2, Mic, Video, CheckCircle2, ArrowRight, Clock, PauseCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useInterview } from '../interview-context';
import type { WelcomeScreenProps } from '@/lib/types/interview';

export function WelcomeScreen({ onContinue }: WelcomeScreenProps) {
  const { study, studyFlow, sections, participantName, setParticipantName, participantEmail, setParticipantEmail } = useInterview();

  // Calculate total time estimate
  const totalSeconds = sections.reduce((sum, section) => sum + (section.time_limit_seconds || 120), 0);
  const totalMinutes = Math.round(totalSeconds / 60);
  const timeEstimate = totalMinutes <= 10
    ? "about 10 minutes"
    : totalMinutes <= 20
    ? "about 15-20 minutes"
    : totalMinutes <= 30
    ? "about 20-30 minutes"
    : `about ${Math.round(totalMinutes / 10) * 10} minutes`;

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-6 bg-neutral-50">
      <motion.div
        className="max-w-lg w-full text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {/* Logo / Brand Mark */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center mx-auto mb-6">
          <Volume2 className="w-8 h-8 text-white" />
        </div>

        {/* Study Title */}
        <h1 className="text-2xl font-bold text-neutral-900 mb-4">
          {study.title}
        </h1>

        {/* Welcome Message */}
        {studyFlow.welcome_message && (
          <p className="text-neutral-600 mb-8 leading-relaxed">
            {studyFlow.welcome_message}
          </p>
        )}

        {/* What to Expect Card */}
        <motion.div
          className="bg-white rounded-xl border border-neutral-200 p-6 mb-8 text-left"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <h3 className="font-medium text-neutral-900 mb-3">What to expect:</h3>
          <ul className="space-y-2 text-sm text-neutral-600">
            <li className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary-500 shrink-0" />
              This will take {timeEstimate}
            </li>
            <li className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-primary-500 shrink-0" />
              An AI interviewer will ask you questions
            </li>
            <li className="flex items-center gap-2">
              {study.interview_mode === 'video' ? (
                <Video className="w-4 h-4 text-primary-500 shrink-0" />
              ) : (
                <Mic className="w-4 h-4 text-primary-500 shrink-0" />
              )}
              {study.interview_mode === 'video'
                ? "You'll respond on video"
                : "You'll respond by speaking"}
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary-500 shrink-0" />
              {study.study_type === 'streaming'
                ? 'A natural conversation — just speak freely'
                : 'One question at a time — take your time'}
            </li>
            <li className="flex items-center gap-2">
              <PauseCircle className="w-4 h-4 text-primary-500 shrink-0" />
              You can pause and resume anytime
            </li>
          </ul>
        </motion.div>

        {/* Name Input + Continue */}
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          <div className="space-y-2">
            <div>
              <Label htmlFor="participant-name" className="sr-only">
                Your name
              </Label>
              <Input
                id="participant-name"
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                placeholder="Your name"
                className="text-center"
              />
            </div>
            <div>
              <Label htmlFor="participant-email" className="sr-only">
                Your email (optional)
              </Label>
              <Input
                id="participant-email"
                type="email"
                value={participantEmail}
                onChange={(e) => setParticipantEmail(e.target.value)}
                placeholder="Your email (optional)"
                className="text-center"
              />
            </div>
          </div>
          <Button
            onClick={onContinue}
            className="w-full h-12 bg-primary-600 hover:bg-primary-700"
          >
            Begin
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
