'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Mic, MousePointerClick, ArrowLeft, ArrowRight, Headphones, MicOff, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { OnboardingScreenProps } from '@/lib/types/interview';

interface Slide {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const getStructuredSlides = (isVideo: boolean): Slide[] => [
  {
    icon: <AIInterviewIcon />,
    title: 'AI-Powered Interview',
    description: "You'll be asked questions by our AI interviewer. Just listen and respond naturally.",
  },
  {
    icon: isVideo ? <CameraAndMicPermissionIcon /> : <MicPermissionIcon />,
    title: isVideo ? 'Camera & Microphone Access' : 'Microphone Access',
    description: isVideo
      ? "You'll need a working camera and microphone. We'll ask for permission on the next screen."
      : "You'll need a working microphone. We'll ask for permission on the next screen.",
  },
  {
    icon: <HowToRecordIcon />,
    title: 'How to Record',
    description: 'Click the mic button or press the spacebar to start/stop recording. You can pause anytime.',
  },
];

const getStreamingSlides = (isVideo: boolean): Slide[] => [
  {
    icon: <AIInterviewIcon />,
    title: 'AI-Powered Conversation',
    description: "You'll have a free-flowing conversation with our AI interviewer. Just speak naturally.",
  },
  {
    icon: isVideo ? <CameraAndMicPermissionIcon /> : <MicPermissionIcon />,
    title: isVideo ? 'Camera & Microphone Access' : 'Microphone Access',
    description: isVideo
      ? "You'll need a working camera and microphone. We'll ask for permission on the next screen."
      : "You'll need a working microphone. We'll ask for permission on the next screen.",
  },
  {
    icon: <MuteButtonIcon />,
    title: 'Mute When Needed',
    description: 'Use the mute button if you need a moment. The AI will wait for you to unmute.',
  },
];

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 200 : -200,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -200 : 200,
    opacity: 0,
  }),
};

export function OnboardingScreen({ onContinue, onBack, studyType = 'structured', interviewMode = 'voice' }: OnboardingScreenProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(1);

  const isVideo = interviewMode === 'video';
  const slides = studyType === 'streaming' ? getStreamingSlides(isVideo) : getStructuredSlides(isVideo);
  const isLastSlide = currentSlide === slides.length - 1;
  const isFirstSlide = currentSlide === 0;

  const goNext = useCallback(() => {
    if (isLastSlide) {
      onContinue();
    } else {
      setDirection(1);
      setCurrentSlide((prev) => prev + 1);
    }
  }, [isLastSlide, onContinue]);

  const goPrev = useCallback(() => {
    if (isFirstSlide) {
      onBack();
    } else {
      setDirection(-1);
      setCurrentSlide((prev) => prev - 1);
    }
  }, [isFirstSlide, onBack]);

  const slide = slides[currentSlide];

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-6 bg-neutral-50">
      <motion.div
        className="max-w-lg w-full bg-white rounded-2xl border border-neutral-200 shadow-xl p-8 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {/* Dot Indicators */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                i === currentSlide
                  ? 'bg-blue-700'
                  : i < currentSlide
                    ? 'bg-blue-400'
                    : 'bg-neutral-300'
              }`}
            />
          ))}
        </div>

        {/* Slide Content */}
        <div className="min-h-[320px] flex flex-col items-center justify-center">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentSlide}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="flex flex-col items-center"
            >
              {/* Animated Icon */}
              <motion.div
                className="w-32 h-32 rounded-3xl bg-primary-50 flex items-center justify-center mb-8"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.4, ease: 'easeOut' }}
              >
                {slide.icon}
              </motion.div>

              {/* Title */}
              <h2 className="text-xl font-bold text-neutral-900 mb-3">
                {slide.title}
              </h2>

              {/* Description */}
              <p className="text-neutral-600 leading-relaxed max-w-sm">
                {slide.description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <Button
            variant="ghost"
            onClick={goPrev}
            size="sm"
            className="text-neutral-500"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>

          <Button
            onClick={goNext}
            size="sm"
            className="bg-primary-600 hover:bg-primary-700"
          >
            {isLastSlide ? 'Got it' : 'Next'}
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ============================================
// ANIMATED ICON COMPONENTS
// ============================================

function AIInterviewIcon() {
  return (
    <motion.div className="relative">
      {/* AI Bot Icon with pulse animation */}
      <motion.div
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <Bot className="w-16 h-16 text-primary-500" />
      </motion.div>
      {/* Glowing effect */}
      <motion.div
        className="absolute inset-0 rounded-full bg-primary-400/20 blur-xl"
        animate={{
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </motion.div>
  );
}

function MicPermissionIcon() {
  return (
    <motion.div className="relative">
      <Mic className="w-16 h-16 text-primary-500" />
      {/* Pulsing permission rings */}
      {[0, 1].map((i) => (
        <motion.div
          key={i}
          className="absolute inset-0 rounded-full border-2 border-primary-300"
          animate={{
            scale: [1, 1.5 + i * 0.3],
            opacity: [0.6, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.5,
            ease: 'easeOut',
          }}
        />
      ))}
    </motion.div>
  );
}

function CameraAndMicPermissionIcon() {
  return (
    <motion.div className="relative">
      {/* Camera and Mic icons side by side */}
      <div className="flex items-center gap-3">
        <Video className="w-14 h-14 text-primary-500" />
        <Mic className="w-14 h-14 text-primary-500" />
      </div>
      {/* Pulsing permission rings */}
      {[0, 1].map((i) => (
        <motion.div
          key={i}
          className="absolute inset-0 -inset-x-4 rounded-full border-2 border-primary-300"
          animate={{
            scale: [1, 1.4 + i * 0.3],
            opacity: [0.6, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.5,
            ease: 'easeOut',
          }}
        />
      ))}
    </motion.div>
  );
}

function HowToRecordIcon() {
  return (
    <div className="relative">
      {/* Large circular background with mic centered */}
      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary-100 to-primary-50 border-2 border-primary-100 flex items-center justify-center">
        <Mic className="w-12 h-12 text-neutral-600" strokeWidth={2.5} />
      </div>

      {/* Pointing hand at bottom-right with pulsate animation */}
      <motion.div
        className="absolute -bottom-2 -right-2"
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.8, 1, 0.8]
        }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="bg-white rounded-full p-1.5 shadow-md">
          <MousePointerClick className="w-8 h-8 text-neutral-700" strokeWidth={2} />
        </div>
      </motion.div>
    </div>
  );
}

function MuteButtonIcon() {
  return (
    <motion.div className="relative">
      <motion.div
        animate={{ opacity: [1, 0.5, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Headphones className="w-12 h-12 text-primary-500" />
      </motion.div>
      <motion.div
        className="absolute -bottom-2 -right-2"
        animate={{ scale: [0.9, 1.1, 0.9] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <MicOff className="w-8 h-8 text-neutral-400" />
      </motion.div>
    </motion.div>
  );
}
