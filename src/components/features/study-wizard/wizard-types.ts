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
    title: "Review & Launch",
    description: "Final review and publish",
  },
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
  aboutInterviewer: string;
  aboutAudience: string;
  objectiveContext: string;
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
