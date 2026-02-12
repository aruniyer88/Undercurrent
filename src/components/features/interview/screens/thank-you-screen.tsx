'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import type { ThankYouScreenProps } from '@/lib/types/interview';

export function ThankYouScreen({ redirectUrl }: ThankYouScreenProps) {
  // Auto-redirect after 5 seconds if a redirect URL is set
  useEffect(() => {
    if (!redirectUrl) return;
    const timer = setTimeout(() => {
      window.location.href = redirectUrl;
    }, 5000);
    return () => clearTimeout(timer);
  }, [redirectUrl]);

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-6 bg-neutral-950">
      <motion.div
        className="max-w-lg w-full text-center"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <motion.div
          className="w-20 h-20 rounded-full bg-success-500/20 flex items-center justify-center mx-auto mb-6"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
        >
          <CheckCircle2 className="w-10 h-10 text-success-400" />
        </motion.div>

        <h1 className="text-2xl font-bold text-white mb-4">
          Thank you!
        </h1>

        <p className="text-white/60 mb-8">
          Your interview has been recorded. Your responses will help improve
          our understanding and make better decisions.
        </p>

        <div className="bg-white/5 rounded-xl border border-white/10 p-6">
          <p className="text-sm text-white/40">
            You can now close this page.
            {redirectUrl && ' You will be redirected shortly.'}
            {!redirectUrl &&
              ' If you have any questions, please contact the person who sent you this interview.'}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
