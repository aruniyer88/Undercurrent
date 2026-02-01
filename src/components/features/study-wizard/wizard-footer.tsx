"use client";

import { ChevronLeft, ChevronRight, Rocket, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWizard } from "./wizard-context";

interface WizardFooterProps {
  onNext: () => Promise<void>;
  onSaveDraft: () => Promise<void>;
  onLaunch?: () => Promise<void>;
}

export function WizardFooter({ onNext, onSaveDraft, onLaunch }: WizardFooterProps) {
  const { currentStep, totalSteps, prevStep, canProceed, isLoading, isSaving } =
    useWizard();

  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === totalSteps;

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-border-subtle bg-surface">
      {/* Back button */}
      <div>
        {!isFirstStep && (
          <Button
            variant="ghost"
            size="sm"
            onClick={prevStep}
            disabled={isLoading || isSaving}
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>
        )}
      </div>

      {/* Right side buttons */}
      <div className="flex items-center gap-3">
        {/* Save Draft button (not on last step) */}
        {!isLastStep && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onSaveDraft}
            disabled={isLoading || isSaving}
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "Saving..." : "Save Draft"}
          </Button>
        )}

        {/* Next / Launch button */}
        {isLastStep ? (
          <Button
            size="sm"
            onClick={onLaunch}
            disabled={!canProceed || isLoading || isSaving}
            className="gap-2"
          >
            <Rocket className="w-4 h-4" />
            {isLoading ? "Launching..." : "Launch Study"}
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={onNext}
            disabled={!canProceed || isLoading || isSaving}
            className="gap-2"
          >
            {isLoading ? "Saving..." : "Next"}
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
