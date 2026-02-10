"use client";

import { useCallback, useRef, useEffect } from "react";
import { X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWizard } from "./wizard-context";
import { WizardFooter } from "./wizard-footer";
import { StepRef } from "./wizard-types";
import { useToast } from "@/hooks/use-toast";

// Step components will be imported here
import { ProjectBasicsStepContent } from "./steps/project-basics-step";
import { StudyFlowStepContent } from "./steps/study-flow-step";
import { VoiceSetupStepContent } from "./steps/voice-setup-step";
import { TestPreviewStepContent } from "./steps/test-preview-step";
import { DistributionStepContent } from "./steps/distribution-step";

// Section components
import { ResponsesSection, AnalysisSection } from "./sections";

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
    title: "Distribution",
    description: "Configure and share your study link",
  },
};

const SECTION_TITLES: Record<string, { title: string; description: string }> = {
  responses: {
    title: "Responses",
    description: "View and manage interview responses",
  },
  analysis: {
    title: "Analysis",
    description: "AI-powered insights from your research",
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
    activeSection,
    studyStatus,
  } = useWizard();
  const { toast } = useToast();

  const stepRef = useRef<StepRef>(null);
  const stepInfo = STEP_TITLES[currentStep];
  const sectionInfo = SECTION_TITLES[activeSection];

  // Determine what header to show based on active section
  const headerInfo = activeSection === "setup" ? stepInfo : sectionInfo;

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

  // Generate or refresh AI persona after Step 1 or Step 2 changes
  const generatePersonaIfNeeded = useCallback(async () => {
    if (!studyId) return;

    try {
      // Check if persona needs (re)generation
      const supabase = (await import("@/lib/supabase/client")).createClient();
      const { data: study } = await supabase
        .from("studies")
        .select("ai_persona_generated_at, updated_at")
        .eq("id", studyId)
        .single();

      if (!study) return;

      // Persona is stale if: never generated, or study was updated after generation
      const isStale = !study.ai_persona_generated_at ||
        new Date(study.updated_at) > new Date(study.ai_persona_generated_at);

      if (isStale) {
        // Fire-and-forget — don't block the wizard navigation
        fetch("/api/ai/generate-persona", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ study_id: studyId }),
        }).then((res) => {
          if (!res.ok) {
            toast({
              title: "AI persona generation failed",
              description: "The interview will still work, but the AI personality may be generic. You can retry by saving Step 1 again.",
              variant: "destructive",
            });
          }
        }).catch(() => {
          toast({
            title: "AI persona generation failed",
            description: "The interview will still work, but the AI personality may be generic. You can retry by saving Step 1 again.",
            variant: "destructive",
          });
        });
      }
    } catch (err) {
      console.error("Error checking persona staleness:", err);
    }
  }, [studyId]);

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

        // Trigger persona generation after Step 1 or Step 2 saves
        // (these steps affect the inputs used to generate the persona)
        if (currentStep === 1 || currentStep === 2) {
          generatePersonaIfNeeded();
        }

        await nextStep();
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentStep, nextStep, setIsLoading, onUnsavedChanges, generatePersonaIfNeeded]);

  // Handle Save Draft
  const handleSaveDraft = useCallback(async () => {
    if (!stepRef.current) return;

    setIsSaving(true);
    try {
      const success = await stepRef.current.save();
      if (success) {
        onUnsavedChanges(false);

        // Refresh persona if basics or flow changed
        if (currentStep === 1 || currentStep === 2) {
          generatePersonaIfNeeded();
        }
      }
    } finally {
      setIsSaving(false);
    }
  }, [currentStep, setIsSaving, onUnsavedChanges, generatePersonaIfNeeded]);

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
      }
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading, onUnsavedChanges]);

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
        return <DistributionStepContent ref={stepRef} {...props} />;
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

  // Render section content based on active section
  const renderSectionContent = () => {
    switch (activeSection) {
      case "responses":
        return <ResponsesSection />;
      case "analysis":
        return <AnalysisSection />;
      case "setup":
      default:
        return renderStepContent();
    }
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: '#fafafa' }}>
      {/* Header - sticky */}
      <div className="sticky top-0 z-10 h-16 px-8 flex items-center border-b border-border-subtle bg-surface">
        <div className="flex-1 flex items-center justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-h3 text-text-primary">{headerInfo?.title}</h2>
            <p className="text-sm text-text-muted mt-0.5">{headerInfo?.description}</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Generate with AI button - only for Study Flow step in setup section */}
            {activeSection === "setup" && currentStep === 2 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (stepRef.current && 'openAIModal' in stepRef.current) {
                    const ref = stepRef.current as StepRef & { openAIModal?: () => void };
                    ref.openAIModal?.();
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
        {renderSectionContent()}
      </div>

      {/* Footer - sticky at bottom, only show for setup section. Hide on step 5 when study is already live/closed/paused */}
      {activeSection === "setup" && !(currentStep === 5 && (studyStatus === "live" || studyStatus === "closed" || studyStatus === "paused")) && (
        <div className="sticky bottom-0 z-10">
          <WizardFooter
            onNext={handleNext}
            onSaveDraft={handleSaveDraft}
            onLaunch={handleLaunch}
          />
        </div>
      )}
    </div>
  );
}
