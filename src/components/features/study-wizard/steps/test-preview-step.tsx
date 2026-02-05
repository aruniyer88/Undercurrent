"use client";

import { forwardRef, useState, useEffect, useImperativeHandle, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ExternalLink, Play, CheckCircle2, AlertCircle } from "lucide-react";
import { StepRef, StepContentProps } from "../wizard-types";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const TestPreviewStepContent = forwardRef<StepRef, StepContentProps>(
  function TestPreviewStepContent({ studyId, onValidationChange }, ref) {
    const { toast } = useToast();
    const [hasCompletedTest, setHasCompletedTest] = useState(false);
    const [testUrl, setTestUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load test URL
    useEffect(() => {
      if (!studyId) {
        setIsLoading(false);
        return;
      }

      const loadTestUrl = async () => {
        const supabase = createClient();

        try {
          // Get study to check status
          const { data: study, error: studyError } = await supabase
            .from("studies")
            .select("status")
            .eq("id", studyId)
            .single();

          if (studyError) throw studyError;

          // Find or create a test interview
          // Note: The query might fail with 406 due to RLS, so we'll try creating directly
          let existingTest = null;
          try {
            const { data } = await supabase
              .from("interviews")
              .select("token")
              .eq("study_id", studyId)
              .eq("is_test", true)
              .maybeSingle();
            existingTest = data;
          } catch {
            console.log("Could not query existing test interview, will create new one");
          }

          let testToken: string;

          if (existingTest) {
            testToken = existingTest.token;
            console.log("Using existing test interview:", testToken);
          } else {
            // Create a new test interview
            const { data: newTest, error: createError } = await supabase
              .from("interviews")
              .insert({
                study_id: studyId,
                is_test: true,
                status: "created",
              })
              .select("token")
              .single();

            if (createError) {
              console.error("Error creating test interview:", createError);
              throw createError;
            }
            if (!newTest) throw new Error("Failed to create test interview");

            testToken = newTest.token;
            console.log("Created new test interview:", testToken);
          }

          // Build the test URL
          const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
          setTestUrl(`${baseUrl}/interview/${testToken}`);

          // If study was already tested, pre-check the checkbox
          if (study.status === "tested" || study.status === "ready_for_test") {
            setHasCompletedTest(true);
          }
        } catch (error) {
          console.error("Error loading test URL:", error);
          toast({
            title: "Error",
            description: error instanceof Error ? error.message : "Failed to load test configuration.",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      };

      loadTestUrl();
    }, [studyId, toast]);

    // Report validation changes
    useEffect(() => {
      if (onValidationChange) {
        onValidationChange(hasCompletedTest);
      }
    }, [hasCompletedTest, onValidationChange]);

    // Open test in new tab
    const handleOpenTest = useCallback(() => {
      if (testUrl) {
        window.open(testUrl, "_blank", "noopener,noreferrer");
      }
    }, [testUrl]);

    // Expose methods to parent via ref
    useImperativeHandle(
      ref,
      () => ({
        validate: () => hasCompletedTest,
        getData: () => ({ hasCompletedTest }),
        isDirty: () => false, // This step doesn't have persistent data
        save: async () => {
          // Update study status to indicate test was completed
          if (studyId && hasCompletedTest) {
            const supabase = createClient();
            await supabase
              .from("studies")
              .update({ status: "tested" })
              .eq("id", studyId);
          }
          return true;
        },
      }),
      [hasCompletedTest, studyId]
    );

    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      );
    }

    if (!studyId) {
      return (
        <div className="text-center py-12 text-text-muted">
          <p>Please complete the previous steps first.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Test Card */}
        <div className="bg-surface border border-border-subtle rounded-lg p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-body-strong text-text-primary mb-2">
                Open Test Interview
              </h3>
              <p className="text-body text-text-muted">
                This will open the interview in a new tab. Go through the experience as if you were a participant.
              </p>
            </div>
            <Button onClick={handleOpenTest} disabled={!testUrl}>
              <Play className="w-4 h-4 mr-2" />
              Start Test Interview
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
          </div>

          <div className="border-t border-border-subtle pt-6">
            <h4 className="text-body-strong text-text-primary mb-3">
              What to check during your test:
            </h4>
            <ul className="space-y-2 text-body text-text-muted">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-success-600 mt-0.5 flex-shrink-0" />
                Voice sounds natural and appropriate
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-success-600 mt-0.5 flex-shrink-0" />
                Questions flow logically
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-success-600 mt-0.5 flex-shrink-0" />
                All options and responses work correctly
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-success-600 mt-0.5 flex-shrink-0" />
                Any stimuli (images, videos) display properly
              </li>
            </ul>
          </div>
        </div>

        {/* Confirmation */}
        <div className="bg-surface border border-border-subtle rounded-lg p-6">
          <div className="flex items-start gap-3">
            <Checkbox
              id="test-completed"
              checked={hasCompletedTest}
              onCheckedChange={(checked) => setHasCompletedTest(checked as boolean)}
              className="mt-1"
            />
            <label
              htmlFor="test-completed"
              className="text-body text-text-primary cursor-pointer"
            >
              I have tested the interview and confirmed it works as expected
            </label>
          </div>
          {!hasCompletedTest && (
            <div className="flex items-center gap-2 mt-4 p-3 bg-warning-50 rounded-lg">
              <AlertCircle className="w-4 h-4 text-warning-600 flex-shrink-0" />
              <p className="text-caption text-warning-700">
                Please test and confirm before proceeding to launch
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }
);
