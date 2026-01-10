"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Study, InterviewGuide } from "@/lib/types/database";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  ArrowLeft, 
  Play, 
  SkipForward,
  X,
  Mic,
  MicOff,
  Volume2,
  CheckCircle2,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface TestInterviewProps {
  study: Study;
  guide: InterviewGuide;
}

type InterviewState = "idle" | "playing" | "listening" | "processing";

export function TestInterview({ study, guide }: TestInterviewProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  const [isStarted, setIsStarted] = useState(false);
  const [state, setState] = useState<InterviewState>("idle");
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

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

  // Simulate interview flow
  useEffect(() => {
    if (!isStarted || !currentQuestion) return;

    // Simulate AI asking question
    setState("playing");
    const playTimer = setTimeout(() => {
      setState("listening");
    }, 3000);

    return () => clearTimeout(playTimer);
  }, [isStarted, currentSectionIndex, currentQuestionIndex, currentQuestion]);

  const handleStart = () => {
    setIsStarted(true);
  };

  const handleToggleRecording = () => {
    if (state === "listening") {
      setState("processing");
      // Simulate processing
      setTimeout(() => {
        if (isLastQuestion) {
          setShowApproveDialog(true);
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
    setState("idle");
  };

  const handleSkip = () => {
    handleNextQuestion();
  };

  const handleExit = () => {
    setShowExitDialog(false);
    router.push(`/studies/${study.id}/voice`);
  };

  const handleApprove = async () => {
    setIsApproving(true);
    
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("studies")
        .update({ status: "tested" })
        .eq("id", study.id);

      if (error) throw error;

      toast({
        title: "Test completed!",
        description: "Your study is ready to publish.",
      });
      
      router.push(`/studies/${study.id}/publish`);
    } catch {
      toast({
        title: "Error",
        description: "Failed to update study status.",
        variant: "destructive",
      });
    } finally {
      setIsApproving(false);
      setShowApproveDialog(false);
    }
  };

  if (!isStarted) {
    return (
      <div className="min-h-screen bg-neutral-900 text-white flex flex-col">
        {/* Header */}
        <div className="p-6 flex items-center justify-between">
          <Link href={`/studies/${study.id}/voice`}>
            <Button variant="ghost" className="text-white hover:bg-white/10">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Voice Setup
            </Button>
          </Link>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-warning-500/20 text-warning-400 text-sm">
            <AlertTriangle className="w-4 h-4" />
            Test Mode
          </div>
        </div>

        {/* Start Screen */}
        <div className="flex-1 flex items-center justify-center">
          <div className="max-w-lg text-center px-6">
            <div className="w-20 h-20 rounded-full bg-primary-500/20 flex items-center justify-center mx-auto mb-6">
              <Play className="w-10 h-10 text-primary-400" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Test Your Interview</h1>
            <p className="text-lg text-neutral-400 mb-8">
              Experience the interview as a participant would. 
              Test the questions, voice, and flow before going live.
            </p>
            
            <div className="bg-white/5 rounded-xl p-6 mb-8 text-left">
              <h3 className="font-medium mb-3">What to expect:</h3>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-primary-400" />
                  The AI will ask questions using your selected voice
                </li>
                <li className="flex items-center gap-2">
                  <Mic className="w-4 h-4 text-primary-400" />
                  You can respond (or skip) to test the flow
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary-400" />
                  {totalQuestions} questions across {sections.length} sections
                </li>
              </ul>
            </div>
            
            <Button 
              size="lg" 
              onClick={handleStart}
              className="bg-primary-600 hover:bg-primary-700 h-14 px-8 text-lg"
            >
              Start Test Interview
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-white flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-white/10">
        <Button 
          variant="ghost" 
          className="text-white hover:bg-white/10"
          onClick={() => setShowExitDialog(true)}
        >
          <X className="w-4 h-4 mr-2" />
          Exit Test
        </Button>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-neutral-400">
            Question {currentQuestionNumber} of {totalQuestions}
          </span>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-warning-500/20 text-warning-400 text-sm">
            <AlertTriangle className="w-4 h-4" />
            Test Mode
          </div>
        </div>
        
        <Button 
          variant="ghost" 
          className="text-white hover:bg-white/10"
          onClick={handleSkip}
          disabled={state === "processing"}
        >
          <SkipForward className="w-4 h-4 mr-2" />
          Skip
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="h-1 bg-white/10">
        <div 
          className="h-full bg-primary-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="max-w-2xl w-full text-center">
          {/* Section Label */}
          <p className="text-sm text-primary-400 mb-4">
            {currentSection?.title}
          </p>
          
          {/* Question */}
          <h2 className="text-2xl md:text-3xl font-medium mb-12 leading-relaxed">
            {currentQuestion?.text}
          </h2>

          {/* State Indicators */}
          <div className="flex justify-center mb-8">
            {state === "playing" && (
              <div className="flex items-center gap-3 text-primary-400">
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
                <span className="text-sm">AI is speaking...</span>
              </div>
            )}
            
            {state === "processing" && (
              <div className="flex items-center gap-2 text-neutral-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Processing response...</span>
              </div>
            )}
          </div>

          {/* Recording Button */}
          <div className="flex flex-col items-center">
            <button
              onClick={handleToggleRecording}
              disabled={state === "playing" || state === "processing"}
              className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center transition-all",
                state === "listening" 
                  ? "bg-error-500 animate-pulse scale-110"
                  : "bg-white/10 hover:bg-white/20",
                (state === "playing" || state === "processing") && "opacity-50 cursor-not-allowed"
              )}
            >
              {state === "listening" ? (
                <MicOff className="w-8 h-8" />
              ) : (
                <Mic className="w-8 h-8" />
              )}
            </button>
            <p className="text-sm text-neutral-400 mt-4">
              {state === "listening" 
                ? "Click to stop recording" 
                : state === "playing"
                  ? "Wait for the question to finish"
                  : "Click to respond"}
            </p>
          </div>

          {/* Probes */}
          {currentQuestion?.probes && currentQuestion.probes.length > 0 && (
            <div className="mt-12 text-left">
              <p className="text-xs text-neutral-500 mb-2">Follow-up probes:</p>
              <ul className="space-y-1">
                {currentQuestion.probes.map((probe, index) => (
                  <li key={index} className="text-sm text-neutral-400">
                    → {probe}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Exit Dialog */}
      <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exit Test Interview?</DialogTitle>
            <DialogDescription>
              Your progress will not be saved. You can restart the test at any time.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExitDialog(false)}>
              Continue Test
            </Button>
            <Button onClick={handleExit} variant="destructive">
              Exit Test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test Complete!</DialogTitle>
            <DialogDescription>
              You&apos;ve completed the test interview. If everything looks good, 
              approve to proceed to publishing your study.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center gap-3 p-4 bg-success-50 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-success-600" />
              <div>
                <p className="font-medium text-success-800">Ready to publish</p>
                <p className="text-sm text-success-600">
                  {totalQuestions} questions tested successfully
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowApproveDialog(false);
                setCurrentSectionIndex(0);
                setCurrentQuestionIndex(0);
                setIsStarted(false);
              }}
            >
              Restart Test
            </Button>
            <Button 
              onClick={handleApprove}
              className="bg-primary-600 hover:bg-primary-700"
              disabled={isApproving}
            >
              {isApproving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              Approve & Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

