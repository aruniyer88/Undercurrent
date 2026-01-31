"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { WizardStep } from "./wizard-types";

interface WizardStepItemProps {
  step: WizardStep;
  isCurrent: boolean;
  onClick: () => void;
}

export function WizardStepItem({
  step,
  isCurrent,
  onClick,
}: WizardStepItemProps) {
  const isClickable = step.isComplete || isCurrent;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!isClickable}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left",
        isCurrent && "bg-primary-50 border border-primary-200",
        !isCurrent && step.isComplete && "hover:bg-surface-alt cursor-pointer",
        !isCurrent && !step.isComplete && "opacity-50 cursor-not-allowed"
      )}
    >
      {/* Step indicator circle */}
      <div
        className={cn(
          "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-caption font-medium transition-colors",
          step.isComplete && !isCurrent && "bg-success-100 text-success-700",
          isCurrent && "bg-primary-600 text-white",
          !step.isComplete && !isCurrent && "bg-surface-alt text-text-muted border border-border-subtle"
        )}
      >
        {step.isComplete && !isCurrent ? (
          <Check className="w-4 h-4" />
        ) : (
          step.id
        )}
      </div>

      {/* Step title */}
      <span
        className={cn(
          "text-body transition-colors",
          isCurrent && "text-primary-700 font-medium",
          step.isComplete && !isCurrent && "text-text-primary",
          !step.isComplete && !isCurrent && "text-text-muted"
        )}
      >
        {step.title}
      </span>
    </button>
  );
}
