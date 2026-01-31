"use client";

import { forwardRef, useState, useEffect, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  FileText,
  Layers,
  Volume2,
  TestTube,
  Rocket,
  Copy,
  ExternalLink,
} from "lucide-react";
import { StepRef, StepContentProps, StudySummary } from "../wizard-types";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export const ReviewLaunchStepContent = forwardRef<StepRef, StepContentProps>(
  function ReviewLaunchStepContent({ studyId, onValidationChange }, ref) {
    const { toast } = useToast();
    const [summary, setSummary] = useState<StudySummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLaunching, setIsLaunching] = useState(false);
    const [isLaunched, setIsLaunched] = useState(false);
    const [publicUrl, setPublicUrl] = useState<string | null>(null);

    // Load summary data
    useEffect(() => {
      if (!studyId) {
        setIsLoading(false);
        return;
      }

      const loadSummary = async () => {
        const supabase = createClient();

        try {
          // Load study details
          const { data: study, error: studyError } = await supabase
            .from("studies")
            .select("*, voice_profiles(*)")
            .eq("id", studyId)
            .single();

          if (studyError) throw studyError;

          // Load flow data
          const { data: flow } = await supabase
            .from("study_flows")
            .select("*, flow_sections(*, flow_items(*))")
            .eq("study_id", studyId)
            .maybeSingle();

          // Count sections and questions
          let sectionCount = 0;
          let questionCount = 0;

          if (flow?.flow_sections) {
            sectionCount = flow.flow_sections.length;
            questionCount = flow.flow_sections.reduce(
              (acc: number, section: { flow_items?: { item_type: string }[] }) =>
                acc +
                (section.flow_items?.filter(
                  (item: { item_type: string }) => item.item_type !== "instruction"
                ).length || 0),
              0
            );
          }

          // Get voice name
          let voiceName = null;
          let voiceType: "preset" | "cloned" | null = null;

          if (study.voice_profiles) {
            voiceName = study.voice_profiles.name;
            voiceType = study.voice_profiles.type;
          } else if (study.voice_profile_id) {
            // It might be a preset voice ID
            voiceName = "Preset Voice";
            voiceType = "preset";
          }

          // Check if launched
          if (study.status === "live") {
            setIsLaunched(true);
            const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
            setPublicUrl(`${baseUrl}/interview/${study.public_token || study.id}`);
          }

          setSummary({
            projectName: study.title || "Untitled Study",
            aboutInterviewer: study.about_interviewer || "",
            aboutAudience: study.audience || "",
            objectiveContext: study.objective || "",
            language: study.language || "English",
            welcomeMessage: flow?.welcome_message || "",
            sectionCount,
            questionCount,
            voiceName,
            voiceType,
            hasCompletedTest: study.status === "tested" || study.status === "live",
          });
        } catch (error) {
          console.error("Error loading summary:", error);
          toast({
            title: "Error",
            description: "Failed to load study summary.",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      };

      loadSummary();
    }, [studyId, toast]);

    // Report validation (always valid on this step)
    useEffect(() => {
      if (onValidationChange) {
        onValidationChange(true);
      }
    }, [onValidationChange]);

    // Launch study
    const handleLaunch = async () => {
      if (!studyId) return;

      setIsLaunching(true);
      const supabase = createClient();

      try {
        // Generate public token if not exists
        const publicToken = `pub_${studyId}_${Date.now()}`;

        const { error } = await supabase
          .from("studies")
          .update({
            status: "live",
            public_token: publicToken,
            published_at: new Date().toISOString(),
          })
          .eq("id", studyId);

        if (error) throw error;

        const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
        setPublicUrl(`${baseUrl}/interview/${publicToken}`);
        setIsLaunched(true);

        toast({
          title: "Study launched!",
          description: "Your study is now live and ready to collect responses.",
          variant: "success",
        });
      } catch (error) {
        console.error("Error launching study:", error);
        toast({
          title: "Launch failed",
          description: "Failed to launch study. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLaunching(false);
      }
    };

    // Copy link to clipboard
    const handleCopyLink = () => {
      if (publicUrl) {
        navigator.clipboard.writeText(publicUrl);
        toast({
          title: "Link copied",
          description: "Interview link copied to clipboard.",
        });
      }
    };

    // Expose methods to parent via ref
    useImperativeHandle(
      ref,
      () => ({
        validate: () => true,
        getData: () => ({ isLaunched, publicUrl }),
        isDirty: () => false,
        save: async () => {
          if (!isLaunched) {
            await handleLaunch();
          }
          return true;
        },
      }),
      [isLaunched, publicUrl]
    );

    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      );
    }

    if (!summary) {
      return (
        <div className="text-center py-12 text-text-muted">
          <p>Failed to load study summary.</p>
        </div>
      );
    }

    // If already launched, show success state
    if (isLaunched) {
      return (
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-success-100 rounded-full flex items-center justify-center mx-auto">
              <Rocket className="w-10 h-10 text-success-600" />
            </div>
            <h2 className="text-h2 text-text-primary">Your Study is Live!</h2>
            <p className="text-body text-text-muted max-w-md mx-auto">
              Congratulations! Your study is now live and ready to collect responses.
            </p>
          </div>

          {publicUrl && (
            <div className="bg-surface border border-border-subtle rounded-xl p-6">
              <h3 className="text-body-strong text-text-primary mb-3">
                Share this link with your participants:
              </h3>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={publicUrl}
                  readOnly
                  className="flex-1 px-3 py-2 bg-surface-alt border border-border-subtle rounded-md text-body text-text-primary"
                />
                <Button variant="outline" onClick={handleCopyLink}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.open(publicUrl, "_blank")}
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <h2 className="text-h3 text-text-primary">Review Your Study</h2>
          <p className="text-body text-text-muted">
            Review your study configuration before launching
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4">
          {/* Project Basics */}
          <SummaryCard
            icon={<FileText className="w-5 h-5" />}
            title="Project Basics"
            items={[
              { label: "Name", value: summary.projectName },
              { label: "Language", value: summary.language },
              {
                label: "Objective",
                value:
                  summary.objectiveContext.length > 100
                    ? summary.objectiveContext.substring(0, 100) + "..."
                    : summary.objectiveContext,
              },
            ]}
            isComplete={!!summary.projectName}
          />

          {/* Study Flow */}
          <SummaryCard
            icon={<Layers className="w-5 h-5" />}
            title="Study Flow"
            items={[
              { label: "Sections", value: String(summary.sectionCount) },
              { label: "Questions", value: String(summary.questionCount) },
              {
                label: "Welcome",
                value: summary.welcomeMessage ? "Configured" : "Not set",
              },
            ]}
            isComplete={summary.sectionCount > 0 && summary.questionCount > 0}
          />

          {/* Voice Setup */}
          <SummaryCard
            icon={<Volume2 className="w-5 h-5" />}
            title="Voice Setup"
            items={[
              { label: "Voice", value: summary.voiceName || "Not selected" },
              {
                label: "Type",
                value: summary.voiceType === "cloned" ? "Custom Clone" : "Preset",
              },
            ]}
            isComplete={!!summary.voiceName}
          />

          {/* Test Status */}
          <SummaryCard
            icon={<TestTube className="w-5 h-5" />}
            title="Test & Preview"
            items={[
              {
                label: "Status",
                value: summary.hasCompletedTest ? "Completed" : "Pending",
              },
            ]}
            isComplete={summary.hasCompletedTest}
          />
        </div>

        {/* Launch Button */}
        <div className="flex justify-center pt-4">
          <Button
            size="lg"
            onClick={handleLaunch}
            disabled={isLaunching}
            className="gap-2 px-8"
          >
            <Rocket className="w-5 h-5" />
            {isLaunching ? "Launching..." : "Launch Study"}
          </Button>
        </div>
      </div>
    );
  }
);

// Summary Card Component
interface SummaryCardProps {
  icon: React.ReactNode;
  title: string;
  items: { label: string; value: string }[];
  isComplete: boolean;
}

function SummaryCard({ icon, title, items, isComplete }: SummaryCardProps) {
  return (
    <div className="bg-surface border border-border-subtle rounded-xl p-5">
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
            isComplete ? "bg-success-100 text-success-600" : "bg-surface-alt text-text-muted"
          )}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-body-strong text-text-primary">{title}</h3>
            {isComplete && (
              <CheckCircle2 className="w-4 h-4 text-success-600" />
            )}
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
            {items.map((item) => (
              <div key={item.label}>
                <dt className="text-caption text-text-muted">{item.label}</dt>
                <dd className="text-body text-text-primary truncate">
                  {item.value || "-"}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
