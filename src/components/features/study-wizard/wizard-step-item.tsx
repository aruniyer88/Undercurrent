"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { WizardStep } from "./wizard-types";

interface WizardStepItemProps {
  step: WizardStep;
  isCurrent: boolean;
  onClick: () => void;
  isReadOnly?: boolean;
}

export function WizardStepItem({
  step,
  isCurrent,
  onClick,
  isReadOnly = false,
}: WizardStepItemProps) {
  const isClickable = (step.isComplete || isCurrent) && !isReadOnly;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!isClickable}
      className={cn(
        "w-full flex items-center gap-2.5 px-4 py-2 rounded transition-all text-left relative",
        isCurrent && "bg-primary-50/40 border-l-2 border-l-primary-600",
        !isCurrent && step.isComplete && "hover:bg-surface-alt cursor-pointer",
        !isCurrent && !step.isComplete && "opacity-50 cursor-not-allowed"
      )}
    >
      {/* Step indicator circle */}
      <div
        className={cn(
          "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium transition-colors",
          step.isComplete && !isCurrent && "bg-success-100 text-success-700",
          isCurrent && "bg-primary-600 text-white",
          !step.isComplete && !isCurrent && "bg-surface-alt text-text-muted border border-border-subtle"
        )}
      >
        {step.isComplete && !isCurrent ? (
          <Check className="w-3 h-3" />
        ) : (
          step.id
        )}
      </div>

      {/* Step title */}
      <span
        className={cn(
          "text-sm transition-colors",
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
