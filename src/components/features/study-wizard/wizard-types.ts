// Types for the Study Creation Wizard

export interface WizardStep {
  id: number;
  title: string;
  description: string;
  isComplete: boolean;
  isAccessible: boolean;
}

export const WIZARD_STEPS: Omit<WizardStep, "isComplete" | "isAccessible">[] = [
  {
    id: 1,
    title: "Project Info",
    description: "Basic project details",
  },
  {
    id: 2,
    title: "Study Flow",
    description: "Questions and sections",
  },
  {
    id: 3,
    title: "Voice Setup",
    description: "AI voice configuration",
  },
  {
    id: 4,
    title: "Test & Preview",
    description: "Test your interview",
  },
  {
    id: 5,
    title: "Distribution",
    description: "Share your study",
  },
];

// Navigation sections
export type NavSection = "setup" | "responses" | "analysis";

export type StudyStatus = "draft" | "live" | "closed" | "paused";

export interface NavSectionConfig {
  id: NavSection;
  label: string;
  icon: string;
}

export const NAV_SECTIONS: NavSectionConfig[] = [
  { id: "setup", label: "SETUP", icon: "settings" },
  { id: "responses", label: "RESPONSES", icon: "chart" },
  { id: "analysis", label: "ANALYSIS", icon: "analytics" },
];

export interface WizardContextValue {
  // Step management
  currentStep: number;
  steps: WizardStep[];
  totalSteps: number;
  completedSteps: Set<number>;
  goToStep: (step: number) => void;
  nextStep: () => Promise<boolean>;
  prevStep: () => void;
  markStepComplete: (step: number) => void;
  markStepIncomplete: (step: number) => void;

  // Study data
  studyId: string | null;
  setStudyId: (id: string) => void;
  projectName: string;
  setProjectName: (name: string) => void;
  studyStatus: StudyStatus;
  setStudyStatus: (status: StudyStatus) => void;

  // Navigation sections
  activeSection: NavSection;
  setActiveSection: (section: NavSection) => void;
  expandedSections: Set<NavSection>;
  toggleSectionExpanded: (section: NavSection) => void;

  // UI state
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  isSaving: boolean;
  setIsSaving: (saving: boolean) => void;

  // Actions
  closeWizard: () => void;

  // Step validation
  canProceed: boolean;
  setCanProceed: (canProceed: boolean) => void;
}

// Imperative handle for step components
export interface StepRef {
  validate: () => boolean;
  getData: () => unknown;
  isDirty: () => boolean;
  save: () => Promise<boolean>;
}

// Props for step wrapper components
export interface StepContentProps {
  studyId: string | null;
  onValidationChange: (isValid: boolean) => void;
  onStudyCreated?: (studyId: string) => void;
}

// Study data types (for Review step summary)
export interface StudySummary {
  // Project Basics
  projectName: string;
  objective: string;
  context: string;
  language: string;

  // Study Flow
  welcomeMessage: string;
  sectionCount: number;
  questionCount: number;

  // Voice Setup
  voiceName: string | null;
  voiceType: "preset" | "cloned" | null;

  // Test status
  hasCompletedTest: boolean;
}

// Wizard dialog props
export interface StudyCreationWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studyId?: string; // For editing existing draft
  initialStep?: number; // Starting step (1-5)
}
