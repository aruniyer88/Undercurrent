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
    console.log('[DEBUG] handleSubmit called', { inputLength: input.length, inputTrimmed: input.trim().length, isLoading });
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a4513daa-fb0a-4846-8a91-6329ec3b738e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'brief-chat-compact.tsx:80',message:'handleSubmit called',data:{inputLength:input.length,inputTrimmed:input.trim().length,isLoading},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    e?.preventDefault();
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a4513daa-fb0a-4846-8a91-6329ec3b738e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'brief-chat-compact.tsx:82',message:'Validation check',data:{inputTrimmed:input.trim(),isEmpty:!input.trim(),isLoading},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    if (!input.trim() || isLoading) {
      console.log('[DEBUG] Validation failed - early return', { inputTrimmed: input.trim(), isEmpty: !input.trim(), isLoading });
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a4513daa-fb0a-4846-8a91-6329ec3b738e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'brief-chat-compact.tsx:83',message:'Validation failed - early return',data:{inputTrimmed:input.trim(),isEmpty:!input.trim(),isLoading},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      return;
    }

    const userMessage: BriefMessage = {
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setIsLoading(true);
    const promptText = input.trim();
    setInput("");

    try {
      console.log('[DEBUG] Before Supabase insert', { promptText, title: generateStudyTitle(promptText) });
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a4513daa-fb0a-4846-8a91-6329ec3b738e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'brief-chat-compact.tsx:96',message:'Before Supabase insert',data:{promptText,title:generateStudyTitle(promptText)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      // Create a new study with the brief message
      const supabase = createClient();
      
      // Get the current authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('[DEBUG] Auth error - no user', { authError });
        throw new Error('Not authenticated');
      }
      
      console.log('[DEBUG] Got user ID', { userId: user.id });
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a4513daa-fb0a-4846-8a91-6329ec3b738e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'brief-chat-compact.tsx:115',message:'Got user ID',data:{userId:user.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      
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
          audience: "",
          guidelines: "Maintain a conversational, non-leading approach. Ask follow-up questions to go deeper.",
          intro_text: "Thank you for taking the time to share your thoughts with us today.",
        })
        .select()
        .single();

      console.log('[DEBUG] After Supabase insert', { hasError: !!error, errorMessage: error?.message, errorCode: error?.code, hasStudy: !!study, studyId: study?.id });
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a4513daa-fb0a-4846-8a91-6329ec3b738e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'brief-chat-compact.tsx:113',message:'After Supabase insert',data:{hasError:!!error,errorMessage:error?.message,errorCode:error?.code,hasStudy:!!study,studyId:study?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion

      if (!error && study) {
        console.log('[DEBUG] Before router.push', { studyId: study.id, path: `/studies/${study.id}/setup` });
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/a4513daa-fb0a-4846-8a91-6329ec3b738e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'brief-chat-compact.tsx:115',message:'Before router.push',data:{studyId:study.id,path:`/studies/${study.id}/setup`},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        // Navigate to study setup
        router.push(`/studies/${study.id}/setup`);
        console.log('[DEBUG] After router.push', { studyId: study.id });
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/a4513daa-fb0a-4846-8a91-6329ec3b738e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'brief-chat-compact.tsx:116',message:'After router.push',data:{studyId:study.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
      } else {
        console.error('[DEBUG] Supabase error - not navigating', { errorMessage: error?.message, errorCode: error?.code, errorDetails: error });
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/a4513daa-fb0a-4846-8a91-6329ec3b738e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'brief-chat-compact.tsx:117',message:'Supabase error - not navigating',data:{errorMessage:error?.message,errorCode:error?.code,errorDetails:error},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        console.error("Error creating study:", error);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('[DEBUG] Catch block - exception thrown', { errorMessage: error instanceof Error ? error.message : String(error), errorStack: error instanceof Error ? error.stack : undefined });
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a4513daa-fb0a-4846-8a91-6329ec3b738e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'brief-chat-compact.tsx:120',message:'Catch block - exception thrown',data:{errorMessage:error instanceof Error?error.message:String(error),errorStack:error instanceof Error?error.stack:undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      console.error("Error:", error);
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    console.log('[DEBUG] handleKeyDown called', { key: e.key, shiftKey: e.shiftKey, willSubmit: e.key === 'Enter' && !e.shiftKey });
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a4513daa-fb0a-4846-8a91-6329ec3b738e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'brief-chat-compact.tsx:126',message:'handleKeyDown called',data:{key:e.key,shiftKey:e.shiftKey,willSubmit:e.key==='Enter'&&!e.shiftKey},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
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
          <form onSubmit={(e)=>{console.log('[DEBUG] Form onSubmit event fired');fetch('http://127.0.0.1:7242/ingest/a4513daa-fb0a-4846-8a91-6329ec3b738e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'brief-chat-compact.tsx:153',message:'Form onSubmit event fired',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});handleSubmit(e);}} className="relative">
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
                className="p-2 rounded-md transition-all duration-200 disabled:bg-surface-alt disabled:cursor-not-allowed [&:not(:disabled)]:bg-[#2563EB] [&:not(:disabled)]:hover:bg-[#1D4ED8] [&:not(:disabled)]:shadow-sm"
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
