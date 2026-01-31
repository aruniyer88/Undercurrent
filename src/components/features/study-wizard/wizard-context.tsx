"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  ReactNode,
  useEffect,
} from "react";
import {
  WizardContextValue,
  WizardStep,
  WIZARD_STEPS,
} from "./wizard-types";
import { createClient } from "@/lib/supabase/client";

const WizardContext = createContext<WizardContextValue | null>(null);

export function useWizard(): WizardContextValue {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error("useWizard must be used within a WizardProvider");
  }
  return context;
}

interface WizardProviderProps {
  children: ReactNode;
  initialStudyId?: string | null;
  initialStep?: number;
  onClose: () => void;
}

export function WizardProvider({
  children,
  initialStudyId = null,
  initialStep = 1,
  onClose,
}: WizardProviderProps) {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [studyId, setStudyId] = useState<string | null>(initialStudyId);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(() => {
    // If editing existing study with explicit step, mark previous steps as complete
    if (initialStudyId && initialStep > 1) {
      const completed = new Set<number>();
      for (let i = 1; i < initialStep; i++) {
        completed.add(i);
      }
      return completed;
    }
    return new Set<number>();
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [canProceed, setCanProceed] = useState(false);
  const [hasCheckedCompletion, setHasCheckedCompletion] = useState(false);

  const totalSteps = WIZARD_STEPS.length;

  // Check which steps are complete based on database data
  useEffect(() => {
    // Only check once when component mounts with a studyId
    // Don't check if initialStep was explicitly provided (> 1)
    if (!initialStudyId || hasCheckedCompletion || initialStep > 1) {
      return;
    }

    const checkCompletion = async () => {
      const supabase = createClient();
      setIsLoading(true);

      try {
        // Fetch study with all related data
        const { data: study, error } = await supabase
          .from("studies")
          .select("*, study_flows(*)")
          .eq("id", initialStudyId)
          .single();

        if (error) throw error;

        const completed = new Set<number>();
        let firstIncompleteStep = 1;

        // Step 1: Project Info - Check for required fields
        const hasProjectInfo = !!(
          study.title &&
          study.about_interviewer &&
          study.audience &&
          study.objective
        );

        if (hasProjectInfo) {
          completed.add(1);
          firstIncompleteStep = 2;
        } else {
          firstIncompleteStep = 1;
          setCompletedSteps(completed);
          setCurrentStep(firstIncompleteStep);
          setHasCheckedCompletion(true);
          setIsLoading(false);
          return;
        }

        // Step 2: Study Flow - Check if study_flows exists
        // Note: study_flows comes back as array from the select query
        const hasStudyFlow = Array.isArray(study.study_flows)
          ? study.study_flows.length > 0
          : !!study.study_flows;

        if (hasStudyFlow) {
          completed.add(2);
          firstIncompleteStep = 3;
        } else {
          firstIncompleteStep = 2;
          setCompletedSteps(completed);
          setCurrentStep(firstIncompleteStep);
          setHasCheckedCompletion(true);
          setIsLoading(false);
          return;
        }

        // Step 3: Voice Setup - Check for voice_profile_id
        const hasVoiceSetup = !!study.voice_profile_id;

        if (hasVoiceSetup) {
          completed.add(3);
          firstIncompleteStep = 4;
        } else {
          firstIncompleteStep = 3;
          setCompletedSteps(completed);
          setCurrentStep(firstIncompleteStep);
          setHasCheckedCompletion(true);
          setIsLoading(false);
          return;
        }

        // Step 4: Test & Preview - Check if tested
        const hasTested = study.status === "tested" || study.status === "ready_for_test" || study.status === "live";

        if (hasTested) {
          completed.add(4);
          firstIncompleteStep = 5;
        } else {
          firstIncompleteStep = 4;
          setCompletedSteps(completed);
          setCurrentStep(firstIncompleteStep);
          setHasCheckedCompletion(true);
          setIsLoading(false);
          return;
        }

        // Step 5: Review & Launch - Check if live
        const isLive = study.status === "live";

        if (isLive) {
          completed.add(5);
          firstIncompleteStep = 5; // Stay on review page if already launched
        }

        // Update state with all completed steps
        setCompletedSteps(completed);
        setCurrentStep(firstIncompleteStep);
        setHasCheckedCompletion(true);
      } catch (error) {
        console.error("Error checking step completion:", error);
        // On error, default to step 1
        setCurrentStep(1);
        setCompletedSteps(new Set());
        setHasCheckedCompletion(true);
      } finally {
        setIsLoading(false);
      }
    };

    checkCompletion();
  }, [initialStudyId, initialStep, hasCheckedCompletion]);

  // Build steps with completion and accessibility status
  const steps: WizardStep[] = useMemo(() => {
    return WIZARD_STEPS.map((step) => ({
      ...step,
      isComplete: completedSteps.has(step.id),
      isAccessible:
        completedSteps.has(step.id) || // Can access completed steps
        step.id === currentStep || // Can access current step
        (step.id === currentStep + 1 && canProceed), // Can access next if current is valid
    }));
  }, [completedSteps, currentStep, canProceed]);

  const markStepComplete = useCallback((step: number) => {
    setCompletedSteps((prev) => new Set([...Array.from(prev), step]));
  }, []);

  const markStepIncomplete = useCallback((step: number) => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      next.delete(step);
      return next;
    });
  }, []);

  const goToStep = useCallback(
    (step: number) => {
      // Can only go to completed steps or current step
      if (completedSteps.has(step) || step === currentStep) {
        setCurrentStep(step);
        setCanProceed(false); // Reset validation when changing steps
      }
    },
    [completedSteps, currentStep]
  );

  const nextStep = useCallback(async (): Promise<boolean> => {
    if (currentStep < totalSteps) {
      // Mark current step as complete
      markStepComplete(currentStep);
      setCurrentStep((prev) => prev + 1);
      setCanProceed(false); // Reset validation for next step
      return true;
    }
    return false;
  }, [currentStep, totalSteps, markStepComplete]);

  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      // Previous steps should already be complete
    }
  }, [currentStep]);

  const closeWizard = useCallback(() => {
    onClose();
  }, [onClose]);

  const value: WizardContextValue = useMemo(
    () => ({
      currentStep,
      steps,
      totalSteps,
      completedSteps,
      goToStep,
      nextStep,
      prevStep,
      markStepComplete,
      markStepIncomplete,
      studyId,
      setStudyId,
      isLoading,
      setIsLoading,
      isSaving,
      setIsSaving,
      closeWizard,
      canProceed,
      setCanProceed,
    }),
    [
      currentStep,
      steps,
      totalSteps,
      completedSteps,
      goToStep,
      nextStep,
      prevStep,
      markStepComplete,
      markStepIncomplete,
      studyId,
      isLoading,
      isSaving,
      closeWizard,
      canProceed,
    ]
  );

  return (
    <WizardContext.Provider value={value}>{children}</WizardContext.Provider>
  );
}
