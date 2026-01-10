"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Study, ProjectType } from "@/lib/types/database";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  ArrowLeft, 
  ArrowRight, 
  Save, 
  Loader2, 
  Sparkles,
  Target,
  List,
  CheckSquare,
  Users,
  BookOpen,
  MessageSquare,
  X,
  Wand2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface StudySetupFormProps {
  study: Study;
}

const PROJECT_TYPES: { value: ProjectType; label: string; description: string }[] = [
  { 
    value: "discovery", 
    label: "Discovery", 
    description: "Open-ended exploration to understand needs, pain points, and opportunities" 
  },
  { 
    value: "concept_testing", 
    label: "Concept Testing", 
    description: "Validate ideas, features, or strategies before building" 
  },
  { 
    value: "creative_testing", 
    label: "Creative Testing", 
    description: "Get feedback on messaging, visuals, or campaign concepts" 
  },
  { 
    value: "brand_health", 
    label: "Brand Health", 
    description: "Understand perception, sentiment, and brand associations" 
  },
];

// Type for the AI-generated study setup
interface GeneratedSetup {
  title: string;
  project_type: ProjectType;
  objective: string;
  topics: string[];
  success_criteria: string;
  audience: string;
  guidelines: string;
  intro_text: string;
}

export function StudySetupForm({ study }: StudySetupFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    title: study.title,
    project_type: study.project_type || "",
    objective: study.objective || "",
    topics: study.topics || [],
    success_criteria: study.success_criteria || "",
    audience: study.audience || "",
    guidelines: study.guidelines || "",
    intro_text: study.intro_text || "",
  });
  
  const [newTopic, setNewTopic] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGeneratedInitial, setHasGeneratedInitial] = useState(false);

  // Check if the study is newly created (has empty topics and basic fields)
  const isNewStudy = useCallback(() => {
    return (
      (!study.topics || study.topics.length === 0) &&
      !study.project_type &&
      !study.success_criteria &&
      !study.audience
    );
  }, [study]);

  // Generate study setup from AI
  const generateSetupFromAI = useCallback(async () => {
    if (!study.objective) return;
    
    setIsGenerating(true);
    try {
      const response = await fetch("/api/studies/generate-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt: study.objective,
          currentObjective: study.objective
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate study setup");
      }

      const generated: GeneratedSetup = await response.json();
      
      // Update form with AI-generated values
      setFormData({
        title: generated.title,
        project_type: generated.project_type,
        objective: generated.objective,
        topics: generated.topics,
        success_criteria: generated.success_criteria,
        audience: generated.audience,
        guidelines: generated.guidelines,
        intro_text: generated.intro_text,
      });

      toast({
        title: "Study setup generated",
        description: "AI has filled out your study configuration. Review and adjust as needed.",
      });
    } catch (error) {
      console.error("Error generating setup:", error);
      toast({
        title: "Generation failed",
        description: "Could not generate study setup. Please fill in manually.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  }, [study.objective, toast]);

  // Auto-generate on initial load for new studies
  useEffect(() => {
    if (isNewStudy() && !hasGeneratedInitial && study.objective) {
      setHasGeneratedInitial(true);
      generateSetupFromAI();
    }
  }, [isNewStudy, hasGeneratedInitial, study.objective, generateSetupFromAI]);

  const updateField = <K extends keyof typeof formData>(
    field: K,
    value: typeof formData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addTopic = () => {
    if (newTopic.trim() && !formData.topics.includes(newTopic.trim())) {
      updateField("topics", [...formData.topics, newTopic.trim()]);
      setNewTopic("");
    }
  };

  const removeTopic = (topic: string) => {
    updateField("topics", formData.topics.filter((t) => t !== topic));
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("studies")
        .update({
          title: formData.title,
          project_type: formData.project_type || null,
          objective: formData.objective,
          topics: formData.topics,
          success_criteria: formData.success_criteria,
          audience: formData.audience,
          guidelines: formData.guidelines,
          intro_text: formData.intro_text,
        })
        .eq("id", study.id);

      if (error) throw error;

      toast({
        title: "Changes saved",
        description: "Your study setup has been updated.",
      });
    } catch {
      toast({
        title: "Error saving",
        description: "Failed to save changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleContinue = async () => {
    await handleSave();
    router.push(`/studies/${study.id}/guide`);
  };

  const handleRegenerateField = async (field: keyof GeneratedSetup) => {
    if (!formData.objective) {
      toast({
        title: "Objective required",
        description: "Please enter an objective first to generate suggestions.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch("/api/studies/generate-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt: formData.objective,
          currentObjective: formData.objective
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to regenerate");
      }

      const generated: GeneratedSetup = await response.json();
      
      // Only update the specific field
      if (field === "topics") {
        updateField("topics", generated.topics);
      } else {
        updateField(field, generated[field] as string);
      }

      toast({
        title: "Field regenerated",
        description: `The ${field} has been updated with AI suggestions.`,
      });
    } catch (error) {
      console.error("Error regenerating field:", error);
      toast({
        title: "Regeneration failed",
        description: "Could not regenerate this field. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerateAll = async () => {
    await generateSetupFromAI();
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="sticky top-16 z-40 bg-white border-b border-neutral-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-lg font-semibold text-neutral-900">
                  Study Setup
                </h1>
                <p className="text-sm text-neutral-500">
                  Review and customize your research configuration
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                onClick={handleRegenerateAll} 
                disabled={isGenerating || !formData.objective}
                className="text-primary-600"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Wand2 className="w-4 h-4 mr-2" />
                )}
                Regenerate All
              </Button>
              <Button variant="outline" onClick={handleSave} disabled={isSaving || isGenerating}>
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Draft
              </Button>
              <Button 
                onClick={handleContinue} 
                disabled={isGenerating}
                className="bg-primary-600 hover:bg-primary-700"
              >
                Continue to Guide
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {isGenerating && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center gap-4 max-w-sm mx-4">
            <div className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center">
              <Wand2 className="w-6 h-6 text-primary-600 animate-pulse" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-neutral-900">Generating Setup</h3>
              <p className="text-sm text-neutral-500 mt-1">
                AI is creating your study configuration...
              </p>
            </div>
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        </div>
      )}

      {/* Form Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Study Title */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <Label htmlFor="title" className="text-base font-medium text-neutral-900">
              Study Title
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="Give your study a descriptive name"
              className="mt-2 text-lg"
            />
          </div>

          {/* 1. Project Type - First */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                <Target className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <Label className="text-base font-medium text-neutral-900">
                  1. Project Type
                </Label>
                <p className="text-sm text-neutral-500">
                  What kind of research are you conducting?
                </p>
              </div>
            </div>
            <Select
              value={formData.project_type}
              onValueChange={(value) => updateField("project_type", value as ProjectType)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a project type" />
              </SelectTrigger>
              <SelectContent>
                {PROJECT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{type.label}</span>
                      <span className="text-xs text-neutral-500">{type.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Accordion for remaining fields */}
          <Accordion type="multiple" defaultValue={["objective", "topics", "success", "audience", "guidelines", "intro"]} className="space-y-4">
            {/* 2. Objective */}
            <AccordionItem value="objective" className="bg-white rounded-xl border border-neutral-200 px-6">
              <AccordionTrigger className="py-4 hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-base font-medium text-neutral-900">2. Objective</p>
                    <p className="text-sm text-neutral-500">What do you want to learn?</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-6">
                <Textarea
                  value={formData.objective}
                  onChange={(e) => updateField("objective", e.target.value)}
                  placeholder="Describe the main goal of this research..."
                  rows={3}
                  className="resize-none"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50"
                  onClick={() => handleRegenerateField("objective")}
                  disabled={isGenerating}
                >
                  <Sparkles className="w-4 h-4 mr-1" />
                  Regenerate with AI
                </Button>
              </AccordionContent>
            </AccordionItem>

            {/* 3. Topics */}
            <AccordionItem value="topics" className="bg-white rounded-xl border border-neutral-200 px-6">
              <AccordionTrigger className="py-4 hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                    <List className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-base font-medium text-neutral-900">3. Topics</p>
                    <p className="text-sm text-neutral-500">Key areas to explore</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-6">
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.topics.map((topic) => (
                    <Badge key={topic} variant="secondary" className="py-1.5 px-3">
                      {topic}
                      <button
                        onClick={() => removeTopic(topic)}
                        className="ml-2 hover:text-error-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    placeholder="Add a topic..."
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTopic())}
                  />
                  <Button variant="outline" onClick={addTopic}>
                    Add
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50"
                  onClick={() => handleRegenerateField("topics")}
                  disabled={isGenerating}
                >
                  <Sparkles className="w-4 h-4 mr-1" />
                  Regenerate topics with AI
                </Button>
              </AccordionContent>
            </AccordionItem>

            {/* 4. Success Criteria */}
            <AccordionItem value="success" className="bg-white rounded-xl border border-neutral-200 px-6">
              <AccordionTrigger className="py-4 hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                    <CheckSquare className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-base font-medium text-neutral-900">4. Success Criteria</p>
                    <p className="text-sm text-neutral-500">How will you measure success?</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-6">
                <Textarea
                  value={formData.success_criteria}
                  onChange={(e) => updateField("success_criteria", e.target.value)}
                  placeholder="What insights or outcomes would make this study successful?"
                  rows={3}
                  className="resize-none"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50"
                  onClick={() => handleRegenerateField("success_criteria")}
                  disabled={isGenerating}
                >
                  <Sparkles className="w-4 h-4 mr-1" />
                  Regenerate with AI
                </Button>
              </AccordionContent>
            </AccordionItem>

            {/* 5. Target Audience */}
            <AccordionItem value="audience" className="bg-white rounded-xl border border-neutral-200 px-6">
              <AccordionTrigger className="py-4 hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-base font-medium text-neutral-900">5. Target Audience</p>
                    <p className="text-sm text-neutral-500">Who are you interviewing?</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-6">
                <Textarea
                  value={formData.audience}
                  onChange={(e) => updateField("audience", e.target.value)}
                  placeholder="Describe your target participants..."
                  rows={3}
                  className="resize-none"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50"
                  onClick={() => handleRegenerateField("audience")}
                  disabled={isGenerating}
                >
                  <Sparkles className="w-4 h-4 mr-1" />
                  Regenerate with AI
                </Button>
              </AccordionContent>
            </AccordionItem>

            {/* 6. Guidelines */}
            <AccordionItem value="guidelines" className="bg-white rounded-xl border border-neutral-200 px-6">
              <AccordionTrigger className="py-4 hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-base font-medium text-neutral-900">6. Guidelines</p>
                    <p className="text-sm text-neutral-500">Instructions for the AI interviewer</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-6">
                <Textarea
                  value={formData.guidelines}
                  onChange={(e) => updateField("guidelines", e.target.value)}
                  placeholder="How should the AI interviewer behave? Any topics to avoid?"
                  rows={4}
                  className="resize-none"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50"
                  onClick={() => handleRegenerateField("guidelines")}
                  disabled={isGenerating}
                >
                  <Sparkles className="w-4 h-4 mr-1" />
                  Regenerate with AI
                </Button>
              </AccordionContent>
            </AccordionItem>

            {/* 7. Participant Introduction */}
            <AccordionItem value="intro" className="bg-white rounded-xl border border-neutral-200 px-6">
              <AccordionTrigger className="py-4 hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-base font-medium text-neutral-900">7. Participant Introduction</p>
                    <p className="text-sm text-neutral-500">Welcome message for participants</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-6">
                <Textarea
                  value={formData.intro_text}
                  onChange={(e) => updateField("intro_text", e.target.value)}
                  placeholder="Write an introduction that participants will see before the interview begins..."
                  rows={4}
                  className="resize-none"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50"
                  onClick={() => handleRegenerateField("intro_text")}
                  disabled={isGenerating}
                >
                  <Sparkles className="w-4 h-4 mr-1" />
                  Regenerate with AI
                </Button>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>
  );
}

