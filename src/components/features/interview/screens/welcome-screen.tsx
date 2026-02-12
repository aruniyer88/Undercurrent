'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useInterview } from '../interview-context';
import type { WelcomeScreenProps } from '@/lib/types/interview';

export function WelcomeScreen({ onContinue }: WelcomeScreenProps) {
  const {
    study,
    studyFlow,
    participantName,
    setParticipantName,
    participantEmail,
    setParticipantEmail,
    isResuming,
  } = useInterview();

  const [consentGiven, setConsentGiven] = useState(false);

  const isVideo = study.interview_mode === 'video';
  const recordingType = isVideo ? 'audio/video' : 'audio';

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-6 bg-neutral-50">
      <motion.div
        className="max-w-lg w-full bg-white rounded-2xl border border-neutral-200 shadow-xl p-8 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {/* Resume Banner */}
        {isResuming && (
          <motion.div
            className="bg-primary-50 border border-primary-200 rounded-lg p-3 mb-6"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-sm font-medium text-primary-700">
              Welcome back! Your progress has been saved.
            </p>
          </motion.div>
        )}

        {/* Study Title */}
        <h1 className="text-2xl font-bold text-neutral-900 mb-4">
          You&apos;re Invited to Share Your Feedback
        </h1>

        {/* Welcome Message */}
        {studyFlow.welcome_message && (
          <p className="text-neutral-600 mb-8 leading-relaxed">
            {studyFlow.welcome_message}
          </p>
        )}

        {/* Name + Email Inputs */}
        <motion.div
          className="space-y-3 mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
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
        </motion.div>

        {/* Consent Checkbox */}
        <motion.div
          className="flex items-start gap-3 p-4 bg-neutral-100 rounded-lg mb-6 text-left"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          <Checkbox
            id="consent"
            checked={consentGiven}
            onCheckedChange={(checked) => setConsentGiven(checked as boolean)}
          />
          <label htmlFor="consent" className="text-sm text-neutral-700 cursor-pointer">
            I consent to having my {recordingType} responses recorded for research purposes
          </label>
        </motion.div>

        {/* Begin Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
        >
          <Button
            onClick={onContinue}
            disabled={!consentGiven}
            className="w-full h-12 bg-primary-600 hover:bg-primary-700"
          >
            {isResuming ? 'Continue Interview' : 'Begin'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
