"use client";

import { useCallback, useRef, useEffect } from "react";
import { X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWizard } from "./wizard-context";
import { WizardFooter } from "./wizard-footer";
import { StepRef } from "./wizard-types";

// Step components will be imported here
import { ProjectBasicsStepContent } from "./steps/project-basics-step";
import { StudyFlowStepContent } from "./steps/study-flow-step";
import { VoiceSetupStepContent } from "./steps/voice-setup-step";
import { TestPreviewStepContent } from "./steps/test-preview-step";
import { ReviewLaunchStepContent } from "./steps/review-launch-step";

interface WizardContentProps {
  onUnsavedChanges: (hasChanges: boolean) => void;
}

const STEP_TITLES: Record<number, { title: string; description: string }> = {
  1: {
    title: "Project Basics",
    description: "Tell us about your research project",
  },
  2: {
    title: "Study Flow",
    description: "Design your interview questions and structure",
  },
  3: {
    title: "Voice Setup",
    description: "Configure the AI interviewer's voice",
  },
  4: {
    title: "Test & Preview",
    description: "Test your interview before launching",
  },
  5: {
    title: "Review & Launch",
    description: "Review your study and publish it",
  },
};

export function WizardContent({ onUnsavedChanges }: WizardContentProps) {
  const {
    currentStep,
    studyId,
    setStudyId,
    nextStep,
    isLoading,
    setIsLoading,
    setIsSaving,
    setCanProceed,
    closeWizard,
  } = useWizard();

  const stepRef = useRef<StepRef>(null);
  const stepInfo = STEP_TITLES[currentStep];

  // Track if step has unsaved changes
  const handleValidationChange = useCallback(
    (isValid: boolean) => {
      setCanProceed(isValid);
    },
    [setCanProceed]
  );

  // Handle study creation (from step 1)
  const handleStudyCreated = useCallback(
    (newStudyId: string) => {
      setStudyId(newStudyId);
    },
    [setStudyId]
  );

  // Handle Next button
  const handleNext = useCallback(async () => {
    if (!stepRef.current) return;

    // Validate current step
    const isValid = stepRef.current.validate();
    if (!isValid) return;

    setIsLoading(true);
    try {
      // Save current step data
      const success = await stepRef.current.save();
      if (success) {
        onUnsavedChanges(false);
        await nextStep();
      }
    } finally {
      setIsLoading(false);
    }
  }, [nextStep, setIsLoading, onUnsavedChanges]);

  // Handle Save Draft
  const handleSaveDraft = useCallback(async () => {
    if (!stepRef.current) return;

    setIsSaving(true);
    try {
      await stepRef.current.save();
      onUnsavedChanges(false);
    } finally {
      setIsSaving(false);
    }
  }, [setIsSaving, onUnsavedChanges]);

  // Handle Launch (step 5)
  const handleLaunch = useCallback(async () => {
    if (!stepRef.current) return;

    const isValid = stepRef.current.validate();
    if (!isValid) return;

    setIsLoading(true);
    try {
      const success = await stepRef.current.save();
      if (success) {
        onUnsavedChanges(false);
        closeWizard();
      }
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading, closeWizard, onUnsavedChanges]);

  // Track dirty state from step
  useEffect(() => {
    const checkDirty = () => {
      if (stepRef.current) {
        onUnsavedChanges(stepRef.current.isDirty());
      }
    };
    // Check periodically
    const interval = setInterval(checkDirty, 1000);
    return () => clearInterval(interval);
  }, [currentStep, onUnsavedChanges]);

  // Render current step content
  const renderStepContent = () => {
    const props = {
      studyId,
      onValidationChange: handleValidationChange,
      onStudyCreated: handleStudyCreated,
    };

    switch (currentStep) {
      case 1:
        return <ProjectBasicsStepContent ref={stepRef} {...props} />;
      case 2:
        return <StudyFlowStepContent ref={stepRef} {...props} />;
      case 3:
        return <VoiceSetupStepContent ref={stepRef} {...props} />;
      case 4:
        return <TestPreviewStepContent ref={stepRef} {...props} />;
      case 5:
        return <ReviewLaunchStepContent ref={stepRef} {...props} />;
      default:
        return null;
    }
  };

  // Show loading state during initial completion check
  if (isLoading && !stepRef.current) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center" style={{ backgroundColor: '#fafafa' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        <p className="text-body text-text-muted mt-4">Loading wizard...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: '#fafafa' }}>
      {/* Header - sticky */}
      <div className="sticky top-0 z-10 px-8 py-4 border-b border-border-subtle bg-surface">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-h2 text-text-primary">{stepInfo.title}</h1>
            <p className="text-body text-text-muted mt-1">{stepInfo.description}</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Generate with AI button - only for Study Flow step */}
            {currentStep === 2 && (
              <Button
                variant="outline"
                onClick={() => {
                  if (stepRef.current && 'openAIModal' in stepRef.current && stepRef.current.openAIModal) {
                    stepRef.current.openAIModal();
                  }
                }}
                className="gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Generate with AI
              </Button>
            )}
            <button
              type="button"
              onClick={closeWizard}
              className="w-8 h-8 flex items-center justify-center rounded-md bg-surface-alt text-text-secondary hover:text-text-primary hover:bg-border-subtle transition-colors shadow-sm"
              aria-label="Close wizard"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Content area - grows and scrolls naturally */}
      <div className="flex-1 px-8 py-4">
        {renderStepContent()}
      </div>

      {/* Footer - sticky at bottom */}
      <div className="sticky bottom-0 z-10">
        <WizardFooter
          onNext={handleNext}
          onSaveDraft={handleSaveDraft}
          onLaunch={handleLaunch}
        />
      </div>
    </div>
  );
}
