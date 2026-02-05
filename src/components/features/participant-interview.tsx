"use client";

import { useState, useEffect, useRef } from "react";
import { Study, InterviewGuide } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Mic,
  MicOff,
  Volume2,
  CheckCircle2,
  Loader2,
  Waves,
  ArrowRight,
  Video,
  VideoOff
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ParticipantInterviewProps {
  study: Study;
  guide: InterviewGuide;
  token: string;
}

type Step = "intro" | "consent" | "device-check" | "interview" | "complete";
type InterviewState = "idle" | "playing" | "listening" | "processing";

export function ParticipantInterview({ study, guide }: ParticipantInterviewProps) {
  const [step, setStep] = useState<Step>("intro");
  const [participantName, setParticipantName] = useState("");
  const [consentGiven, setConsentGiven] = useState(false);
  const [deviceReady, setDeviceReady] = useState(false);
  const [isCheckingDevice, setIsCheckingDevice] = useState(false);
  const [deviceError, setDeviceError] = useState<string | null>(null);

  // Interview state
  const [interviewState, setInterviewState] = useState<InterviewState>("idle");
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Video state
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const sections = guide.sections || [];
  const currentSection = sections[currentSectionIndex];
  const currentQuestion = currentSection?.questions[currentQuestionIndex];
  
  const totalQuestions = sections.reduce((acc, s) => acc + s.questions.length, 0);
  const currentQuestionNumber = sections
    .slice(0, currentSectionIndex)
    .reduce((acc, s) => acc + s.questions.length, 0) + currentQuestionIndex + 1;

  const progress = (currentQuestionNumber / totalQuestions) * 100;
  const isLastQuestion = 
    currentSectionIndex === sections.length - 1 && 
    currentQuestionIndex === currentSection?.questions.length - 1;

  // Check microphone and camera permissions based on interview mode
  const checkDevice = async () => {
    setIsCheckingDevice(true);
    setDeviceError(null);

    const isVideoMode = study.interview_mode === 'video';
    const constraints: MediaStreamConstraints = {
      audio: true,
      ...(isVideoMode && { video: true })
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      stream.getTracks().forEach(track => track.stop());
      setDeviceReady(true);
    } catch (error) {
      console.error("Device access denied:", error);
      setDeviceReady(false);

      // Set appropriate error message
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          if (isVideoMode) {
            setDeviceError(study.camera_required
              ? "Camera and microphone access is required for this interview."
              : "Microphone access is required. Camera is optional but recommended.");
          } else {
            setDeviceError("Microphone access is required for this interview.");
          }
        } else if (error.name === 'NotFoundError') {
          if (isVideoMode) {
            setDeviceError("Camera or microphone not found. Please check your devices.");
          } else {
            setDeviceError("Microphone not found. Please check your device.");
          }
        } else {
          setDeviceError("Unable to access your devices. Please check your settings.");
        }
      }
    } finally {
      setIsCheckingDevice(false);
    }
  };

  // Start camera for video interviews
  useEffect(() => {
    if (step === "interview" && study.interview_mode === 'video') {
      startCamera();
    }

    return () => {
      // Cleanup camera stream when leaving interview
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Update video element when stream changes
  useEffect(() => {
    if (videoRef.current && videoStream) {
      videoRef.current.srcObject = videoStream;
    }
  }, [videoStream]);

  // Auto-play question when interview starts
  useEffect(() => {
    if (step !== "interview" || !currentQuestion) return;

    setInterviewState("playing");
    const timer = setTimeout(() => {
      setInterviewState("listening");
    }, 3000);

    return () => clearTimeout(timer);
  }, [step, currentSectionIndex, currentQuestionIndex, currentQuestion]);

  const startCamera = async () => {
    try {
      const constraints = {
        audio: true,
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setVideoStream(stream);
    } catch (error) {
      console.error("Failed to start camera:", error);
    }
  };

  const handleToggleRecording = () => {
    if (interviewState === "listening") {
      setInterviewState("processing");
      setTimeout(() => {
        if (isLastQuestion) {
          setStep("complete");
        } else {
          handleNextQuestion();
        }
      }, 1500);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < currentSection.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else if (currentSectionIndex < sections.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);
      setCurrentQuestionIndex(0);
    }
    setInterviewState("idle");
  };

  // Intro Screen
  if (step === "intro") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: '#fafafa' }}>
        <div className="max-w-lg w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center mx-auto mb-6">
            <Waves className="w-8 h-8 text-white" />
          </div>
          
          <h1 className="text-2xl font-bold text-neutral-900 mb-4">
            {study.title}
          </h1>
          
          {study.intro_text && (
            <p className="text-neutral-600 mb-8 leading-relaxed">
              {study.intro_text}
            </p>
          )}
          
          <div className="bg-white rounded-xl border border-neutral-200 p-6 mb-8 text-left">
            <h3 className="font-medium text-neutral-900 mb-3">What to expect:</h3>
            <ul className="space-y-2 text-sm text-neutral-600">
              <li className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-primary-500" />
                An AI interviewer will ask you questions
              </li>
              <li className="flex items-center gap-2">
                {study.interview_mode === 'video' ? (
                  <Video className="w-4 h-4 text-primary-500" />
                ) : (
                  <Mic className="w-4 h-4 text-primary-500" />
                )}
                {study.interview_mode === 'video'
                  ? "You'll respond on video"
                  : "You'll respond by speaking"}
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary-500" />
                Takes about 10-15 minutes
              </li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <div>
              <Label htmlFor="name" className="sr-only">Your name (optional)</Label>
              <Input
                id="name"
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                placeholder="Your name (optional)"
                className="text-center"
              />
            </div>
            <Button 
              onClick={() => setStep("consent")}
              className="w-full h-12 bg-primary-600 hover:bg-primary-700"
            >
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Consent Screen
  if (step === "consent") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: '#fafafa' }}>
        <div className="max-w-lg w-full">
          <h1 className="text-2xl font-bold text-neutral-900 mb-6 text-center">
            Before we begin
          </h1>
          
          <div className="bg-white rounded-xl border border-neutral-200 p-6 mb-6">
            <h3 className="font-medium text-neutral-900 mb-4">Important information:</h3>
            <ul className="space-y-3 text-sm text-neutral-600">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-success-500 mt-0.5 shrink-0" />
                Your {study.interview_mode === 'video' ? 'video and audio' : 'audio'} responses will be recorded and transcribed
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
              I consent to having my {study.interview_mode === 'video' ? 'video and audio' : 'audio'} responses recorded.
            </label>
          </div>
          
          <Button 
            onClick={() => setStep("device-check")}
            disabled={!consentGiven}
            className="w-full h-12 bg-primary-600 hover:bg-primary-700"
          >
            Continue
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  // Device Check Screen
  if (step === "device-check") {
    const isVideoMode = study.interview_mode === 'video';
    const deviceLabel = isVideoMode ? "camera and microphone" : "microphone";
    const DeviceIcon = isVideoMode ? Video : Mic;

    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: '#fafafa' }}>
        <div className="max-w-lg w-full text-center">
          <div className={cn(
            "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6",
            deviceReady ? "bg-success-100" : "bg-neutral-100"
          )}>
            {deviceReady ? (
              <CheckCircle2 className="w-10 h-10 text-success-600" />
            ) : (
              <DeviceIcon className="w-10 h-10 text-neutral-400" />
            )}
          </div>

          <h1 className="text-2xl font-bold text-neutral-900 mb-4">
            {deviceReady
              ? `${isVideoMode ? "Camera and microphone" : "Microphone"} ready!`
              : `Check your ${deviceLabel}`}
          </h1>

          <p className="text-neutral-600 mb-8">
            {deviceReady
              ? `Your ${deviceLabel} ${isVideoMode ? "are" : "is"} working. You're all set to begin.`
              : `We need access to your ${deviceLabel} to record your responses.`
            }
          </p>

          {deviceError && !deviceReady && (
            <div className="bg-error-50 border border-error-200 rounded-lg p-4 mb-6 text-left">
              <div className="flex items-start gap-2">
                <VideoOff className="w-5 h-5 text-error-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-error-700">{deviceError}</p>
              </div>
            </div>
          )}

          {!deviceReady && (
            <Button
              onClick={checkDevice}
              disabled={isCheckingDevice}
              variant="outline"
              className="mb-6"
            >
              {isCheckingDevice ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <DeviceIcon className="w-4 h-4 mr-2" />
              )}
              {isCheckingDevice ? "Checking..." : `Allow ${isVideoMode ? "Camera & Microphone" : "Microphone"} Access`}
            </Button>
          )}

          <Button
            onClick={() => setStep("interview")}
            disabled={!deviceReady}
            className="w-full h-12 bg-primary-600 hover:bg-primary-700"
          >
            Start Interview
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  // Complete Screen
  if (step === "complete") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: '#fafafa' }}>
        <div className="max-w-lg w-full text-center">
          <div className="w-20 h-20 rounded-full bg-success-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-success-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-neutral-900 mb-4">
            Thank you!
          </h1>
          
          <p className="text-neutral-600 mb-8">
            Your interview has been recorded. Your responses will help improve 
            our understanding and make better decisions.
          </p>
          
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <p className="text-sm text-neutral-500">
              You can now close this page. If you have any questions, 
              please contact the person who sent you this interview.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Interview Screen
  const isVideoMode = study.interview_mode === 'video';

  return (
    <div className="min-h-screen bg-neutral-900 text-white flex flex-col relative">
      {/* Video Background (for video mode) */}
      {isVideoMode && videoStream && (
        <div className="absolute inset-0 z-0">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {/* Dark overlay for better text readability */}
          <div className="absolute inset-0 bg-black/40" />
        </div>
      )}

      {/* Content Layer */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Progress Bar */}
        <div className="h-1 bg-white/10">
          <div
            className="h-full bg-primary-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Header */}
        <div className="p-4 text-center border-b border-white/10 bg-black/30 backdrop-blur-sm">
          <p className="text-sm text-neutral-400">
            Question {currentQuestionNumber} of {totalQuestions}
          </p>
          {isVideoMode && (
            <div className="flex items-center justify-center gap-2 mt-1">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-xs text-neutral-300">Recording</span>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="max-w-2xl w-full text-center">
          {/* Section Label */}
          <p className={cn(
            "text-sm text-primary-400 mb-4",
            isVideoMode && "bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full inline-block"
          )}>
            {currentSection?.title}
          </p>

          {/* Question */}
          <h2 className={cn(
            "text-2xl md:text-3xl font-medium mb-12 leading-relaxed",
            isVideoMode && "bg-black/60 backdrop-blur-sm px-6 py-4 rounded-2xl"
          )}>
            {currentQuestion?.text}
          </h2>

          {/* State Indicators */}
          <div className="flex justify-center mb-8 h-12">
            {interviewState === "playing" && (
              <div className={cn(
                "flex items-center gap-3 text-primary-400",
                isVideoMode && "bg-black/60 backdrop-blur-sm px-6 py-3 rounded-full"
              )}>
                <div className="waveform justify-center">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <div
                      key={i}
                      className="waveform-bar animate-pulse"
                      style={{
                        height: `${Math.random() * 20 + 10}px`,
                        animationDelay: `${i * 50}ms`
                      }}
                    />
                  ))}
                </div>
                <span className="text-sm">Speaking...</span>
              </div>
            )}

            {interviewState === "processing" && (
              <div className={cn(
                "flex items-center gap-2 text-neutral-400",
                isVideoMode && "bg-black/60 backdrop-blur-sm px-6 py-3 rounded-full"
              )}>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Processing...</span>
              </div>
            )}
          </div>

          {/* Recording Button */}
          <div className="flex flex-col items-center">
            <button
              onClick={handleToggleRecording}
              disabled={interviewState === "playing" || interviewState === "processing"}
              className={cn(
                "w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-lg",
                interviewState === "listening"
                  ? "bg-error-500 animate-pulse scale-110"
                  : isVideoMode
                    ? "bg-white/20 hover:bg-white/30 backdrop-blur-sm border-2 border-white/30"
                    : "bg-white/10 hover:bg-white/20",
                (interviewState === "playing" || interviewState === "processing") && "opacity-50 cursor-not-allowed"
              )}
            >
              {interviewState === "listening" ? (
                <MicOff className="w-10 h-10" />
              ) : (
                <Mic className="w-10 h-10" />
              )}
            </button>
            <p className={cn(
              "text-sm text-neutral-400 mt-4",
              isVideoMode && "bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full"
            )}>
              {interviewState === "listening"
                ? "Tap when you're done speaking"
                : interviewState === "playing"
                  ? "Please wait..."
                  : "Tap to respond"}
            </p>
          </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 text-center border-t border-white/10 bg-black/30 backdrop-blur-sm">
          <p className="text-xs text-neutral-500">
            Powered by Undercurrent
          </p>
        </div>
      </div>
    </div>
  );
}

