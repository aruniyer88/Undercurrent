"use client";

import { useState, useCallback, useMemo, forwardRef, useImperativeHandle, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ArrowRight, Save, Loader2, Sparkles, Check, X, RotateCcw, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Language options for the dropdown
const LANGUAGES = [
  "English",
  "Spanish",
  "French",
  "German",
  "Portuguese",
  "Italian",
  "Dutch",
  "Japanese",
  "Korean",
  "Mandarin Chinese",
  "Hindi",
  "Arabic",
] as const;

type Language = (typeof LANGUAGES)[number];

// Form data interface
export interface ProjectBasicsFormData {
  projectName: string;
  aboutInterviewer: string;
  aboutAudience: string;
  objectiveContext: string;
  language: Language;
}

// Validation error interface
interface ValidationErrors {
  projectName?: string;
  aboutInterviewer?: string;
  aboutAudience?: string;
  objectiveContext?: string;
}

// AI enhancement state
type AIEnhanceState = "idle" | "loading" | "preview";

// Ref interface for wizard integration
export interface ProjectBasicsStepRef {
  validate: () => boolean;
  getData: () => ProjectBasicsFormData;
  isDirty: () => boolean;
  save: () => Promise<boolean>;
}

interface ProjectBasicsStepProps {
  initialData?: Partial<ProjectBasicsFormData>;
  onNext?: (data: ProjectBasicsFormData) => void;
  onSaveDraft?: (data: ProjectBasicsFormData) => void;
  isSaving?: boolean;
  // Embedded mode props (for wizard integration)
  embedded?: boolean;
  onValidationChange?: (isValid: boolean) => void;
  onSave?: (data: ProjectBasicsFormData) => Promise<boolean>;
}

export const ProjectBasicsStep = forwardRef<ProjectBasicsStepRef, ProjectBasicsStepProps>(
  function ProjectBasicsStep(
    {
      initialData,
      onNext,
      onSaveDraft,
      isSaving = false,
      embedded = false,
      onValidationChange,
      onSave,
    },
    ref
  ) {
  const { toast } = useToast();
  const initialDataRef = useRef(initialData);

  // Form state
  const [formData, setFormData] = useState<ProjectBasicsFormData>({
    projectName: initialData?.projectName || "",
    aboutInterviewer: initialData?.aboutInterviewer || "",
    aboutAudience: initialData?.aboutAudience || "",
    objectiveContext: initialData?.objectiveContext || "",
    language: initialData?.language || "English",
  });

  // Validation state
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // AI enhancement state
  const [aiState, setAIState] = useState<AIEnhanceState>("idle");
  const [enhancedObjective, setEnhancedObjective] = useState<string>("");
  // Note: originalObjective is stored for potential undo functionality
  const [, setOriginalObjective] = useState<string>("");

  // Update a single field
  const updateField = useCallback(
    <K extends keyof ProjectBasicsFormData>(
      field: K,
      value: ProjectBasicsFormData[K]
    ) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      // Clear error when user starts typing
      if (errors[field as keyof ValidationErrors]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    },
    [errors]
  );

  // Mark field as touched on blur
  const handleBlur = useCallback((field: keyof ProjectBasicsFormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  // Validate all fields
  const validate = useCallback((): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.projectName || formData.projectName.length < 3) {
      newErrors.projectName = "Please enter a project name";
    }

    if (!formData.aboutInterviewer || formData.aboutInterviewer.length < 20) {
      newErrors.aboutInterviewer = "Please tell us a bit more about yourself";
    }

    if (!formData.aboutAudience || formData.aboutAudience.length < 20) {
      newErrors.aboutAudience = "Please describe your audience in more detail";
    }

    if (!formData.objectiveContext || formData.objectiveContext.length < 50) {
      newErrors.objectiveContext =
        "Please provide more detail about your research objective";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Check if AI enhancement is enabled
  const isAIEnabled = useMemo(() => {
    return (
      formData.aboutInterviewer.length >= 20 &&
      formData.aboutAudience.length >= 20 &&
      formData.objectiveContext.length >= 20
    );
  }, [formData.aboutInterviewer, formData.aboutAudience, formData.objectiveContext]);

  // Check if form is valid for proceeding
  const isFormValid = useMemo(() => {
    return (
      formData.projectName.length >= 3 &&
      formData.aboutInterviewer.length >= 20 &&
      formData.aboutAudience.length >= 20 &&
      formData.objectiveContext.length >= 50
    );
  }, [formData]);

  // Check if form has been modified from initial state
  const isDirty = useCallback(() => {
    const initial = initialDataRef.current;
    return (
      formData.projectName !== (initial?.projectName || "") ||
      formData.aboutInterviewer !== (initial?.aboutInterviewer || "") ||
      formData.aboutAudience !== (initial?.aboutAudience || "") ||
      formData.objectiveContext !== (initial?.objectiveContext || "") ||
      formData.language !== (initial?.language || "English")
    );
  }, [formData]);

  // Report validation changes to parent (for wizard integration)
  useEffect(() => {
    if (onValidationChange) {
      onValidationChange(isFormValid);
    }
  }, [isFormValid, onValidationChange]);

  // Expose methods to parent via ref (for wizard integration)
  useImperativeHandle(ref, () => ({
    validate: () => {
      // Mark all fields as touched
      setTouched({
        projectName: true,
        aboutInterviewer: true,
        aboutAudience: true,
        objectiveContext: true,
      });
      return validate();
    },
    getData: () => formData,
    isDirty,
    save: async () => {
      if (onSave) {
        return onSave(formData);
      }
      return true;
    },
  }), [formData, validate, isDirty, onSave]);

  // Handle AI enhancement
  const handleEnhanceWithAI = useCallback(async () => {
    if (!isAIEnabled) return;

    setOriginalObjective(formData.objectiveContext);
    setAIState("loading");

    try {
      const response = await fetch("/api/ai/enhance-objective", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          about_interviewer: formData.aboutInterviewer,
          about_audience: formData.aboutAudience,
          raw_objective: formData.objectiveContext,
          language: formData.language,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        if (response.status === 429) {
          throw new Error("rate_limit");
        }
        if (response.status === 408 || errorData.error?.includes("timeout")) {
          throw new Error("timeout");
        }
        throw new Error("generic");
      }

      const data = await response.json();
      setEnhancedObjective(data.enhanced_objective);
      setAIState("preview");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "generic";

      let title = "Something went wrong";
      let description = "You can continue without AI assistance or try again.";

      if (errorMessage === "timeout") {
        title = "AI assistance is taking longer than expected";
        description = "Please try again.";
      } else if (errorMessage === "rate_limit") {
        title = "Too many requests";
        description = "Please wait a moment and try again.";
      }

      toast({
        title,
        description,
        variant: "destructive",
      });
      setAIState("idle");
    }
  }, [formData, isAIEnabled, toast]);

  // Accept AI suggestion
  const handleAcceptAI = useCallback(() => {
    updateField("objectiveContext", enhancedObjective);
    setAIState("idle");
    setEnhancedObjective("");
    setOriginalObjective("");
  }, [enhancedObjective, updateField]);

  // Edit AI suggestion (keep the text but allow editing)
  const handleEditAI = useCallback(() => {
    updateField("objectiveContext", enhancedObjective);
    setAIState("idle");
    setEnhancedObjective("");
    setOriginalObjective("");
  }, [enhancedObjective, updateField]);

  // Reject AI suggestion
  const handleRejectAI = useCallback(() => {
    setAIState("idle");
    setEnhancedObjective("");
    setOriginalObjective("");
  }, []);

  // Regenerate AI suggestion
  const handleRegenerateAI = useCallback(() => {
    handleEnhanceWithAI();
  }, [handleEnhanceWithAI]);

  // Handle Next button
  const handleNext = useCallback(() => {
    // Mark all fields as touched
    setTouched({
      projectName: true,
      aboutInterviewer: true,
      aboutAudience: true,
      objectiveContext: true,
    });

    if (validate() && onNext) {
      onNext(formData);
    }
  }, [formData, validate, onNext]);

  // Handle Save Draft
  const handleSaveDraft = useCallback(() => {
    if (onSaveDraft) {
      onSaveDraft(formData);
    }
  }, [formData, onSaveDraft]);

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Project Name */}
        <div className="space-y-2">
          <Label htmlFor="projectName" className="text-base font-medium">
            Project Name <span className="text-danger-600">*</span>
          </Label>
          <Input
            id="projectName"
            value={formData.projectName}
            onChange={(e) => updateField("projectName", e.target.value)}
            onBlur={() => handleBlur("projectName")}
            placeholder="e.g., Q1 Brand Perception Study"
            maxLength={100}
            className={cn(
              "border-border-default",
              touched.projectName && errors.projectName && "border-danger-600 focus:ring-danger-600"
            )}
          />
          {touched.projectName && errors.projectName && (
            <p className="text-caption text-danger-600">{errors.projectName}</p>
          )}
        </div>

        {/* About You */}
        <div className="space-y-2">
          <Label htmlFor="aboutInterviewer" className="text-base font-medium">
            About You <span className="text-danger-600">*</span>
          </Label>
          <Textarea
            id="aboutInterviewer"
            value={formData.aboutInterviewer}
            onChange={(e) => updateField("aboutInterviewer", e.target.value)}
            onBlur={() => handleBlur("aboutInterviewer")}
            placeholder="e.g., I'm the Head of Community at a fintech startup..."
            className={cn(
              "border-border-default",
              touched.aboutInterviewer && errors.aboutInterviewer && "border-danger-600 focus:ring-danger-600"
            )}
          />
          {touched.aboutInterviewer && errors.aboutInterviewer && (
            <p className="text-caption text-danger-600">{errors.aboutInterviewer}</p>
          )}
        </div>

        {/* About Your Audience */}
        <div className="space-y-2">
          <Label htmlFor="aboutAudience" className="text-base font-medium">
            About Your Audience <span className="text-danger-600">*</span>
          </Label>
          <Textarea
            id="aboutAudience"
            value={formData.aboutAudience}
            onChange={(e) => updateField("aboutAudience", e.target.value)}
            onBlur={() => handleBlur("aboutAudience")}
            placeholder="e.g., Early adopters of our mobile app, mostly 25-40 year olds..."
            className={cn(
              "border-border-default",
              touched.aboutAudience && errors.aboutAudience && "border-danger-600 focus:ring-danger-600"
            )}
          />
          {touched.aboutAudience && errors.aboutAudience && (
            <p className="text-caption text-danger-600">{errors.aboutAudience}</p>
          )}
        </div>

        {/* Objective & Context */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="objectiveContext" className="text-base font-medium">
              Objective &amp; Context <span className="text-danger-600">*</span>
            </Label>
            {aiState === "idle" && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleEnhanceWithAI}
                      disabled={!isAIEnabled}
                      className="h-6 px-2.5 text-xs font-medium rounded-full text-primary-600 hover:text-primary-700 hover:bg-primary-100 disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                      Enhance with AI
                    </Button>
                  </span>
                </TooltipTrigger>
                {!isAIEnabled && (
                  <TooltipContent>
                    <p>Fill in the fields above to enable AI assistance</p>
                  </TooltipContent>
                )}
              </Tooltip>
            )}
          </div>

          <div className="relative">
            {aiState === "loading" && (
              <div className="absolute inset-0 bg-surface/80 backdrop-blur-sm rounded-sm z-10 flex items-center justify-center">
                <div className="flex items-center gap-2 text-text-muted">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-body">Generating...</span>
                </div>
              </div>
            )}

            {aiState === "preview" ? (
              <div className="space-y-3">
                <div className="relative">
                  <Textarea
                    value={enhancedObjective}
                    onChange={(e) => setEnhancedObjective(e.target.value)}
                    className="bg-warning-50 border-warning-200"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={handleAcceptAI}
                    className="bg-success-600 hover:bg-success-700"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Accept
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEditAI}
                  >
                    <Pencil className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRejectAI}
                    className="text-danger-600 hover:text-danger-700 hover:bg-danger-50"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Reject
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRegenerateAI}
                    className="text-primary-600 hover:text-primary-700"
                  >
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Regenerate
                  </Button>
                </div>
              </div>
            ) : (
              <Textarea
                id="objectiveContext"
                value={formData.objectiveContext}
                onChange={(e) => updateField("objectiveContext", e.target.value)}
                onBlur={() => handleBlur("objectiveContext")}
                placeholder="e.g., We recently launched a new onboarding flow and want to understand how users felt about it..."
                className={cn(
                  "border-border-default",
                  touched.objectiveContext && errors.objectiveContext && "border-danger-600 focus:ring-danger-600"
                )}
              />
            )}
          </div>
          {touched.objectiveContext && errors.objectiveContext && aiState !== "preview" && (
            <p className="text-caption text-danger-600">{errors.objectiveContext}</p>
          )}
        </div>

        {/* Language */}
        <div className="space-y-2">
          <Label htmlFor="language" className="text-base font-medium">
            Language <span className="text-danger-600">*</span>
          </Label>
          <Select
            value={formData.language}
            onValueChange={(value) => updateField("language", value as Language)}
          >
            <SelectTrigger id="language" className="w-full border-border-default">
              <SelectValue placeholder="Select a language" />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang} value={lang}>
                  {lang}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Navigation Buttons - Hidden in embedded mode */}
        {!embedded && (
          <div className="flex items-center justify-between pt-6 border-t border-border-subtle">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveDraft}
              disabled={isSaving}
              className="rounded-full border-primary-600 text-primary-600 hover:bg-primary-50"
            >
              {isSaving ? (
                <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
              ) : (
                <Save className="w-3 h-3 mr-1.5" />
              )}
              Save Draft
            </Button>
            <Button
              size="sm"
              onClick={handleNext}
              disabled={!isFormValid || aiState === "loading"}
            >
              Next
              <ArrowRight className="w-3 h-3 ml-1.5" />
            </Button>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
});
