"use client";

import { useState, useCallback, useMemo } from "react";
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
import { ArrowRight, Save, Loader2, Sparkles, Check, X, RotateCcw, Pencil, Info } from "lucide-react";
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

interface ProjectBasicsStepProps {
  initialData?: Partial<ProjectBasicsFormData>;
  onNext: (data: ProjectBasicsFormData) => void;
  onSaveDraft: (data: ProjectBasicsFormData) => void;
  isSaving?: boolean;
}

export function ProjectBasicsStep({
  initialData,
  onNext,
  onSaveDraft,
  isSaving = false,
}: ProjectBasicsStepProps) {
  const { toast } = useToast();

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

    if (validate()) {
      onNext(formData);
    }
  }, [formData, validate, onNext]);

  // Handle Save Draft
  const handleSaveDraft = useCallback(() => {
    onSaveDraft(formData);
  }, [formData, onSaveDraft]);

  return (
    <TooltipProvider>
      <div className="space-y-6">
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
              touched.projectName && errors.projectName && "border-danger-600 focus:ring-danger-600"
            )}
          />
          {touched.projectName && errors.projectName && (
            <p className="text-caption text-danger-600">{errors.projectName}</p>
          )}
        </div>

        {/* About You */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Label htmlFor="aboutInterviewer" className="text-base font-medium">
              About You <span className="text-danger-600">*</span>
            </Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" className="text-text-muted hover:text-text-primary transition-colors">
                  <Info className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                <p>Describe who you are and your role. This helps the AI interviewer establish appropriate context and tone.</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Textarea
            id="aboutInterviewer"
            value={formData.aboutInterviewer}
            onChange={(e) => updateField("aboutInterviewer", e.target.value)}
            onBlur={() => handleBlur("aboutInterviewer")}
            placeholder="e.g., I'm the Head of Community at a fintech startup..."
            rows={3}
            className={cn(
              "resize-none",
              touched.aboutInterviewer && errors.aboutInterviewer && "border-danger-600 focus:ring-danger-600"
            )}
          />
          {touched.aboutInterviewer && errors.aboutInterviewer && (
            <p className="text-caption text-danger-600">{errors.aboutInterviewer}</p>
          )}
        </div>

        {/* About Your Audience */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Label htmlFor="aboutAudience" className="text-base font-medium">
              About Your Audience <span className="text-danger-600">*</span>
            </Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" className="text-text-muted hover:text-text-primary transition-colors">
                  <Info className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                <p>Describe who you&apos;ll be interviewing and your relationship with them (customers, students, employees, community members, etc.)</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Textarea
            id="aboutAudience"
            value={formData.aboutAudience}
            onChange={(e) => updateField("aboutAudience", e.target.value)}
            onBlur={() => handleBlur("aboutAudience")}
            placeholder="e.g., Early adopters of our mobile app, mostly 25-40 year olds..."
            rows={3}
            className={cn(
              "resize-none",
              touched.aboutAudience && errors.aboutAudience && "border-danger-600 focus:ring-danger-600"
            )}
          />
          {touched.aboutAudience && errors.aboutAudience && (
            <p className="text-caption text-danger-600">{errors.aboutAudience}</p>
          )}
        </div>

        {/* Objective & Context */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Label htmlFor="objectiveContext" className="text-base font-medium">
                Objective &amp; Context <span className="text-danger-600">*</span>
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="text-text-muted hover:text-text-primary transition-colors">
                    <Info className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <p>What do you want to learn from this study? Include any background context, specific topics to explore, or constraints the AI should be aware of.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            {aiState === "idle" && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleEnhanceWithAI}
                      disabled={!isAIEnabled}
                      className="text-primary-600 hover:text-primary-700 hover:bg-primary-50"
                    >
                      <Sparkles className="w-4 h-4 mr-1" />
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
                    rows={6}
                    className="resize-none bg-warning-50 border-warning-200"
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
                rows={6}
                className={cn(
                  "resize-none",
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
          <div className="flex items-center gap-1.5">
            <Label htmlFor="language" className="text-base font-medium">
              Language <span className="text-danger-600">*</span>
            </Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" className="text-text-muted hover:text-text-primary transition-colors">
                  <Info className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                <p>The language used for communication with your interviewees</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Select
            value={formData.language}
            onValueChange={(value) => updateField("language", value as Language)}
          >
            <SelectTrigger className="w-full">
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

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-border-subtle">
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Draft
          </Button>
          <Button
            onClick={handleNext}
            disabled={!isFormValid || aiState === "loading"}
          >
            Next
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
}
