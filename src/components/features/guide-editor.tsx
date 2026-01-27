"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Study, InterviewGuide, GuideSection, GuideQuestion } from "@/lib/types/database";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  ArrowLeft, 
  ArrowRight, 
  Save, 
  Loader2, 
  Plus, 
  Trash2,
  GripVertical,
  Sparkles,
  MessageCircle,
  HelpCircle,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GuideEditorProps {
  study: Study;
  guide: InterviewGuide;
}

export function GuideEditor({ study, guide }: GuideEditorProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  const [sections, setSections] = useState<GuideSection[]>(guide.sections || []);
  const [isSaving, setIsSaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);

  // Update a section title
  const updateSectionTitle = (sectionId: string, title: string) => {
    setSections(sections.map(s => 
      s.id === sectionId ? { ...s, title } : s
    ));
  };

  // Add a new section
  const addSection = () => {
    const newSection: GuideSection = {
      id: crypto.randomUUID(),
      title: "New Section",
      questions: []
    };
    setSections([...sections, newSection]);
  };

  // Delete a section
  const deleteSection = (sectionId: string) => {
    setSections(sections.filter(s => s.id !== sectionId));
  };

  // Update a question
  const updateQuestion = (sectionId: string, questionId: string, updates: Partial<GuideQuestion>) => {
    setSections(sections.map(s => 
      s.id === sectionId 
        ? {
            ...s,
            questions: s.questions.map(q =>
              q.id === questionId ? { ...q, ...updates } : q
            )
          }
        : s
    ));
  };

  // Add a new question to a section
  const addQuestion = (sectionId: string) => {
    const newQuestion: GuideQuestion = {
      id: crypto.randomUUID(),
      text: "",
      probes: []
    };
    setSections(sections.map(s =>
      s.id === sectionId
        ? { ...s, questions: [...s.questions, newQuestion] }
        : s
    ));
  };

  // Delete a question
  const deleteQuestion = (sectionId: string, questionId: string) => {
    setSections(sections.map(s =>
      s.id === sectionId
        ? { ...s, questions: s.questions.filter(q => q.id !== questionId) }
        : s
    ));
  };

  // Add a probe to a question
  const addProbe = (sectionId: string, questionId: string) => {
    setSections(sections.map(s =>
      s.id === sectionId
        ? {
            ...s,
            questions: s.questions.map(q =>
              q.id === questionId
                ? { ...q, probes: [...q.probes, ""] }
                : q
            )
          }
        : s
    ));
  };

  // Update a probe
  const updateProbe = (sectionId: string, questionId: string, probeIndex: number, value: string) => {
    setSections(sections.map(s =>
      s.id === sectionId
        ? {
            ...s,
            questions: s.questions.map(q =>
              q.id === questionId
                ? {
                    ...q,
                    probes: q.probes.map((p, i) => i === probeIndex ? value : p)
                  }
                : q
            )
          }
        : s
    ));
  };

  // Delete a probe
  const deleteProbe = (sectionId: string, questionId: string, probeIndex: number) => {
    setSections(sections.map(s =>
      s.id === sectionId
        ? {
            ...s,
            questions: s.questions.map(q =>
              q.id === questionId
                ? { ...q, probes: q.probes.filter((_, i) => i !== probeIndex) }
                : q
            )
          }
        : s
    ));
  };

  // Save guide
  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("interview_guides")
        .update({ sections })
        .eq("id", guide.id);

      if (error) throw error;

      toast({
        title: "Guide saved",
        description: "Your interview guide has been updated.",
      });
    } catch {
      toast({
        title: "Error saving",
        description: "Failed to save guide. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Continue to voice setup
  const handleContinue = async () => {
    await handleSave();
    
    // Update study status
    const supabase = createClient();
    await supabase
      .from("studies")
      .update({ status: "ready_for_test" })
      .eq("id", study.id);
    
    router.push(`/studies/${study.id}/voice`);
  };

  // Regenerate guide
  const handleRegenerate = async () => {
    setShowRegenerateDialog(false);
    setIsRegenerating(true);
    
    // Simulate AI regeneration
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsRegenerating(false);
    toast({
      title: "Guide regenerated",
      description: "A new interview guide has been created based on your study setup.",
    });
  };

  // Count total questions
  const totalQuestions = sections.reduce((acc, s) => acc + s.questions.length, 0);

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="sticky top-16 z-40 bg-white border-b border-neutral-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/studies/${study.id}/flow`}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-lg font-semibold text-neutral-900">
                  Interview Guide
                </h1>
                <p className="text-sm text-neutral-500">
                  {sections.length} sections · {totalQuestions} questions
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowRegenerateDialog(true)}
                disabled={isRegenerating}
              >
                {isRegenerating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Regenerate
              </Button>
              <Button variant="outline" onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save
              </Button>
              <Button 
                onClick={handleContinue} 
                className="bg-primary-600 hover:bg-primary-700"
              >
                Continue to Voice
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="space-y-4">
          {sections.map((section, sectionIndex) => (
            <div 
              key={section.id}
              className="bg-white rounded-xl border border-neutral-200 overflow-hidden"
            >
              {/* Section Header */}
              <div className="flex items-center gap-3 p-4 bg-neutral-50 border-b border-neutral-200">
                <GripVertical className="w-5 h-5 text-neutral-400 cursor-grab" />
                <Input
                  value={section.title}
                  onChange={(e) => updateSectionTitle(section.id, e.target.value)}
                  className="flex-1 font-medium border-0 bg-transparent px-0 focus-visible:ring-0"
                />
                <span className="text-sm text-neutral-500">
                  {section.questions.length} questions
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteSection(section.id)}
                  className="text-neutral-400 hover:text-error-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              {/* Questions */}
              <div className="p-4 space-y-4">
                {section.questions.map((question, questionIndex) => (
                  <div 
                    key={question.id}
                    className="rounded-lg border border-neutral-200 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary-50 text-primary-600 text-xs font-medium flex-shrink-0 mt-1">
                        {sectionIndex + 1}.{questionIndex + 1}
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start gap-2">
                          <MessageCircle className="w-4 h-4 text-primary-500 mt-1 flex-shrink-0" />
                          <Textarea
                            value={question.text}
                            onChange={(e) => updateQuestion(section.id, question.id, { text: e.target.value })}
                            placeholder="Enter your question..."
                            className="flex-1 min-h-[60px] resize-none"
                          />
                        </div>

                        {/* Probes */}
                        <div className="pl-6 space-y-2">
                          <p className="text-xs font-medium text-neutral-500 flex items-center gap-1">
                            <HelpCircle className="w-3 h-3" />
                            Follow-up probes
                          </p>
                          {question.probes.map((probe, probeIndex) => (
                            <div key={probeIndex} className="flex items-center gap-2">
                              <span className="text-neutral-400">→</span>
                              <Input
                                value={probe}
                                onChange={(e) => updateProbe(section.id, question.id, probeIndex, e.target.value)}
                                placeholder="Follow-up question..."
                                className="flex-1 h-8 text-sm"
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteProbe(section.id, question.id, probeIndex)}
                                className="h-8 w-8 p-0 text-neutral-400 hover:text-error-600"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => addProbe(section.id, question.id)}
                            className="h-7 text-xs text-neutral-500"
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Add probe
                          </Button>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteQuestion(section.id, question.id)}
                        className="text-neutral-400 hover:text-error-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addQuestion(section.id)}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Question
                </Button>
              </div>
            </div>
          ))}

          {/* Add Section Button */}
          <Button
            variant="outline"
            onClick={addSection}
            className="w-full h-14 border-dashed border-2 text-neutral-500"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Section
          </Button>
        </div>
      </div>

      {/* Regenerate Dialog */}
      <Dialog open={showRegenerateDialog} onOpenChange={setShowRegenerateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate Guide?</DialogTitle>
            <DialogDescription>
              This will create a new interview guide based on your study setup. 
              Your current guide will be replaced.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRegenerateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRegenerate} className="bg-primary-600 hover:bg-primary-700">
              <Sparkles className="w-4 h-4 mr-2" />
              Regenerate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

