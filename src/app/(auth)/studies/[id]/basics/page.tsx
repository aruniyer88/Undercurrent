"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, X } from "lucide-react";
import { ProjectBasicsStep, ProjectBasicsFormData } from "@/components/features/project-basics-step";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { Study } from "@/lib/types/database";

interface StudyBasicsPageProps {
  params: { id: string };
}

export default function StudyBasicsPage({ params }: StudyBasicsPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [study, setStudy] = useState<Study | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const studyId = params.id;

  // Fetch study data
  useEffect(() => {
    if (!studyId) return;

    const fetchStudy = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("studies")
        .select("*")
        .eq("id", studyId)
        .single();

      if (error || !data) {
        toast({
          title: "Study not found",
          description: "The study you're looking for doesn't exist.",
          variant: "destructive",
        });
        router.push("/dashboard");
        return;
      }

      setStudy(data as Study);
      setIsLoading(false);
    };

    fetchStudy();
  }, [studyId, router, toast]);

  // Handle Next - save and continue to flow builder
  const handleNext = async (data: ProjectBasicsFormData) => {
    if (!studyId) return;

    setIsSaving(true);
    try {
      const supabase = createClient();

      const { error: updateError } = await supabase
        .from("studies")
        .update({
          title: data.projectName,
          objective: data.objectiveContext,
          audience: data.aboutAudience,
          about_interviewer: data.aboutInterviewer,
          language: data.language,
        })
        .eq("id", studyId);

      if (updateError) throw updateError;

      toast({
        title: "Project updated",
        description: "Your changes have been saved. Continuing to flow builder...",
      });

      router.push(`/studies/${studyId}/flow`);
    } catch (error) {
      console.error("Error updating study:", error);
      toast({
        title: "Error updating study",
        description: error instanceof Error ? error.message : "Failed to update study. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Save Draft - save and go to dashboard with full page reload
  const handleSaveDraft = async (data: ProjectBasicsFormData) => {
    if (!studyId) return;

    setIsSaving(true);
    try {
      const supabase = createClient();

      const { error: updateError } = await supabase
        .from("studies")
        .update({
          title: data.projectName || "Untitled Study",
          objective: data.objectiveContext || null,
          audience: data.aboutAudience || null,
          about_interviewer: data.aboutInterviewer || null,
          language: data.language || "English",
        })
        .eq("id", studyId);

      if (updateError) throw updateError;

      toast({
        title: "Draft saved",
        description: "Your changes have been saved.",
      });

      // Use window.location for full page reload to ensure dashboard gets fresh data
      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Error saving draft:", error);
      toast({
        title: "Error saving draft",
        description: error instanceof Error ? error.message : "Failed to save draft. Please try again.",
        variant: "destructive",
      });
      setIsSaving(false);
    }
  };

  // Handle close button - go to dashboard with full page reload
  const handleClose = () => {
    window.location.href = "/dashboard";
  };

  if (isLoading || !study) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="text-text-muted">Loading...</div>
      </div>
    );
  }

  // Map study data to form data
  const initialData: Partial<ProjectBasicsFormData> = {
    projectName: study.title || "",
    aboutInterviewer: study.about_interviewer || "",
    aboutAudience: study.audience || "",
    objectiveContext: study.objective || "",
    language: (study.language as ProjectBasicsFormData["language"]) || "English",
  };

  return (
    <div className="min-h-screen bg-canvas">
      {/* Close button */}
      <button
        type="button"
        onClick={handleClose}
        className="fixed right-8 top-8 z-50 h-9 w-9 rounded-md flex items-center justify-center text-text-primary hover:bg-surface-alt hover:text-icon-strong transition-colors focus:outline-none focus:ring-2 focus:ring-primary-border"
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="min-h-screen flex items-center justify-center px-6 py-12">
        <div className="max-w-2xl mx-auto w-full">
          <div className="space-y-2 mb-8">
            <button
              type="button"
              onClick={() => router.push(`/studies/${studyId}/flow`)}
              className="flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-body">Back to Flow Builder</span>
            </button>
            <h1 className="text-h1 text-text-primary">Project Basics</h1>
            <p className="text-body text-text-muted">
              Edit the basic information about your research project.
            </p>
          </div>
          <div className="bg-surface rounded-xl border border-border-subtle p-6">
            <ProjectBasicsStep
              initialData={initialData}
              onNext={handleNext}
              onSaveDraft={handleSaveDraft}
              isSaving={isSaving}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
