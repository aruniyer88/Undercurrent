'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useInterview } from './interview-context';
import { WelcomeScreen } from './screens/welcome-screen';
import { OnboardingScreen } from './screens/onboarding-screen';
import { DeviceSetupScreen } from './screens/device-setup-screen';
import { ConnectingScreen } from './screens/connecting-screen';
import { ThankYouScreen } from './screens/thank-you-screen';
import { PauseScreen } from './screens/pause-screen';
import { StructuredInterview } from './structured/structured-interview';
import { StreamingInterview } from './streaming/streaming-interview';

// Pre-interview screens slide left
const slideVariants = {
  enter: { opacity: 0, x: 40 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
};

// connecting → interview: crossfade with scale
const crossfadeVariants = {
  enter: { opacity: 0, scale: 0.98 },
  center: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 1.02 },
};

export function InterviewShell() {
  const {
    currentScreen,
    setCurrentScreen,
    study,
    distribution,
    isResuming,
    isPaused,
  } = useInterview();

  const handleInterviewComplete = () => {
    setCurrentScreen('thank-you');
  };

  // Determine which transition variant to use
  const isInterviewTransition =
    currentScreen === 'connecting' || currentScreen === 'interview';
  const variants = isInterviewTransition ? crossfadeVariants : slideVariants;
  const transition = isInterviewTransition
    ? { duration: 0.5, ease: 'easeInOut' as const }
    : { duration: 0.3, ease: 'easeInOut' as const };

  return (
    <div className="min-h-[100dvh] relative overflow-hidden bg-neutral-950">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentScreen}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={transition}
          className="min-h-[100dvh]"
        >
          {currentScreen === 'welcome' && (
            <WelcomeScreen
              onContinue={() => {
                if (isResuming) {
                  // Skip onboarding for resuming users
                  setCurrentScreen('device-setup');
                } else {
                  setCurrentScreen('onboarding');
                }
              }}
            />
          )}

          {currentScreen === 'onboarding' && (
            <OnboardingScreen
              onContinue={() => setCurrentScreen('device-setup')}
              onBack={() => setCurrentScreen('welcome')}
              studyType={study.study_type === 'streaming' ? 'streaming' : 'structured'}
              interviewMode={study.interview_mode}
            />
          )}

          {currentScreen === 'device-setup' && (
            <DeviceSetupScreen
              onContinue={() => setCurrentScreen('connecting')}
            />
          )}

          {currentScreen === 'connecting' && (
            <ConnectingScreen
              onReady={() => setCurrentScreen('interview')}
            />
          )}

          {currentScreen === 'interview' && (
            study.study_type === 'streaming' ? (
              <StreamingInterview onComplete={handleInterviewComplete} />
            ) : (
              <StructuredInterview onComplete={handleInterviewComplete} />
            )
          )}

          {currentScreen === 'thank-you' && (
            <ThankYouScreen
              redirectUrl={distribution?.redirect_completion_url}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Pause overlay — rendered on top, not as a screen swap */}
      {isPaused && currentScreen === 'interview' && (
        <PauseScreen onResume={() => {/* handled by context */}} />
      )}
    </div>
  );
}
