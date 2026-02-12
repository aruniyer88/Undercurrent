"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Sparkles, Check, FileText, MessageSquare, ListChecks, Star, Bot } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Study } from "@/lib/types/database";
import { WelcomeScreen, Section, FlowItem, ITEM_TYPE_LABELS } from "@/lib/types/study-flow";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AIGenerateModalProps {
  isOpen: boolean;
  study: Study;
  onClose: () => void;
  onApply: (generated: { welcomeScreen: WelcomeScreen; sections: Section[] }) => void;
}

type GenerateOption = "project_basics" | "with_details";
type ModalState = "input" | "loading" | "preview";

interface GeneratedResult {
  welcomeScreen: WelcomeScreen;
  sections: Section[];
}

export function AIGenerateModal({
  isOpen,
  study,
  onClose,
  onApply,
}: AIGenerateModalProps) {
  const { toast } = useToast();
  const [option, setOption] = useState<GenerateOption>("project_basics");
  const [additionalDetails, setAdditionalDetails] = useState("");
  const [modalState, setModalState] = useState<ModalState>("input");
  const [generatedResult, setGeneratedResult] = useState<GeneratedResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    // Don't reset generatedResult - preserve it for reopening
    setError(null);
    onClose();
  };

  const handleCancel = () => {
    // Only reset everything when explicitly canceling
    setModalState("input");
    setGeneratedResult(null);
    setError(null);
    onClose();
  };

  const handleGenerate = async () => {
    setModalState("loading");
    setError(null);
    setGeneratedResult(null); // Clear previous result when generating new one

    try {
      const response = await fetch("/api/ai/generate-study-flow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectBasics: {
            title: study.title,
            objective: study.objective || "",
            context: study.context || "",
            language: study.language || "English",
          },
          studyType: study.study_type || "structured",
          additionalDetails: option === "with_details" ? additionalDetails : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to generate");
      }

      const data = await response.json();
      setGeneratedResult({
        welcomeScreen: data.welcomeScreen,
        sections: data.sections,
      });
      setModalState("preview");
    } catch (err) {
      console.error("Generation error:", err);
      setError(err instanceof Error ? err.message : "Failed to generate study flow");
      setModalState("input");
      toast({
        title: "Generation failed",
        description: err instanceof Error ? err.message : "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleApply = () => {
    if (generatedResult) {
      onApply(generatedResult);
      // Reset everything after applying
      setModalState("input");
      setGeneratedResult(null);
      setError(null);
      onClose();
    }
  };

  const countItems = (sections: Section[]): number => {
    return sections.reduce((sum, s) => sum + s.items.length, 0);
  };

  const getItemIcon = (type: FlowItem["type"]) => {
    switch (type) {
      case "open_ended":
        return <MessageSquare className="w-3 h-3" />;
      case "single_select":
      case "multi_select":
        return <ListChecks className="w-3 h-3" />;
      case "rating_scale":
        return <Star className="w-3 h-3" />;
      case "instruction":
        return <FileText className="w-3 h-3" />;
      case "ai_conversation":
        return <Bot className="w-3 h-3" />;
      default:
        return <MessageSquare className="w-3 h-3" />;
    }
  };

  // If there's a generated result, show preview; otherwise show input
  const currentState = generatedResult && modalState !== "loading" ? "preview" : modalState;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        {currentState === "input" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary-600" />
                Generate Study Flow with AI
              </DialogTitle>
              <DialogDescription>
                Let AI create a complete interview flow based on your project details.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <RadioGroup
                value={option}
                onValueChange={(value) => setOption(value as GenerateOption)}
                className="space-y-4"
              >
                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="project_basics" id="project_basics" className="mt-1" />
                  <div className="space-y-1">
                    <Label htmlFor="project_basics" className="text-base font-medium cursor-pointer">
                      Generate based on my project basics
                    </Label>
                    <p className="text-sm text-text-muted">
                      We&apos;ll create a complete interview flow based on the objective,
                      audience, and context you provided in Step 1.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="with_details" id="with_details" className="mt-1" />
                  <div className="space-y-1 flex-1">
                    <Label htmlFor="with_details" className="text-base font-medium cursor-pointer">
                      Generate with additional details
                    </Label>
                    <p className="text-sm text-text-muted">
                      Add a research plan, discussion guide, or extra context to guide
                      generation.
                    </p>
                    {option === "with_details" && (
                      <Textarea
                        value={additionalDetails}
                        onChange={(e) => setAdditionalDetails(e.target.value)}
                        placeholder="Paste your research plan, discussion guide, existing questions, or any additional context..."
                        className="mt-3"
                      />
                    )}
                  </div>
                </div>
              </RadioGroup>

              {error && (
                <p className="text-sm text-danger-600 bg-danger-50 p-3 rounded-md">
                  {error}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleGenerate} className="gap-2">
                <Sparkles className="w-4 h-4" />
                Generate
              </Button>
            </DialogFooter>
          </>
        )}

        {currentState === "loading" && (
          <div className="py-12 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600 mb-4" />
            <p className="text-body text-text-muted">Creating your interview flow...</p>
            <p className="text-caption text-text-muted mt-1">This may take a few seconds</p>
          </div>
        )}

        {currentState === "preview" && generatedResult && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Check className="w-5 h-5 text-success-600" />
                Flow Generated
              </DialogTitle>
              <DialogDescription>
                Generated {generatedResult.sections.length} sections with{" "}
                {countItems(generatedResult.sections)} items. Review and apply to your study.
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="max-h-[500px] pr-4">
              <div className="space-y-6 py-4">
                {/* Welcome Screen Preview */}
                <div className="p-4 bg-white rounded-lg border border-neutral-200">
                  <div className="mb-3">
                    <span className="font-semibold text-neutral-900">Welcome Screen</span>
                  </div>
                  <p className="text-sm text-neutral-700 leading-relaxed">
                    {generatedResult.welcomeScreen.message}
                  </p>
                </div>

                {/* Sections Preview */}
                {generatedResult.sections.map((section, sectionIndex) => (
                  <div
                    key={sectionIndex}
                    className="p-4 bg-white rounded-lg border border-neutral-200"
                  >
                    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-neutral-100">
                      <span className="font-semibold text-neutral-900">Section {sectionIndex + 1}</span>
                      <span className="text-xs text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
                        {section.items.length} {section.items.length === 1 ? 'item' : 'items'}
                      </span>
                    </div>
                    <div className="space-y-4">
                      {section.items.map((item, itemIndex) => (
                        <div
                          key={itemIndex}
                          className="flex gap-3"
                        >
                          <div className="flex items-start gap-2 w-40 flex-shrink-0 pt-0.5">
                            <span className="text-neutral-400 flex-shrink-0">
                              {getItemIcon(item.type)}
                            </span>
                            <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                              {ITEM_TYPE_LABELS[item.type]}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-neutral-900 leading-relaxed">
                              {"questionText" in item
                                ? item.questionText
                                : "content" in item
                                ? item.content
                                : item.type === "ai_conversation"
                                ? `${item.durationSeconds / 60} minute conversation`
                                : ""}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <DialogFooter>
              <Button variant="outline" onClick={() => { setModalState("input"); setGeneratedResult(null); }}>
                Regenerate
              </Button>
              <Button onClick={handleApply} className="gap-2">
                <Check className="w-4 h-4" />
                Apply &amp; Edit
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
