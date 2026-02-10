'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useInterview } from '../interview-context';
import type { ConsentScreenProps } from '@/lib/types/interview';

export function ConsentScreen({ onContinue }: ConsentScreenProps) {
  const { study } = useInterview();
  const [consentGiven, setConsentGiven] = useState(false);

  const isVideo = study.interview_mode === 'video';
  const recordingType = isVideo ? 'video and audio' : 'audio';

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-6 bg-neutral-50">
      <motion.div
        className="max-w-lg w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <h1 className="text-2xl font-bold text-neutral-900 mb-6 text-center">
          Before we begin
        </h1>

        <div className="bg-white rounded-xl border border-neutral-200 p-6 mb-6">
          <h3 className="font-medium text-neutral-900 mb-4">
            Important information:
          </h3>
          <ul className="space-y-3 text-sm text-neutral-600">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-success-500 mt-0.5 shrink-0" />
              Your {recordingType} responses will be recorded and transcribed
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-success-500 mt-0.5 shrink-0" />
              Recordings are stored securely and only used for research
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-success-500 mt-0.5 shrink-0" />
              You can stop at any time
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-success-500 mt-0.5 shrink-0" />
              Your identity will be kept confidential
            </li>
          </ul>
        </div>

        <div className="flex items-start gap-3 p-4 bg-neutral-100 rounded-lg mb-6">
          <Checkbox
            id="consent"
            checked={consentGiven}
            onCheckedChange={(checked) => setConsentGiven(checked as boolean)}
          />
          <label htmlFor="consent" className="text-sm text-neutral-700 cursor-pointer">
            I understand and agree to participate in this research interview.
            I consent to having my {recordingType} responses recorded.
          </label>
        </div>

        <Button
          onClick={onContinue}
          disabled={!consentGiven}
          className="w-full h-12 bg-primary-600 hover:bg-primary-700"
        >
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </motion.div>
    </div>
  );
}
