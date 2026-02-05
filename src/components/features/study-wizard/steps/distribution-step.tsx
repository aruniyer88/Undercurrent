"use client";

import { forwardRef, useState, useEffect, useImperativeHandle, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Link2,
  Copy,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Info,
} from "lucide-react";
import { StepRef, StepContentProps } from "../wizard-types";
import { Distribution } from "@/lib/types/database";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type DistributionMode = "new" | "view" | "edit";

interface DistributionFormState {
  name: string;
  limitType: "unlimited" | "limited";
  maxResponses: number;
  redirectCompletionUrl: string;
  redirectScreenoutUrl: string;
  redirectQuotaFullUrl: string;
}

const DEFAULT_FORM_STATE: DistributionFormState = {
  name: "",
  limitType: "unlimited",
  maxResponses: 50,
  redirectCompletionUrl: "",
  redirectScreenoutUrl: "",
  redirectQuotaFullUrl: "",
};

function isValidUrl(url: string): boolean {
  if (!url || url.trim() === "") return true; // Empty is valid (optional)
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export const DistributionStepContent = forwardRef<StepRef, StepContentProps>(
  function DistributionStepContent({ studyId, onValidationChange }, ref) {
    const { toast } = useToast();
    const [mode, setMode] = useState<DistributionMode>("new");
    const [distribution, setDistribution] = useState<Distribution | null>(null);
    const [formState, setFormState] = useState<DistributionFormState>(DEFAULT_FORM_STATE);
    const [initialFormState, setInitialFormState] = useState<DistributionFormState>(DEFAULT_FORM_STATE);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [studyModifiedAfterDistribution, setStudyModifiedAfterDistribution] = useState(false);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    // Generate the shareable URL
    const getShareableUrl = useCallback(() => {
      if (!distribution?.shareable_link_id) return null;
      const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
      return `${baseUrl}/interview/${distribution.shareable_link_id}`;
    }, [distribution?.shareable_link_id]);

    // Load existing distribution
    useEffect(() => {
      if (!studyId) {
        setIsLoading(false);
        return;
      }

      const loadDistribution = async () => {
        try {
          const response = await fetch(`/api/studies/${studyId}/distribution`);
          if (!response.ok) {
            throw new Error("Failed to fetch distribution");
          }

          const data = await response.json();

          if (data.distribution) {
            setDistribution(data.distribution);
            setMode("view");

            // Populate form state from distribution
            const loadedFormState: DistributionFormState = {
              name: data.distribution.name,
              limitType: data.distribution.max_responses ? "limited" : "unlimited",
              maxResponses: data.distribution.max_responses || 50,
              redirectCompletionUrl: data.distribution.redirect_completion_url || "",
              redirectScreenoutUrl: data.distribution.redirect_screenout_url || "",
              redirectQuotaFullUrl: data.distribution.redirect_quota_full_url || "",
            };
            setFormState(loadedFormState);
            setInitialFormState(loadedFormState);

            // Check if study was modified after distribution was created
            const supabase = createClient();
            const { data: study } = await supabase
              .from("studies")
              .select("updated_at")
              .eq("id", studyId)
              .single();

            if (study) {
              const studyUpdated = new Date(study.updated_at);
              const distributionCreated = new Date(data.distribution.created_at);
              setStudyModifiedAfterDistribution(studyUpdated > distributionCreated);
            }
          } else {
            setMode("new");
            // Set default name based on study title
            const supabase = createClient();
            const { data: study } = await supabase
              .from("studies")
              .select("title")
              .eq("id", studyId)
              .single();

            if (study?.title) {
              const defaultState = {
                ...DEFAULT_FORM_STATE,
                name: `${study.title} - Main`,
              };
              setFormState(defaultState);
              setInitialFormState(defaultState);
            }
          }
        } catch (error) {
          console.error("Error loading distribution:", error);
          toast({
            title: "Error",
            description: "Failed to load distribution settings.",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      };

      loadDistribution();
    }, [studyId, toast]);

    // Validate form
    const validateForm = useCallback((): boolean => {
      const errors: Record<string, string> = {};

      if (!formState.name || formState.name.trim() === "") {
        errors.name = "Distribution name is required";
      }

      if (formState.limitType === "limited") {
        if (!formState.maxResponses || formState.maxResponses < 1 || formState.maxResponses > 200) {
          errors.maxResponses = "Max responses must be between 1 and 200";
        }
      }

      if (formState.redirectCompletionUrl && !isValidUrl(formState.redirectCompletionUrl)) {
        errors.redirectCompletionUrl = "Invalid URL format";
      }

      if (formState.redirectScreenoutUrl && !isValidUrl(formState.redirectScreenoutUrl)) {
        errors.redirectScreenoutUrl = "Invalid URL format";
      }

      if (formState.redirectQuotaFullUrl && !isValidUrl(formState.redirectQuotaFullUrl)) {
        errors.redirectQuotaFullUrl = "Invalid URL format";
      }

      setValidationErrors(errors);
      return Object.keys(errors).length === 0;
    }, [formState]);

    // Report validation to parent
    useEffect(() => {
      if (onValidationChange) {
        // In view mode, always valid. In new/edit mode, validate form.
        if (mode === "view") {
          onValidationChange(true);
        } else {
          onValidationChange(validateForm());
        }
      }
    }, [mode, formState, onValidationChange, validateForm]);

    // Check if form has unsaved changes
    const isDirty = useCallback((): boolean => {
      if (mode === "view") return false;
      return JSON.stringify(formState) !== JSON.stringify(initialFormState);
    }, [mode, formState, initialFormState]);

    // Save distribution
    const saveDistribution = useCallback(async (): Promise<boolean> => {
      if (!studyId) return false;

      if (mode === "view") {
        return true; // Nothing to save in view mode
      }

      if (!validateForm()) {
        return false;
      }

      setIsSaving(true);

      try {
        if (mode === "new") {
          // Create new distribution
          const response = await fetch("/api/distributions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              study_id: studyId,
              name: formState.name.trim(),
              max_responses: formState.limitType === "limited" ? formState.maxResponses : null,
              redirect_completion_url: formState.redirectCompletionUrl || null,
              redirect_screenout_url: formState.redirectScreenoutUrl || null,
              redirect_quota_full_url: formState.redirectQuotaFullUrl || null,
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to create distribution");
          }

          const data = await response.json();
          setDistribution(data.distribution);
          setMode("view");
          setInitialFormState(formState);

          toast({
            title: "Link generated!",
            description: "Your study is now live and ready to collect responses.",
            variant: "success",
          });
        } else if (mode === "edit" && distribution) {
          // Update existing distribution
          const response = await fetch(`/api/distributions/${distribution.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: formState.name.trim(),
              max_responses: formState.limitType === "limited" ? formState.maxResponses : null,
              redirect_completion_url: formState.redirectCompletionUrl || null,
              redirect_screenout_url: formState.redirectScreenoutUrl || null,
              redirect_quota_full_url: formState.redirectQuotaFullUrl || null,
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to update distribution");
          }

          const data = await response.json();
          setDistribution(data.distribution);
          setMode("view");
          setInitialFormState(formState);

          toast({
            title: "Changes saved",
            description: "Distribution settings have been updated.",
            variant: "success",
          });
        }

        return true;
      } catch (error) {
        console.error("Error saving distribution:", error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to save distribution.",
          variant: "destructive",
        });
        return false;
      } finally {
        setIsSaving(false);
      }
    }, [studyId, mode, distribution, formState, validateForm, toast]);

    // Copy link to clipboard
    const handleCopyLink = () => {
      const url = getShareableUrl();
      if (url) {
        navigator.clipboard.writeText(url);
        toast({
          title: "Link copied",
          description: "Interview link copied to clipboard.",
        });
      }
    };

    // Enter edit mode
    const handleEditClick = () => {
      setMode("edit");
    };

    // Cancel edit
    const handleCancelEdit = () => {
      setFormState(initialFormState);
      setValidationErrors({});
      setMode("view");
    };

    // Update form field
    const updateField = <K extends keyof DistributionFormState>(
      field: K,
      value: DistributionFormState[K]
    ) => {
      setFormState((prev) => ({ ...prev, [field]: value }));
    };

    // Expose methods to parent via ref
    useImperativeHandle(
      ref,
      () => ({
        validate: () => {
          if (mode === "view") return true;
          return validateForm();
        },
        getData: () => ({ distribution, mode }),
        isDirty,
        save: saveDistribution,
      }),
      [mode, distribution, validateForm, isDirty, saveDistribution]
    );

    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      );
    }

    // View mode - show generated link and settings
    if (mode === "view" && distribution) {
      const shareableUrl = getShareableUrl();

      return (
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Link Card */}
          <div className="bg-surface border border-border-subtle rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-success-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-success-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-body-strong text-text-primary">
                    {distribution.name}
                  </h3>
                  <span className="px-2 py-0.5 text-xs font-medium bg-success-100 text-success-700 rounded-full">
                    Live
                  </span>
                </div>
                <p className="text-caption text-text-muted">
                  Created {new Date(distribution.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            {shareableUrl && (
              <div className="flex items-center gap-2">
                <Input
                  value={shareableUrl}
                  readOnly
                  className="flex-1 bg-surface-alt"
                />
                <Button variant="outline" size="icon" onClick={handleCopyLink}>
                  <Copy className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => window.open(shareableUrl, "_blank")}
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Study Modified Warning */}
          {studyModifiedAfterDistribution && (
            <div className="flex items-start gap-3 p-4 bg-warning-50 border border-warning-200 rounded-lg">
              <Info className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-body-strong text-warning-800">Study has been modified</p>
                <p className="text-caption text-warning-700">
                  Changes made to the study after this link was created will apply to new participants.
                </p>
              </div>
            </div>
          )}

          {/* Settings Summary */}
          <div className="bg-surface border border-border-subtle rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-body-strong text-text-primary">Distribution Settings</h3>
              <Button variant="ghost" size="sm" onClick={handleEditClick} className="gap-2">
                <Edit3 className="w-4 h-4" />
                Edit
              </Button>
            </div>

            <dl className="grid gap-4">
              <div>
                <dt className="text-caption text-text-muted">Response Limit</dt>
                <dd className="text-body text-text-primary">
                  {distribution.max_responses
                    ? `${distribution.max_responses} responses`
                    : "Unlimited"}
                </dd>
              </div>

              <div>
                <dt className="text-caption text-text-muted">Completion Redirect</dt>
                <dd className="text-body text-text-primary">
                  {distribution.redirect_completion_url || "Default thank you page"}
                </dd>
              </div>

              <div>
                <dt className="text-caption text-text-muted">Screenout Redirect</dt>
                <dd className="text-body text-text-primary">
                  {distribution.redirect_screenout_url || "Default screenout page"}
                </dd>
              </div>

              <div>
                <dt className="text-caption text-text-muted">Quota Full Redirect</dt>
                <dd className="text-body text-text-primary">
                  {distribution.redirect_quota_full_url || "Default quota full page"}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      );
    }

    // New or Edit mode - show form
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
            <Link2 className="w-6 h-6 text-primary-600" />
          </div>
          <h2 className="text-h3 text-text-primary">
            {mode === "new" ? "Create Distribution Link" : "Edit Distribution"}
          </h2>
          <p className="text-body text-text-muted">
            {mode === "new"
              ? "Configure how participants will access your study"
              : "Update your distribution settings"}
          </p>
        </div>

        {/* Edit Mode Warning */}
        {mode === "edit" && (
          <div className="flex items-start gap-3 p-4 bg-warning-50 border border-warning-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
            <p className="text-caption text-warning-700">
              Changes will apply to new responses only. Existing responses and the shareable link will not be affected.
            </p>
          </div>
        )}

        {/* Form Sections */}
        <div className="space-y-6">
          {/* Section 1: Distribution Name */}
          <FormSection title="Distribution Name" description="Give this distribution a descriptive name">
            <div className="space-y-2">
              <Input
                id="name"
                value={formState.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="e.g., Main Study Link, Panel A"
                className={cn(validationErrors.name && "border-error-500")}
              />
              {validationErrors.name && (
                <p className="text-caption text-error-600">{validationErrors.name}</p>
              )}
            </div>
          </FormSection>

          {/* Section 2: Response Limits */}
          <FormSection
            title="Response Limits"
            description="Set a cap on the number of responses for this link"
          >
            <div className="space-y-4">
              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="limitType"
                    value="unlimited"
                    checked={formState.limitType === "unlimited"}
                    onChange={() => updateField("limitType", "unlimited")}
                    className="w-4 h-4 text-primary-600"
                  />
                  <span className="text-body text-text-primary">Unlimited responses</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="limitType"
                    value="limited"
                    checked={formState.limitType === "limited"}
                    onChange={() => updateField("limitType", "limited")}
                    className="w-4 h-4 text-primary-600"
                  />
                  <span className="text-body text-text-primary">Limit to</span>
                  {formState.limitType === "limited" && (
                    <>
                      <Input
                        type="number"
                        min={1}
                        max={200}
                        value={formState.maxResponses}
                        onChange={(e) => updateField("maxResponses", parseInt(e.target.value) || 1)}
                        className={cn(
                          "w-20",
                          validationErrors.maxResponses && "border-error-500"
                        )}
                      />
                      <span className="text-body text-text-primary">responses</span>
                    </>
                  )}
                </label>
              </div>
              {validationErrors.maxResponses && (
                <p className="text-caption text-error-600">{validationErrors.maxResponses}</p>
              )}
            </div>
          </FormSection>

          {/* Section 3: Redirects */}
          <FormSection
            title="Redirect URLs"
            description="Optional URLs to redirect participants after completing the interview"
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="redirectCompletion" className="text-caption text-text-muted">
                  Completion Redirect
                </Label>
                <Input
                  id="redirectCompletion"
                  type="url"
                  value={formState.redirectCompletionUrl}
                  onChange={(e) => updateField("redirectCompletionUrl", e.target.value)}
                  placeholder="https://example.com/thank-you"
                  className={cn(validationErrors.redirectCompletionUrl && "border-error-500")}
                />
                {validationErrors.redirectCompletionUrl && (
                  <p className="text-caption text-error-600">{validationErrors.redirectCompletionUrl}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="redirectScreenout" className="text-caption text-text-muted">
                  Screenout Redirect
                </Label>
                <Input
                  id="redirectScreenout"
                  type="url"
                  value={formState.redirectScreenoutUrl}
                  onChange={(e) => updateField("redirectScreenoutUrl", e.target.value)}
                  placeholder="https://example.com/not-qualified"
                  className={cn(validationErrors.redirectScreenoutUrl && "border-error-500")}
                />
                {validationErrors.redirectScreenoutUrl && (
                  <p className="text-caption text-error-600">{validationErrors.redirectScreenoutUrl}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="redirectQuotaFull" className="text-caption text-text-muted">
                  Quota Full Redirect
                </Label>
                <Input
                  id="redirectQuotaFull"
                  type="url"
                  value={formState.redirectQuotaFullUrl}
                  onChange={(e) => updateField("redirectQuotaFullUrl", e.target.value)}
                  placeholder="https://example.com/study-closed"
                  className={cn(validationErrors.redirectQuotaFullUrl && "border-error-500")}
                />
                {validationErrors.redirectQuotaFullUrl && (
                  <p className="text-caption text-error-600">{validationErrors.redirectQuotaFullUrl}</p>
                )}
              </div>
            </div>
          </FormSection>
        </div>

        {/* Edit Mode Cancel Button */}
        {mode === "edit" && (
          <div className="flex justify-end">
            <Button variant="ghost" onClick={handleCancelEdit} disabled={isSaving}>
              Cancel
            </Button>
          </div>
        )}
      </div>
    );
  }
);

// Form Section Component
interface FormSectionProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <div className="bg-surface border border-border-subtle rounded-xl p-6">
      <div className="mb-4">
        <h3 className="text-body-strong text-text-primary">{title}</h3>
        <p className="text-caption text-text-muted">{description}</p>
      </div>
      {children}
    </div>
  );
}
