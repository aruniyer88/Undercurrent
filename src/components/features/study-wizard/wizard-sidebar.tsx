"use client";

import { X } from "lucide-react";
import { useWizard } from "./wizard-context";
import { WizardStepItem } from "./wizard-step-item";

export function WizardSidebar() {
  const { steps, currentStep, completedSteps, goToStep, closeWizard, totalSteps } =
    useWizard();

  const completedCount = completedSteps.size;
  const progressPercent = (completedCount / totalSteps) * 100;

  return (
    <div className="flex flex-col h-full bg-surface border-r border-border-subtle">
      {/* Header */}
      <div className="p-5 border-b border-border-subtle">
        <div className="mb-4">
          <h2 className="text-h3 text-text-primary">Project Setup Wizard</h2>
        </div>

        {/* Progress indicator */}
        <div className="space-y-2">
          <p className="text-caption text-text-muted">
            {completedCount}/{totalSteps} completed
          </p>
          <div className="h-1.5 bg-surface-alt rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-600 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Step list */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {steps.map((step) => (
          <WizardStepItem
            key={step.id}
            step={step}
            isCurrent={step.id === currentStep}
            onClick={() => goToStep(step.id)}
          />
        ))}
      </nav>
    </div>
  );
}
