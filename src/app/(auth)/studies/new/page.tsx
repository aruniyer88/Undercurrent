"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, Sparkles, Wrench, X, Paperclip } from "lucide-react";

type CreationStep = "choice" | "ai";

const placeholderExamples = [
  "Test a new campaign idea and ask for honest reactions from your audience.",
  "Ask your community how they perceive your brand and what feels unclear or missing.",
  "Collect candid feedback on a course, lesson, or learning experience in your own voice.",
  "Gauge sentiment on a strategy, cultural change, or internal initiative before scaling.",
];

export default function NewProjectPage() {
  const router = useRouter();
  const [step, setStep] = useState<CreationStep>("choice");
  const [aiPrompt, setAiPrompt] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const [showCursor, setShowCursor] = useState(true);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Handle "Start from scratch" click - navigates to wizard
  const handleStartManual = () => {
    router.push("/studies/wizard");
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);

    // Read text files directly
    if (file.type === "text/plain") {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setAiPrompt(text);
      };
      reader.readAsText(file);
    } else {
      // For PDF and Word docs, show filename and let backend handle processing
      setAiPrompt(`[File attached: ${file.name}]\n\nPlease describe what you'd like to accomplish with this document...`);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setAiPrompt("");
  };

  // Typing animation effect
  useEffect(() => {
    if (step !== "ai") return;

    const currentExample = placeholderExamples[placeholderIndex];
    const words = currentExample.split(" ");

    if (wordIndex < words.length) {
      setIsTyping(true);
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => {
          const newText = prev ? prev + " " + words[wordIndex] : words[wordIndex];
          return newText;
        });
        setWordIndex(wordIndex + 1);
      }, 80); // 80ms between words for smooth typing

      return () => clearTimeout(timeout);
    } else {
      setIsTyping(false);
      // Wait 3 seconds after completing, then move to next example
      const timeout = setTimeout(() => {
        setDisplayedText("");
        setWordIndex(0);
        setPlaceholderIndex((prev) => (prev + 1) % placeholderExamples.length);
      }, 3000);

      return () => clearTimeout(timeout);
    }
  }, [step, placeholderIndex, wordIndex]);

  // Cursor blinking effect
  useEffect(() => {
    if (step !== "ai" || !isTyping) {
      setShowCursor(false);
      return;
    }

    const interval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 500); // Blink every 500ms

    return () => clearInterval(interval);
  }, [step, isTyping]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fafafa' }}>
      <button
        type="button"
        onClick={() => router.push("/dashboard")}
        className="fixed right-8 top-8 z-50 h-9 w-9 rounded-md flex items-center justify-center text-text-primary hover:bg-surface-alt hover:text-icon-strong transition-colors focus:outline-none focus:ring-2 focus:ring-primary-border"
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="min-h-screen flex items-center justify-center px-6 py-12">
        {step === "choice" && (
          <div className="space-y-8 text-center max-w-4xl mx-auto">
            <div className="space-y-2">
              <h1 className="text-h1 text-text-primary">New Project</h1>
              <p className="text-body text-text-muted">
                How do you want to get started?
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 justify-items-center">
              <button
                type="button"
                onClick={() => setStep("ai")}
                className="w-full md:w-56 aspect-square p-5 rounded-xl border border-border-subtle bg-surface hover:bg-surface-alt hover:border-border-strong hover:shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary-border flex flex-col items-center justify-center text-center"
              >
                <div className="w-10 h-10 rounded-md bg-surface-alt flex items-center justify-center mb-4">
                  <Sparkles className="w-5 h-5 text-primary-600" />
                </div>
                <h2 className="text-h3 text-text-primary mb-2">Start with AI</h2>
                <p className="text-body text-text-muted">
                  Build your project in seconds with our AI setup assistant
                </p>
              </button>

              <button
                type="button"
                onClick={handleStartManual}
                className="w-full md:w-56 aspect-square p-5 rounded-xl border border-border-subtle bg-surface hover:bg-surface-alt hover:border-border-strong hover:shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary-border flex flex-col items-center justify-center text-center"
              >
                <div className="w-10 h-10 rounded-md bg-surface-alt flex items-center justify-center mb-4">
                  <Wrench className="w-5 h-5 text-primary-600" />
                </div>
                <h2 className="text-h3 text-text-primary mb-2">Start from scratch</h2>
                <p className="text-body text-text-muted">
                  Build your project from scratch with your own tasks &amp; questions
                </p>
              </button>
            </div>
          </div>
        )}

        {step === "ai" && (
          <div className="max-w-4xl mx-auto w-full">
            <div className="space-y-2 mb-6">
              <h1 className="text-h1 text-text-primary">
                Tell us about your project
              </h1>
            </div>

            <div className="space-y-3">
              <div className="flex items-end gap-3">
                <div className="relative flex-1">
                  <Textarea
                    value={aiPrompt}
                    onChange={(event) => setAiPrompt(event.target.value)}
                    placeholder={displayedText + (isTyping && showCursor ? "|" : "")}
                    className="min-h-[260px] resize-none"
                  />
                  <div className="absolute bottom-3 left-3 flex items-center gap-2">
                    <input
                      type="file"
                      id="file-upload"
                      accept=".txt,.pdf,.doc,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <label htmlFor="file-upload">
                      <button
                        type="button"
                        onClick={() => document.getElementById('file-upload')?.click()}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-md text-caption text-text-muted hover:text-text-primary hover:bg-surface-alt transition-colors"
                      >
                        <Paperclip className="w-4 h-4" />
                        <span>Attach file</span>
                      </button>
                    </label>
                  </div>
                </div>
                <Button size="icon" aria-label="Submit project details">
                  <ArrowRight />
                </Button>
              </div>

              {uploadedFile && (
                <div className="flex items-center gap-2 px-4 py-2 bg-surface-alt rounded-md border border-border-subtle">
                  <Paperclip className="w-4 h-4 text-text-muted" />
                  <span className="text-body text-text-primary flex-1">{uploadedFile.name}</span>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="text-text-muted hover:text-danger-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
