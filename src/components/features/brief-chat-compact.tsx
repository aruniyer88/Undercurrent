"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { BriefMessage } from "@/lib/types/database";
import { ArrowUp } from "lucide-react";

const EXAMPLE_PROMPTS = [
  "I want to understand why users churn after the first month...",
  "What motivates customers to upgrade to our premium plan?",
  "How do new users discover and adopt key features?",
  "Why are users abandoning their shopping carts?",
  "What pain points do users experience during onboarding?",
  "How do power users differ from casual users?",
  "What drives customer satisfaction in our support experience?",
];

const TYPING_SPEED = 50; // ms per character
const PAUSE_AFTER_COMPLETE = 2500; // ms to show complete text
const PAUSE_BEFORE_NEXT = 500; // ms between prompts

export function BriefChatCompact() {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Typewriter state
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  // Typewriter effect
  useEffect(() => {
    if (input || isFocused) return; // Don't animate when user is typing or focused

    const currentPrompt = EXAMPLE_PROMPTS[currentPromptIndex];
    let timeoutId: NodeJS.Timeout;

    if (isTyping) {
      if (displayedText.length < currentPrompt.length) {
        // Still typing
        timeoutId = setTimeout(() => {
          setDisplayedText(currentPrompt.slice(0, displayedText.length + 1));
        }, TYPING_SPEED);
      } else {
        // Finished typing, pause then move to next
        timeoutId = setTimeout(() => {
          setIsTyping(false);
        }, PAUSE_AFTER_COMPLETE);
      }
    } else {
      // Clear and move to next prompt
      timeoutId = setTimeout(() => {
        setDisplayedText("");
        setCurrentPromptIndex((prev) => (prev + 1) % EXAMPLE_PROMPTS.length);
        setIsTyping(true);
      }, PAUSE_BEFORE_NEXT);
    }

    return () => clearTimeout(timeoutId);
  }, [displayedText, isTyping, currentPromptIndex, input, isFocused]);

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.max(120, textarea.scrollHeight)}px`;
    }
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [input, adjustTextareaHeight]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!input.trim() || isLoading) return;

    const userMessage: BriefMessage = {
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setIsLoading(true);
    const promptText = input.trim();
    setInput("");

    try {
      const supabase = createClient();

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Not authenticated');
      }

      const { data: study, error } = await supabase
        .from("studies")
        .insert({
          user_id: user.id,
          title: generateStudyTitle(promptText),
          status: "draft",
          brief_messages: [userMessage],
          objective: promptText,
          topics: [],
          success_criteria: "",
          context: "",
          guidelines: "Maintain a conversational, non-leading approach. Ask follow-up questions to go deeper.",
          intro_text: "Thank you for taking the time to share your thoughts with us today.",
        })
        .select()
        .single();

      if (!error && study) {
        router.push(`/studies/${study.id}/flow`);
      } else {
        console.error("Error creating study:", error);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error:", error);
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const showPlaceholder = !input && !isFocused;

  return (
    <div className="space-y-4">
      {/* Header outside the box */}
      <h1 className="text-[20px] font-bold text-text-primary tracking-tight">
        What do you want to research?
      </h1>

      {/* Input Box */}
      <div className="relative">
        <div
          className={`
            bg-surface border rounded-lg shadow-sm transition-all duration-200
            ${isFocused
              ? "border-primary-400 ring-2 ring-primary-100"
              : "border-border-subtle hover:border-border-default"
            }
          `}
        >
          <form onSubmit={handleSubmit} className="relative">
            {/* Animated placeholder */}
            {showPlaceholder && (
              <div className="absolute inset-0 p-4 pointer-events-none">
                <span className="text-text-muted text-body">
                  {displayedText}
                  <span className="inline-block w-[2px] h-[1.1em] bg-text-muted/40 ml-[1px] animate-pulse align-text-bottom" />
                </span>
              </div>
            )}

            {/* Actual textarea */}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              disabled={isLoading}
              className={`
                w-full min-h-[120px] p-4 pr-24
                bg-transparent resize-none
                text-text-primary text-body
                placeholder-transparent
                focus:outline-none
                disabled:cursor-not-allowed disabled:opacity-50
              `}
              aria-label="Describe your research goal"
            />

            {/* Submit button */}
            <div className="absolute bottom-3 right-3">
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="p-2 rounded-md transition-all duration-200 disabled:bg-surface-alt disabled:cursor-not-allowed [&:not(:disabled)]:bg-[#0061FF] [&:not(:disabled)]:hover:bg-[#0050D6] [&:not(:disabled)]:shadow-sm"
                aria-label="Submit"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <ArrowUp
                    className={`w-5 h-5 transition-colors ${input.trim() ? "text-white" : "text-text-muted"}`}
                  />
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Helper text */}
        <p className="text-caption text-text-muted mt-2 ml-1">
          Press <kbd className="px-1.5 py-0.5 text-[11px] font-medium bg-surface-alt border border-border-subtle rounded">Enter</kbd> to create study · <kbd className="px-1.5 py-0.5 text-[11px] font-medium bg-surface-alt border border-border-subtle rounded">Shift + Enter</kbd> for new line
        </p>
      </div>
    </div>
  );
}

// Helper function
function generateStudyTitle(content: string): string {
  // Simple extraction - take first 50 chars and clean up
  const title = content.slice(0, 50).replace(/[^\w\s]/g, "").trim();
  return title.length > 0 ? title : "Untitled Study";
}
