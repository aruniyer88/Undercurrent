"use client";

import { forwardRef, useCallback, useRef, useState, useEffect } from "react";
import {
  ProjectBasicsStep,
  ProjectBasicsFormData,
  ProjectBasicsStepRef,
} from "@/components/features/project-basics-step";
import { StepRef, StepContentProps } from "../wizard-types";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useWizard } from "../wizard-context";

interface ProjectBasicsStepContentProps extends StepContentProps {
  onStudyCreated?: (studyId: string) => void;
}

export const ProjectBasicsStepContent = forwardRef<
  StepRef,
  ProjectBasicsStepContentProps
>(function ProjectBasicsStepContent(
  { studyId, onValidationChange, onStudyCreated },
  ref
) {
  const { toast } = useToast();
  const { setProjectName } = useWizard();
  const [initialData, setInitialData] = useState<Partial<ProjectBasicsFormData> | undefined>();
  const [isLoading, setIsLoading] = useState(!!studyId);
  const innerRef = useRef<ProjectBasicsStepRef | null>(null);

  // Load existing study data if editing
  useEffect(() => {
    if (!studyId) {
      setIsLoading(false);
      return;
    }

    const loadStudy = async () => {
      const supabase = createClient();
      const { data: study, error } = await supabase
        .from("studies")
        .select("title, objective, context, language, study_type, interview_mode, camera_required")
        .eq("id", studyId)
        .single();

      if (error) {
        console.error("Error loading study:", error);
        toast({
          title: "Error loading study",
          description: "Failed to load study data. Please try again.",
          variant: "destructive",
        });
      } else if (study) {
        setInitialData({
          projectName: study.title || "",
          objective: study.objective || "",
          context: study.context || "",
          language: (study.language as ProjectBasicsFormData["language"]) || "English",
          studyType: (study.study_type as ProjectBasicsFormData["studyType"]) || "structured",
          interviewMode: (study.interview_mode as ProjectBasicsFormData["interviewMode"]) || "voice",
          cameraRequired: study.camera_required || false,
        });
      }
      setIsLoading(false);
    };

    loadStudy();
  }, [studyId, toast]);

  // Handle save - create or update study
  const handleSave = useCallback(
    async (data: ProjectBasicsFormData): Promise<boolean> => {
      const supabase = createClient();

      try {
        if (studyId) {
          // Update existing study
          const { error } = await supabase
            .from("studies")
            .update({
              title: data.projectName,
              objective: data.objective,
              context: data.context,
              language: data.language,
              study_type: data.studyType,
              interview_mode: data.interviewMode,
              camera_required: data.cameraRequired,
            })
            .eq("id", studyId);

          if (error) throw error;

          // Update project name in context
          setProjectName(data.projectName);

          toast({
            title: "Study updated",
            description: "Your changes have been saved.",
          });
          return true;
        } else {
          // Create new study
          const {
            data: { user },
            error: userError,
          } = await supabase.auth.getUser();

          if (userError || !user) {
            throw new Error("You must be logged in to create a study");
          }

          const { data: newStudy, error } = await supabase
            .from("studies")
            .insert({
              user_id: user.id,
              title: data.projectName,
              status: "draft",
              objective: data.objective,
              context: data.context,
              language: data.language,
              study_type: data.studyType,
              interview_mode: data.interviewMode,
              camera_required: data.cameraRequired,
              brief_messages: [],
            })
            .select()
            .single();

          if (error) throw error;

          // Update project name in context
          setProjectName(data.projectName);

          toast({
            title: "Study created",
            description: "Your study has been created.",
          });

          if (onStudyCreated && newStudy) {
            onStudyCreated(newStudy.id);
          }
          return true;
        }
      } catch (error) {
        console.error("Error saving study:", error);
        toast({
          title: "Error saving study",
          description:
            error instanceof Error ? error.message : "Failed to save study.",
          variant: "destructive",
        });
        return false;
      }
    },
    [studyId, onStudyCreated, toast, setProjectName]
  );

  // Expose ref methods
  const setRef = useCallback(
    (node: ProjectBasicsStepRef | null) => {
      innerRef.current = node;
      if (typeof ref === "function") {
        ref(
          node
            ? {
                validate: () => node.validate(),
                getData: () => node.getData(),
                isDirty: () => node.isDirty(),
                save: () => node.save(),
              }
            : null
        );
      } else if (ref) {
        ref.current = node
          ? {
              validate: () => node.validate(),
              getData: () => node.getData(),
              isDirty: () => node.isDirty(),
              save: () => node.save(),
            }
          : null;
      }
    },
    [ref, innerRef]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <ProjectBasicsStep
      ref={setRef}
      initialData={initialData}
      embedded={true}
      onValidationChange={onValidationChange}
      onSave={handleSave}
    />
  );
});
