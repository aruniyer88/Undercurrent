"use client";

import {
  Settings,
  BarChart3,
  Lightbulb,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useWizard } from "./wizard-context";
import { WizardStepItem } from "./wizard-step-item";
import { NavSection } from "./wizard-types";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface NavSectionHeaderProps {
  section: NavSection;
  label: string;
  icon: React.ReactNode;
  isExpanded: boolean;
  isDisabled: boolean;
  disabledTooltip?: string;
  badge?: React.ReactNode;
  isActive?: boolean;
  showChevron?: boolean;
  onToggle: () => void;
  onClick: () => void;
}

function NavSectionHeader({
  label,
  icon,
  isExpanded,
  isDisabled,
  disabledTooltip,
  badge,
  isActive,
  showChevron = true,
  onToggle,
  onClick,
}: NavSectionHeaderProps) {
  const headerContent = (
    <button
      type="button"
      onClick={() => {
        if (!isDisabled) {
          onClick();
          if (showChevron && !isExpanded) {
            onToggle();
          }
        }
      }}
      disabled={isDisabled}
      className={cn(
        "w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors",
        isDisabled
          ? "opacity-50 cursor-not-allowed"
          : "hover:bg-surface-alt cursor-pointer",
        isActive && !showChevron && "bg-primary-50"
      )}
    >
      <div className="flex items-center gap-2">
        <span className={cn("text-text-muted", isDisabled && "opacity-60", isActive && !showChevron && "text-primary-600")}>
          {icon}
        </span>
        <span
          className={cn(
            "text-xs font-medium tracking-wide uppercase",
            isDisabled ? "text-text-muted" : "text-text-muted",
            isActive && !showChevron && "text-primary-700"
          )}
        >
          {label}
        </span>
        {badge}
      </div>
      {showChevron && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            if (!isDisabled) {
              onToggle();
            }
          }}
          className={cn(
            "p-0.5 rounded transition-colors",
            !isDisabled && "hover:bg-border-subtle cursor-pointer"
          )}
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-text-muted" />
          ) : (
            <ChevronRight className="w-4 h-4 text-text-muted" />
          )}
        </div>
      )}
    </button>
  );

  if (isDisabled && disabledTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{headerContent}</TooltipTrigger>
          <TooltipContent side="right">
            <p>{disabledTooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return headerContent;
}

export function WizardSidebar() {
  const {
    steps,
    currentStep,
    completedSteps,
    goToStep,
    totalSteps,
    projectName,
    studyStatus,
    activeSection,
    setActiveSection,
    expandedSections,
    toggleSectionExpanded,
  } = useWizard();

  const completedCount = completedSteps.size;
  const progressPercent = (completedCount / totalSteps) * 100;

  // Check if responses/analysis sections are accessible
  const canAccessResponses = studyStatus === "live" || studyStatus === "closed" || studyStatus === "paused";
  const canAccessAnalysis = studyStatus === "live" || studyStatus === "closed" || studyStatus === "paused";

  // Determine if setup section is read-only (closed study)
  const isSetupReadOnly = studyStatus === "closed";

  const handleSectionClick = (section: NavSection) => {
    if (section === "responses" && !canAccessResponses) return;
    if (section === "analysis" && !canAccessAnalysis) return;
    setActiveSection(section);
  };

  const handleStepClick = (stepId: number) => {
    setActiveSection("setup");
    goToStep(stepId);
  };

  return (
    <div className="flex flex-col h-full bg-surface border-r border-border-subtle">
      {/* Project Name Header */}
      <div className="h-16 px-5 flex items-center border-b border-border-subtle">
        <h2 className="text-h2 text-text-primary truncate">
          {projectName || "Untitled Project"}
        </h2>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 py-2 overflow-y-auto">
        {/* SETUP Section */}
        <div className="mb-1">
          <NavSectionHeader
            section="setup"
            label="SETUP"
            icon={<Settings className="w-4 h-4" />}
            isExpanded={expandedSections.has("setup")}
            isDisabled={false}
            badge={
              <span className="ml-1 text-xs text-text-muted">
                {completedCount}/{totalSteps}
              </span>
            }
            onToggle={() => toggleSectionExpanded("setup")}
            onClick={() => handleSectionClick("setup")}
          />
          {/* Progress bar */}
          {expandedSections.has("setup") && (
            <div className="px-4 pb-2">
              <div className="h-1 bg-surface-alt rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-600 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
          {/* Step items */}
          {expandedSections.has("setup") && (
            <div className="px-2 pb-2 space-y-0.5">
              {steps.map((step) => (
                <WizardStepItem
                  key={step.id}
                  step={step}
                  isCurrent={step.id === currentStep && activeSection === "setup"}
                  onClick={() => handleStepClick(step.id)}
                  isReadOnly={isSetupReadOnly}
                />
              ))}
            </div>
          )}
        </div>

        {/* RESPONSES Section */}
        <div className="mb-1">
          <NavSectionHeader
            section="responses"
            label="RESPONSES"
            icon={<BarChart3 className="w-4 h-4" />}
            isExpanded={false}
            isDisabled={!canAccessResponses}
            disabledTooltip="Launch study to collect responses"
            isActive={activeSection === "responses"}
            showChevron={false}
            onToggle={() => {}}
            onClick={() => handleSectionClick("responses")}
          />
        </div>

        {/* ANALYSIS Section */}
        <div className="mb-1">
          <NavSectionHeader
            section="analysis"
            label="ANALYSIS"
            icon={<Lightbulb className="w-4 h-4" />}
            isExpanded={false}
            isDisabled={!canAccessAnalysis}
            disabledTooltip="Launch study to access analysis"
            isActive={activeSection === "analysis"}
            showChevron={false}
            onToggle={() => {}}
            onClick={() => handleSectionClick("analysis")}
          />
        </div>
      </nav>
    </div>
  );
}
