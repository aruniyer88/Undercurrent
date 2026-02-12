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
import { ArrowRight, Save, Loader2, Check, X, RotateCcw, Pencil, Info, Mic, Video, ClipboardList, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { StudyType, InterviewMode } from "@/lib/types/database";

// Language options for the dropdown
const LANGUAGES = [
  "English",
  "Hindi",
  "Spanish",
  "French",
] as const;

type Language = (typeof LANGUAGES)[number];

// Form data interface
export interface ProjectBasicsFormData {
  projectName: string;
  objective: string;
  context: string;
  language: Language;
  studyType: StudyType;
  interviewMode: InterviewMode;
  cameraRequired: boolean;
}

// Validation error interface
interface ValidationErrors {
  projectName?: string;
  objective?: string;
  context?: string;
}

// Per-field AI enhancement
type AIFieldTarget = "objective" | "context";

interface AIFieldState {
  state: "idle" | "loading" | "preview";
  enhancedText: string;
}

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

// Selection card component
function SelectionCard({
  selected,
  onClick,
  icon,
  title,
  description,
  bestFor,
  id,
}: {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
  bestFor: string;
  id: string;
}) {
  return (
    <button
      type="button"
      id={id}
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        "flex flex-col items-start gap-2 rounded-lg border-2 p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-border focus-visible:ring-offset-2",
        selected
          ? "border-primary-600 bg-primary-50"
          : "border-border-default bg-white hover:border-gray-300 hover:bg-gray-50"
      )}
    >
      <div className="flex items-center gap-2">
        <span className={cn("flex-shrink-0", selected ? "text-primary-600" : "text-text-muted")}>
          {icon}
        </span>
        <span className={cn("font-medium text-sm", selected ? "text-primary-700" : "text-text-primary")}>
          {title}
        </span>
      </div>
      <p className="text-sm text-text-muted leading-relaxed">{description}</p>
      <p className="text-xs text-text-tertiary italic">{bestFor}</p>
    </button>
  );
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
    objective: initialData?.objective || "",
    context: initialData?.context || "",
    language: initialData?.language || "English",
    studyType: initialData?.studyType || "structured",
    interviewMode: initialData?.interviewMode || "voice",
    cameraRequired: initialData?.cameraRequired || false,
  });

  // Validation state
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Per-field AI enhancement state
  const [aiFields, setAIFields] = useState<Record<AIFieldTarget, AIFieldState>>({
    objective: { state: "idle", enhancedText: "" },
    context: { state: "idle", enhancedText: "" },
  });

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

    if (!formData.objective || formData.objective.length < 30) {
      newErrors.objective = "Please provide more detail about your research objective (min 30 characters)";
    }

    if (!formData.context || formData.context.length < 20) {
      newErrors.context = "Please provide more background context (min 20 characters)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Check if AI enhancement is enabled per field
  const isAIEnabledForField = useCallback((field: AIFieldTarget): boolean => {
    return formData[field].length >= 20;
  }, [formData]);

  // Check if form is valid for proceeding
  const isFormValid = useMemo(() => {
    return (
      formData.projectName.length >= 3 &&
      formData.objective.length >= 30 &&
      formData.context.length >= 20
    );
  }, [formData]);

  // Check if form has been modified from initial state
  const isDirty = useCallback(() => {
    const initial = initialDataRef.current;
    return (
      formData.projectName !== (initial?.projectName || "") ||
      formData.objective !== (initial?.objective || "") ||
      formData.context !== (initial?.context || "") ||
      formData.language !== (initial?.language || "English") ||
      formData.studyType !== (initial?.studyType || "structured") ||
      formData.interviewMode !== (initial?.interviewMode || "voice") ||
      formData.cameraRequired !== (initial?.cameraRequired || false)
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
        objective: true,
        context: true,
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

  // Handle AI enhancement per field
  const handleEnhanceWithAI = useCallback(async (field: AIFieldTarget) => {
    if (!isAIEnabledForField(field)) return;

    setAIFields((prev) => ({
      ...prev,
      [field]: { state: "loading", enhancedText: "" },
    }));

    try {
      const response = await fetch("/api/ai/enhance-objective", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          field,
          objective: formData.objective,
          context: formData.context,
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
      setAIFields((prev) => ({
        ...prev,
        [field]: { state: "preview", enhancedText: data.enhanced_text },
      }));
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

      toast({ title, description, variant: "destructive" });
      setAIFields((prev) => ({
        ...prev,
        [field]: { state: "idle", enhancedText: "" },
      }));
    }
  }, [formData, isAIEnabledForField, toast]);

  // Accept AI suggestion for a field
  const handleAcceptAI = useCallback((field: AIFieldTarget) => {
    updateField(field, aiFields[field].enhancedText);
    setAIFields((prev) => ({
      ...prev,
      [field]: { state: "idle", enhancedText: "" },
    }));
  }, [aiFields, updateField]);

  // Edit AI suggestion (accept text but allow editing)
  const handleEditAI = useCallback((field: AIFieldTarget) => {
    updateField(field, aiFields[field].enhancedText);
    setAIFields((prev) => ({
      ...prev,
      [field]: { state: "idle", enhancedText: "" },
    }));
  }, [aiFields, updateField]);

  // Reject AI suggestion for a field
  const handleRejectAI = useCallback((field: AIFieldTarget) => {
    setAIFields((prev) => ({
      ...prev,
      [field]: { state: "idle", enhancedText: "" },
    }));
  }, []);

  // Regenerate AI suggestion for a field
  const handleRegenerateAI = useCallback((field: AIFieldTarget) => {
    handleEnhanceWithAI(field);
  }, [handleEnhanceWithAI]);

  // Handle Next button
  const handleNext = useCallback(() => {
    setTouched({
      projectName: true,
      objective: true,
      context: true,
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

  // Check if any AI field is loading
  const anyAILoading = aiFields.objective.state === "loading" || aiFields.context.state === "loading";

  // Render a textarea with per-field AI enhancement
  const renderAITextarea = (
    field: AIFieldTarget,
    id: string,
    placeholder: string,
    tooltipText: string,
    label: string,
  ) => {
    const fieldState = aiFields[field];
    const fieldError = errors[field];
    const isTouched = touched[field];

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <Label htmlFor={id} className="text-sm font-medium text-gray-700">
            {label}
          </Label>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center justify-center w-4 h-4 rounded-full text-text-muted hover:text-text-default transition-colors"
                aria-label={`${label} information`}
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <p>{tooltipText}</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="relative">
          {fieldState.state === "loading" && (
            <div className="absolute inset-0 bg-surface/80 backdrop-blur-sm rounded-xl z-10 flex items-center justify-center">
              <div className="flex items-center gap-2 text-text-muted">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-body">Generating...</span>
              </div>
            </div>
          )}

          {fieldState.state === "preview" ? (
            <div className="space-y-3">
              <div className="relative">
                <Textarea
                  value={fieldState.enhancedText}
                  onChange={(e) =>
                    setAIFields((prev) => ({
                      ...prev,
                      [field]: { ...prev[field], enhancedText: e.target.value },
                    }))
                  }
                  autoExpand
                  className="bg-warning-50 border-warning-200 rounded-xl text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => handleAcceptAI(field)}
                  className="bg-success-600 hover:bg-success-700"
                >
                  <Check className="w-4 h-4 mr-1" />
                  Accept
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditAI(field)}
                >
                  <Pencil className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRejectAI(field)}
                  className="text-danger-600 hover:text-danger-700 hover:bg-danger-50"
                >
                  <X className="w-4 h-4 mr-1" />
                  Reject
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRegenerateAI(field)}
                  className="text-primary-600 hover:text-primary-700"
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Regenerate
                </Button>
              </div>
            </div>
          ) : (
            <div className="relative">
              <Textarea
                id={id}
                value={formData[field]}
                onChange={(e) => updateField(field, e.target.value)}
                onBlur={() => handleBlur(field)}
                placeholder={placeholder}
                rows={2}
                autoExpand
                className={cn(
                  "border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition pb-12",
                  isTouched && fieldError && "border-danger-600 focus:ring-danger-600"
                )}
              />
              {fieldState.state === "idle" && (
                <button
                  type="button"
                  onClick={() => handleEnhanceWithAI(field)}
                  disabled={!isAIEnabledForField(field)}
                  className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-400 bg-white/90 backdrop-blur-sm border border-indigo-100 rounded-lg hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-all cursor-pointer shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  ✨ Enhance with AI
                </button>
              )}
            </div>
          )}
        </div>
        {isTouched && fieldError && fieldState.state !== "preview" && (
          <p className="text-caption text-danger-600">{fieldError}</p>
        )}
      </div>
    );
  };

  return (
    <TooltipProvider>
      <div className="space-y-7">
        {/* Project Name */}
        <div className="space-y-2">
          <Label htmlFor="projectName" className="text-sm font-medium text-gray-700">
            Project Name
          </Label>
          <Input
            id="projectName"
            value={formData.projectName}
            onChange={(e) => updateField("projectName", e.target.value)}
            onBlur={() => handleBlur("projectName")}
            placeholder="e.g. Brand Perception Study"
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

        {/* Section 1 — Research Objective */}
        <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-6 space-y-6">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-5">Research Objective</h3>

          {renderAITextarea(
            "objective",
            "objective",
            "What do you want to learn from this research?",
            "Define the core research question. What specific behaviors, attitudes, or experiences are you trying to understand? A clear objective helps the AI interviewer stay focused.",
            "Objective"
          )}

          {renderAITextarea(
            "context",
            "context",
            "What background or context should the AI interviewer know?",
            "Provide background the AI interviewer needs: who you're talking to, why this research matters now, your company/product context, and any sensitivities to be aware of.",
            "Context"
          )}
        </div>

        {/* Section 2 — Study Configuration */}
        <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-6 space-y-6">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-5">Study Configuration</h3>

          {/* Language */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Label htmlFor="language" className="text-sm font-medium text-gray-700">
                Interview Language
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center w-4 h-4 rounded-full text-text-muted hover:text-text-default transition-colors"
                    aria-label="Interview language information"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>The AI interviewer will conduct the interview and communicate with participants in this language</p>
                </TooltipContent>
              </Tooltip>
            </div>
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

          {/* Study Type — Selection Cards */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5">
              <Label className="text-sm font-medium text-gray-700">
                Study Type
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center w-4 h-4 rounded-full text-text-muted hover:text-text-default transition-colors"
                    aria-label="Study type information"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>This determines how the AI interviewer runs the session. Structured follows your exact question flow; Streaming lets the AI have a natural conversation within your topic areas.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="grid grid-cols-2 gap-4" role="radiogroup" aria-label="Study type">
              <SelectionCard
                id="study-type-structured"
                selected={formData.studyType === "structured"}
                onClick={() => updateField("studyType", "structured")}
                icon={<ClipboardList className="w-5 h-5" />}
                title="Structured Interview"
                description="AI follows your study flow step-by-step, asks specific questions, shows stimulus, uses all question types."
                bestFor="Best for: Concept testing, usability studies, surveys"
              />
              <SelectionCard
                id="study-type-streaming"
                selected={formData.studyType === "streaming"}
                onClick={() => updateField("studyType", "streaming")}
                icon={<MessageCircle className="w-5 h-5" />}
                title="Streaming Conversation"
                description="AI has a free flowing conversation covering your topics within time limits. More exploratory and conversational."
                bestFor="Best for: Discovery research, exploratory interviews"
              />
            </div>
          </div>

          {/* Interview Mode — Selection Cards */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5">
              <Label className="text-sm font-medium text-gray-700">
                Interview Mode
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center w-4 h-4 rounded-full text-text-muted hover:text-text-default transition-colors"
                    aria-label="Interview mode information"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Choose whether participants will respond using voice only or with video recording.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="grid grid-cols-2 gap-4" role="radiogroup" aria-label="Interview mode">
              <SelectionCard
                id="interview-mode-voice"
                selected={formData.interviewMode === "voice"}
                onClick={() => {
                  updateField("interviewMode", "voice");
                  updateField("cameraRequired", false);
                }}
                icon={<Mic className="w-5 h-5" />}
                title="Voice Interview"
                description="Audio recording with transcription. Lower barrier to entry for participants."
                bestFor="Best for: Higher completion rates, sensitive topics"
              />
              <SelectionCard
                id="interview-mode-video"
                selected={formData.interviewMode === "video"}
                onClick={() => updateField("interviewMode", "video")}
                icon={<Video className="w-5 h-5" />}
                title="Video Interview"
                description="Video recording captures facial expressions and visual reactions alongside audio."
                bestFor="Best for: UX testing, emotional response studies"
              />
            </div>

            {/* Camera Required Toggle - shown only when video is selected */}
            {formData.interviewMode === "video" && (
              <div className="flex items-center gap-2 pl-1 pt-1">
                <Label
                  htmlFor="camera-required"
                  className="text-sm text-text-primary cursor-pointer"
                >
                  Require camera always on
                </Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="text-text-tertiary hover:text-text-secondary transition-colors"
                    >
                      <Info className="h-3 w-3" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      {formData.cameraRequired
                        ? "Participants must keep their camera on. Interview pauses if camera is turned off."
                        : "Camera is optional. Participants can turn off camera during interview."}
                    </p>
                  </TooltipContent>
                </Tooltip>
                <button
                  id="camera-required"
                  type="button"
                  role="switch"
                  aria-checked={formData.cameraRequired}
                  onClick={() => updateField("cameraRequired", !formData.cameraRequired)}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-border focus-visible:ring-offset-2 flex-shrink-0",
                    formData.cameraRequired ? "bg-primary-600" : "bg-input"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm",
                      formData.cameraRequired ? "translate-x-6" : "translate-x-0.5"
                    )}
                  />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Buttons - Hidden in embedded mode */}
        {!embedded && (
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 -mx-6 -mb-6 z-10 flex items-center justify-between">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              Save Draft
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={!isFormValid || anyAILoading}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
});
