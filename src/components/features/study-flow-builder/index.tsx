"use client";

import { useState, useCallback, useMemo, forwardRef, useImperativeHandle, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Save, Loader2, Sparkles, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { Study, StudyFlow, FlowSection as DBFlowSection, FlowItem as DBFlowItem } from "@/lib/types/database";
import {
  StudyFlowFormData,
  StudyFlowValidationErrors,
  Section,
  FlowItem,
  WelcomeScreen,
  Stimulus,
  createSection,
  createItem,
  ItemType,
} from "@/lib/types/study-flow";

import { WelcomeScreenEditor } from "./welcome-screen-editor";
import { InterviewModeSelector } from "./interview-mode-selector";
import { SectionCard } from "./section-card";
import { AIGenerateModal } from "./ai-generate-modal";

// Ref interface for wizard integration
export interface StudyFlowBuilderRef {
  validate: () => boolean;
  getData: () => StudyFlowFormData;
  isDirty: () => boolean;
  save: () => Promise<boolean>;
  openAIModal?: () => void;
}

interface StudyFlowBuilderProps {
  study: Study;
  existingFlow: StudyFlow | null;
  existingSections: (DBFlowSection & { items: DBFlowItem[] })[];
  // Embedded mode props (for wizard integration)
  embedded?: boolean;
  onValidationChange?: (isValid: boolean) => void;
}

// Transform DB data to UI state
function transformDBToUIState(
  studyId: string,
  flow: StudyFlow | null,
  sections: (DBFlowSection & { items: DBFlowItem[] })[]
): StudyFlowFormData {
  if (!flow) {
    // Return default state with one section containing a default open-ended question
    const defaultSection = createSection(0);
    defaultSection.items = [createItem("open_ended", 0)];
    return {
      studyId,
      welcomeScreen: {
        message: "",
      },
      sections: [defaultSection],
    };
  }

  return {
    id: flow.id,
    studyId,
    welcomeScreen: {
      message: flow.welcome_message,
      logoUrl: flow.welcome_logo_url || undefined,
    },
    sections: sections.map((s, idx) => ({
      id: s.id,
      title: s.title,
      stimulus: transformDBStimulusToUI(s.stimulus_type, s.stimulus_config),
      order: idx,
      items: (s.items || [])
        .sort((a, b) => a.display_order - b.display_order)
        .map((item, itemIdx) => transformDBItemToUI(item, itemIdx)),
    })),
  };
}

// Transform DB stimulus to UI stimulus
function transformDBStimulusToUI(
  type: string | null,
  config: { url?: string; caption?: string; instructions?: string } | null
): Stimulus | undefined {
  if (!type || !config) return undefined;

  const url = config.url || "";

  switch (type) {
    case "image":
      return {
        type: "image",
        url,
        caption: config.caption,
      };
    case "website":
      return {
        type: "website",
        url,
        instructions: config.instructions,
      };
    case "youtube":
      return {
        type: "youtube",
        url,
        instructions: config.instructions,
      };
    default:
      return undefined;
  }
}

// Transform a single DB item to UI item
function transformDBItemToUI(item: DBFlowItem, order: number): FlowItem {
  const base = { id: item.id, order };
  const config = item.item_config as Record<string, unknown>;

  switch (item.item_type) {
    case "open_ended":
      return {
        ...base,
        type: "open_ended",
        questionText: item.question_text || "",
        probingMode: (config.probing_mode as "disabled" | "auto") || "auto",
        responseMode: (item.response_mode as "voice" | "text") || "voice",
      };
    case "single_select":
      return {
        ...base,
        type: "single_select",
        questionText: item.question_text || "",
        options: (config.options as string[]) || ["", ""],
        responseMode: (item.response_mode as "screen" | "voice") || "screen",
      };
    case "multi_select":
      return {
        ...base,
        type: "multi_select",
        questionText: item.question_text || "",
        options: (config.options as string[]) || ["", ""],
        responseMode: (item.response_mode as "screen" | "voice") || "screen",
      };
    case "rating_scale":
      return {
        ...base,
        type: "rating_scale",
        questionText: item.question_text || "",
        scaleSize: (config.scale_size as number) || 5,
        lowLabel: (config.low_label as string) || "Lowest rating",
        highLabel: (config.high_label as string) || "Highest rating",
        responseMode: (item.response_mode as "screen" | "voice") || "screen",
      };
    case "ranking":
      return {
        ...base,
        type: "ranking",
        questionText: item.question_text || "",
        items: (config.items as string[]) || ["", ""],
      };
    case "instruction":
      return {
        ...base,
        type: "instruction",
        content: (config.content as string) || "",
      };
    case "ai_conversation":
      return {
        ...base,
        type: "ai_conversation",
        durationSeconds: (config.duration_seconds as 30 | 60 | 120 | 180 | 240 | 300) || 120,
        basis: (config.basis as "prior_answers" | "custom") || "prior_answers",
        customInstructions: (config.custom_instructions as string) || "",
      };
    default:
      // Fallback
      return {
        ...base,
        type: "instruction",
        content: "",
      };
  }
}

export const StudyFlowBuilder = forwardRef<StudyFlowBuilderRef, StudyFlowBuilderProps>(
  function StudyFlowBuilder(
    {
      study,
      existingFlow,
      existingSections,
      embedded = false,
      onValidationChange,
    },
    ref
  ) {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();
  const initialFormDataRef = useRef<StudyFlowFormData | null>(null);

  // Form state
  const [formData, setFormData] = useState<StudyFlowFormData>(() =>
    transformDBToUIState(study.id, existingFlow, existingSections)
  );
  const [errors, setErrors] = useState<StudyFlowValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [aiModalOpen, setAIModalOpen] = useState(false);

  // DnD state
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<"section" | "item" | null>(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // ============================================
  // WELCOME SCREEN HANDLERS
  // ============================================

  const updateWelcomeScreen = useCallback(
    <K extends keyof WelcomeScreen>(field: K, value: WelcomeScreen[K]) => {
      setFormData((prev) => ({
        ...prev,
        welcomeScreen: { ...prev.welcomeScreen, [field]: value },
      }));
      // Clear errors for this field
      if (errors.welcomeScreen) {
        const fieldStr = field as string;
        if (fieldStr === "message" && errors.welcomeScreen.message) {
          setErrors((prev) => ({
            ...prev,
            welcomeScreen: { ...prev.welcomeScreen, message: undefined },
          }));
        }
      }
    },
    [errors]
  );

  // ============================================
  // INTERVIEW MODE HANDLERS
  // ============================================

  const handleInterviewModeChange = useCallback(
    async (mode: "voice" | "video") => {
      try {
        const { error } = await supabase
          .from("studies")
          .update({ interview_mode: mode })
          .eq("id", study.id);

        if (error) throw error;

        // Update local study object
        study.interview_mode = mode;

        toast({
          title: "Interview mode updated",
          description: `Interview mode set to ${mode}.`,
        });
      } catch (error) {
        console.error("Error updating interview mode:", error);
        toast({
          title: "Error",
          description: "Failed to update interview mode. Please try again.",
          variant: "destructive",
        });
      }
    },
    [study, supabase, toast]
  );

  const handleCameraRequiredChange = useCallback(
    async (required: boolean) => {
      try {
        const { error } = await supabase
          .from("studies")
          .update({ camera_required: required })
          .eq("id", study.id);

        if (error) throw error;

        // Update local study object
        study.camera_required = required;

        toast({
          title: "Camera settings updated",
          description: `Camera is now ${required ? "required" : "optional"}.`,
        });
      } catch (error) {
        console.error("Error updating camera requirement:", error);
        toast({
          title: "Error",
          description: "Failed to update camera settings. Please try again.",
          variant: "destructive",
        });
      }
    },
    [study, supabase, toast]
  );

  // ============================================
  // SECTION HANDLERS
  // ============================================

  const addSection = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      sections: [...prev.sections, createSection(prev.sections.length)],
    }));
  }, []);

  const updateSection = useCallback(
    (sectionId: string, updates: Partial<Section>) => {
      setFormData((prev) => ({
        ...prev,
        sections: prev.sections.map((s) =>
          s.id === sectionId ? { ...s, ...updates } : s
        ),
      }));
    },
    []
  );

  const deleteSection = useCallback((sectionId: string) => {
    setFormData((prev) => {
      // Don't allow deleting if only one section
      if (prev.sections.length <= 1) {
        return prev;
      }
      const filtered = prev.sections.filter((s) => s.id !== sectionId);
      // Renumber sections
      return {
        ...prev,
        sections: filtered.map((s, i) => ({
          ...s,
          order: i,
          title: `Section ${i + 1}`,
        })),
      };
    });
  }, []);

  // ============================================
  // ITEM HANDLERS
  // ============================================

  const addItem = useCallback((sectionId: string, itemType: ItemType) => {
    setFormData((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === sectionId
          ? { ...s, items: [...s.items, createItem(itemType, s.items.length)] }
          : s
      ),
    }));
  }, []);

  const updateItem = useCallback(
    (sectionId: string, itemId: string, updates: Partial<FlowItem>) => {
      setFormData((prev) => ({
        ...prev,
        sections: prev.sections.map((s) =>
          s.id === sectionId
            ? {
                ...s,
                items: s.items.map((item) =>
                  item.id === itemId ? { ...item, ...updates } as FlowItem : item
                ),
              }
            : s
        ),
      }));
    },
    []
  );

  const deleteItem = useCallback((sectionId: string, itemId: string) => {
    setFormData((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              items: s.items
                .filter((item) => item.id !== itemId)
                .map((item, i) => ({ ...item, order: i })),
            }
          : s
      ),
    }));
  }, []);

  // ============================================
  // DRAG AND DROP
  // ============================================

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    // Determine type from data
    const data = active.data.current as { type?: string } | undefined;
    setActiveType(data?.type === "section" ? "section" : "item");
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      setActiveId(null);
      setActiveType(null);
      return;
    }

    const activeData = active.data.current as { type?: string; sectionId?: string } | undefined;

    if (activeData?.type === "section") {
      // Reorder sections
      const oldIndex = formData.sections.findIndex((s) => s.id === active.id);
      const newIndex = formData.sections.findIndex((s) => s.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        setFormData((prev) => ({
          ...prev,
          sections: arrayMove(prev.sections, oldIndex, newIndex).map((s, i) => ({
            ...s,
            order: i,
            title: `Section ${i + 1}`,
          })),
        }));
      }
    } else if (activeData?.type === "item" && activeData.sectionId) {
      // Reorder items within the same section
      const section = formData.sections.find((s) => s.id === activeData.sectionId);
      if (section) {
        const oldIndex = section.items.findIndex((item) => item.id === active.id);
        const newIndex = section.items.findIndex((item) => item.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          setFormData((prev) => ({
            ...prev,
            sections: prev.sections.map((s) =>
              s.id === activeData.sectionId
                ? {
                    ...s,
                    items: arrayMove(s.items, oldIndex, newIndex).map((item, i) => ({
                      ...item,
                      order: i,
                    })),
                  }
                : s
            ),
          }));
        }
      }
    }

    setActiveId(null);
    setActiveType(null);
  };

  // ============================================
  // VALIDATION
  // ============================================

  const validate = useCallback((): boolean => {
    const newErrors: StudyFlowValidationErrors = {};

    // Welcome screen validation
    if (!formData.welcomeScreen.message || formData.welcomeScreen.message.length < 20) {
      newErrors.welcomeScreen = {
        ...newErrors.welcomeScreen,
        message: "Please add a welcome message (at least 20 characters)",
      };
    }

    // Check if there's at least one question
    const totalQuestions = formData.sections.reduce(
      (sum, s) => sum + s.items.filter((i) => i.type !== "instruction").length,
      0
    );
    if (totalQuestions === 0) {
      newErrors.general = "Add at least one question to your study";
    }

    // Section/item validation
    const sectionErrors: Record<string, { items?: Record<string, { questionText?: string; content?: string; options?: string; items?: string; customInstructions?: string }> }> = {};

    formData.sections.forEach((section) => {
      const itemErrors: Record<string, { questionText?: string; content?: string; options?: string; items?: string; customInstructions?: string }> = {};

      section.items.forEach((item) => {
        const errors: { questionText?: string; content?: string; options?: string; items?: string; customInstructions?: string } = {};

        if (item.type === "instruction") {
          if (!item.content || item.content.length < 10) {
            errors.content = "Instruction content is required (at least 10 characters)";
          }
        } else if (item.type === "ai_conversation") {
          if (item.basis === "custom" && (!item.customInstructions || item.customInstructions.length < 20)) {
            errors.customInstructions = "Custom instructions required (at least 20 characters)";
          }
        } else {
          // All question types need question text
          if (!item.questionText || item.questionText.length < 10) {
            errors.questionText = "Question text is required (at least 10 characters)";
          }

          // Options validation for select types
          if (item.type === "single_select" || item.type === "multi_select") {
            const validOptions = item.options.filter((o) => o.trim().length > 0);
            if (validOptions.length < 2) {
              errors.options = "At least 2 options required";
            }
          }

          // Items validation for ranking
          if (item.type === "ranking") {
            const validItems = item.items.filter((i) => i.trim().length > 0);
            if (validItems.length < 2 || validItems.length > 7) {
              errors.items = "2-7 items required for ranking";
            }
          }
        }

        if (Object.keys(errors).length > 0) {
          itemErrors[item.id] = errors;
        }
      });

      if (Object.keys(itemErrors).length > 0) {
        sectionErrors[section.id] = { items: itemErrors };
      }
    });

    if (Object.keys(sectionErrors).length > 0) {
      newErrors.sections = sectionErrors;
    }

    setErrors(newErrors);

    const hasErrors =
      newErrors.welcomeScreen?.message ||
      newErrors.general ||
      Object.keys(newErrors.sections || {}).length > 0;

    return !hasErrors;
  }, [formData]);

  // Check if form is valid for enabling Next button
  const isFormValid = useMemo(() => {
    const hasWelcomeMessage = formData.welcomeScreen.message.length >= 20;
    const hasQuestions = formData.sections.some((s) =>
      s.items.some((i) => i.type !== "instruction")
    );
    return hasWelcomeMessage && hasQuestions;
  }, [formData]);

  // Store initial state for dirty check
  useEffect(() => {
    if (!initialFormDataRef.current) {
      initialFormDataRef.current = formData;
    }
  }, []);

  // Check if form has been modified
  const isDirty = useCallback(() => {
    if (!initialFormDataRef.current) return false;
    return JSON.stringify(formData) !== JSON.stringify(initialFormDataRef.current);
  }, [formData]);

  // Report validation changes to parent (for wizard integration)
  useEffect(() => {
    if (onValidationChange) {
      onValidationChange(isFormValid);
    }
  }, [isFormValid, onValidationChange]);

  // ============================================
  // SAVE & NAVIGATION
  // ============================================

  const saveToDatabase = useCallback(async (): Promise<boolean> => {
    setIsSaving(true);

    try {
      // Upsert study_flow
      let flowId = formData.id;

      if (!flowId) {
        // Create new flow
        const { data: newFlow, error: flowError } = await supabase
          .from("study_flows")
          .insert({
            study_id: study.id,
            welcome_message: formData.welcomeScreen.message,
            welcome_logo_url: formData.welcomeScreen.logoUrl || null,
          })
          .select()
          .single();

        if (flowError) throw flowError;
        flowId = newFlow.id;
        setFormData((prev) => ({ ...prev, id: flowId }));
      } else {
        // Update existing flow
        const { error: flowError } = await supabase
          .from("study_flows")
          .update({
            welcome_message: formData.welcomeScreen.message,
            welcome_logo_url: formData.welcomeScreen.logoUrl || null,
          })
          .eq("id", flowId);

        if (flowError) throw flowError;
      }

      // Delete existing sections and items (will cascade)
      await supabase.from("flow_sections").delete().eq("study_flow_id", flowId);

      // Insert sections
      for (const section of formData.sections) {
        const { data: newSection, error: sectionError } = await supabase
          .from("flow_sections")
          .insert({
            study_flow_id: flowId,
            title: section.title,
            display_order: section.order,
            stimulus_type: section.stimulus?.type || null,
            stimulus_config: section.stimulus
              ? {
                  url: section.stimulus.url,
                  caption: "caption" in section.stimulus ? section.stimulus.caption : undefined,
                  instructions: "instructions" in section.stimulus ? section.stimulus.instructions : undefined,
                }
              : null,
          })
          .select()
          .single();

        if (sectionError) throw sectionError;

        // Insert items for this section
        for (const item of section.items) {
          const itemConfig = buildItemConfig(item);
          const { error: itemError } = await supabase.from("flow_items").insert({
            section_id: newSection.id,
            item_type: item.type,
            display_order: item.order,
            question_text: "questionText" in item ? item.questionText : null,
            response_mode: "responseMode" in item ? item.responseMode : null,
            item_config: itemConfig,
          });

          if (itemError) throw itemError;
        }
      }

      return true;
    } catch (error) {
      console.error("Error saving flow:", error);
      toast({
        title: "Error saving",
        description: "Failed to save your study flow. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [formData, study.id, supabase, toast]);

  // Expose methods to parent via ref (for wizard integration)
  useImperativeHandle(ref, () => ({
    validate: () => {
      setTouched({ all: true });
      return validate();
    },
    getData: () => formData,
    isDirty,
    save: async () => {
      const success = await saveToDatabase();
      return success;
    },
    openAIModal: () => setAIModalOpen(true),
  }), [formData, validate, isDirty, saveToDatabase]);

  // Build item_config based on item type
  function buildItemConfig(item: FlowItem): Record<string, unknown> {
    switch (item.type) {
      case "open_ended":
        return {
          probing_mode: item.probingMode,
        };
      case "single_select":
      case "multi_select":
        return { options: item.options };
      case "rating_scale":
        return {
          scale_size: item.scaleSize,
          low_label: item.lowLabel,
          high_label: item.highLabel,
        };
      case "ranking":
        return { items: item.items };
      case "instruction":
        return { content: item.content };
      case "ai_conversation":
        return {
          duration_seconds: item.durationSeconds,
          basis: item.basis,
          custom_instructions: item.customInstructions,
        };
      default:
        return {};
    }
  }

  const handleSaveDraft = useCallback(async () => {
    const success = await saveToDatabase();
    if (success) {
      toast({
        title: "Draft saved",
        description: "Your study flow has been saved.",
      });
      router.refresh();
    }
  }, [saveToDatabase, toast, router]);

  const handleNext = useCallback(async () => {
    // Mark all fields as touched
    setTouched({ all: true });

    if (!validate()) {
      toast({
        title: "Validation errors",
        description: "Please fix the errors before continuing.",
        variant: "destructive",
      });
      return;
    }

    const success = await saveToDatabase();
    if (success) {
      toast({
        title: "Flow saved",
        description: "Continuing to voice configuration...",
      });
      router.push(`/studies/${study.id}/voice`);
      router.refresh();
    }
  }, [validate, saveToDatabase, study.id, router, toast]);

  const handleBack = useCallback(() => {
    router.push(`/studies/${study.id}/basics`);
    router.refresh();
  }, [router, study.id]);

  // ============================================
  // AI GENERATION
  // ============================================

  const handleApplyGenerated = useCallback(
    (generated: { welcomeScreen: WelcomeScreen; sections: Section[] }) => {
      setFormData((prev) => ({
        ...prev,
        welcomeScreen: generated.welcomeScreen,
        sections: generated.sections.map((s, i) => ({
          ...s,
          id: crypto.randomUUID(),
          order: i,
          title: `Section ${i + 1}`,
          items: s.items.map((item, j) => ({
            ...item,
            id: crypto.randomUUID(),
            order: j,
          })),
        })),
      }));
      setAIModalOpen(false);
      toast({
        title: "Flow generated",
        description: "AI has created your study flow. You can now edit it.",
      });
    },
    [toast]
  );

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="space-y-6">
      {/* Generate with AI button - moved to header */}
      {!embedded && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={() => setAIModalOpen(true)}
            className="gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Generate with AI
          </Button>
        </div>
      )}

      {/* Interview Mode Selection */}
        <InterviewModeSelector
          interviewMode={study.interview_mode || "voice"}
          cameraRequired={study.camera_required || false}
          onInterviewModeChange={handleInterviewModeChange}
          onCameraRequiredChange={handleCameraRequiredChange}
        />

      {/* Welcome Screen */}
        <WelcomeScreenEditor
          data={formData.welcomeScreen}
          errors={errors.welcomeScreen}
          touched={touched.all}
          onChange={updateWelcomeScreen}
        />

        {/* Sections */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="space-y-4">
            <SortableContext
              items={formData.sections.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              {formData.sections.map((section) => (
                <SectionCard
                  key={section.id}
                  section={section}
                  sectionErrors={errors.sections?.[section.id]}
                  touched={touched.all}
                  canDelete={formData.sections.length > 1}
                  onUpdate={(updates) => updateSection(section.id, updates)}
                  onDelete={() => deleteSection(section.id)}
                  onAddItem={(type) => addItem(section.id, type)}
                  onUpdateItem={(itemId, updates) =>
                    updateItem(section.id, itemId, updates)
                  }
                  onDeleteItem={(itemId) => deleteItem(section.id, itemId)}
                />
              ))}
            </SortableContext>
          </div>

          <DragOverlay style={embedded ? { zIndex: 10000 } : undefined}>
            {activeId && activeType === "section" && (
              <div className="bg-surface border border-primary-border rounded-lg p-4 shadow-lg opacity-80">
                <span className="text-body-strong">
                  {formData.sections.find((s) => s.id === activeId)?.title}
                </span>
              </div>
            )}
          </DragOverlay>
        </DndContext>

        {/* Add Section Button */}
        <div className="flex justify-center">
          <button
            onClick={addSection}
            className="flex items-center justify-center gap-2 py-2.5 px-6 rounded-lg border-2 border-dashed border-border-subtle bg-transparent hover:border-primary-400 hover:bg-primary-50/50 transition-all group text-text-muted hover:text-primary-600"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">Add Section</span>
          </button>
        </div>

        {/* General Error */}
        {errors.general && touched.all && (
          <p className="text-center text-caption text-danger-600">
            {errors.general}
          </p>
        )}

        {/* Navigation - Hidden in embedded mode */}
        {!embedded && (
          <div className="flex items-center justify-between pt-6 border-t border-border-subtle">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Project Basics
            </Button>
            <div className="flex items-center gap-3">
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
              <Button onClick={handleNext} disabled={!isFormValid || isSaving}>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

      {/* AI Generate Modal */}
      <AIGenerateModal
        isOpen={aiModalOpen}
        study={study}
        onClose={() => setAIModalOpen(false)}
        onApply={handleApplyGenerated}
      />
    </div>
  );
});
