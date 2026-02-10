'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useInterview } from './interview-context';
import { WelcomeScreen } from './screens/welcome-screen';
import { ConsentScreen } from './screens/consent-screen';
import { PermissionScreen } from './screens/permission-screen';
import { ThankYouScreen } from './screens/thank-you-screen';
import { StructuredInterview } from './structured/structured-interview';
import { StreamingInterview } from './streaming/streaming-interview';

const screenVariants = {
  enter: { opacity: 0, x: 40 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
};

export function InterviewShell() {
  const { currentScreen, setCurrentScreen, study, distribution } = useInterview();

  const handleInterviewComplete = () => {
    setCurrentScreen('thank-you');
  };

  return (
    <div className="min-h-[100dvh] relative overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentScreen}
          variants={screenVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="min-h-[100dvh]"
        >
          {currentScreen === 'welcome' && (
            <WelcomeScreen onContinue={() => setCurrentScreen('consent')} />
          )}

          {currentScreen === 'consent' && (
            <ConsentScreen onContinue={() => setCurrentScreen('permission')} />
          )}

          {currentScreen === 'permission' && (
            <PermissionScreen onContinue={() => setCurrentScreen('interview')} />
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
    </div>
  );
}
