"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createClient } from "@/lib/supabase/client";
import { BriefMessage } from "@/lib/types/database";
import { Send, Loader2, Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatState {
  messages: BriefMessage[];
  isLoading: boolean;
  canContinue: boolean;
  studyId: string | null;
}

export function BriefChat() {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const [input, setInput] = useState("");
  const [state, setState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    canContinue: false,
    studyId: null,
  });

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [state.messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim() || state.isLoading) return;

    const userMessage: BriefMessage = {
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
    }));
    setInput("");

    // Simulate AI response (in production, this would call an API)
    await simulateAIResponse([...state.messages, userMessage]);
  };

  const simulateAIResponse = async (messages: BriefMessage[]) => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    let aiResponse: BriefMessage;
    let canContinue = false;
    let studyId = state.studyId;

    // Simple state machine for the conversation
    const messageCount = messages.filter((m) => m.role === "user").length;

    if (messageCount === 1) {
      // First message - acknowledge and ask clarifying question
      aiResponse = {
        role: "assistant",
        content: "That's a great research goal! To help you set this up properly, could you tell me a bit more about who you want to interview? For example, are they customers, students, employees, or another group?",
        timestamp: new Date().toISOString(),
      };
    } else if (messageCount === 2) {
      // Second message - ask about success criteria
      aiResponse = {
        role: "assistant",
        content: "Perfect. And what would make this research successful for you? What specific insights or decisions are you hoping to inform with this study?",
        timestamp: new Date().toISOString(),
      };
    } else {
      // Third message - ready to continue
      aiResponse = {
        role: "assistant",
        content: "Great! I have enough information to create a structured study setup for you. I'll generate:\n\n• A clear research objective\n• Key topics to explore\n• Success criteria\n• Audience description\n• Interview guidelines\n\nClick \"Continue to study setup\" when you're ready to review and customize these.",
        timestamp: new Date().toISOString(),
      };
      canContinue = true;

      // Create the study in the database
      const supabase = createClient();
      const { data: study, error } = await supabase
        .from("studies")
        .insert({
          title: generateStudyTitle(messages),
          status: "draft",
          brief_messages: [...messages, aiResponse],
          // These would be AI-generated in production
          objective: extractObjective(messages),
          topics: ["Topic 1", "Topic 2", "Topic 3"],
          success_criteria: "Gather actionable insights that inform key decisions.",
          audience: extractAudience(messages),
          guidelines: "Maintain a conversational, non-leading approach. Ask follow-up questions to go deeper.",
          intro_text: "Thank you for taking the time to share your thoughts with us today.",
        })
        .select()
        .single();

      if (!error && study) {
        studyId = study.id;
      }
    }

    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, aiResponse],
      isLoading: false,
      canContinue,
      studyId,
    }));
  };

  const handleContinue = () => {
    if (state.studyId) {
      router.push(`/studies/${state.studyId}/setup`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[500px]">
      {/* Messages Area */}
      <ScrollArea className="flex-1 px-4" ref={scrollRef}>
        <div className="py-4 space-y-4">
          {state.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-center">
              <div className="w-14 h-14 rounded-lg bg-primary-50 flex items-center justify-center mb-4">
                <Sparkles className="w-7 h-7 text-primary-600" />
              </div>
              <h3 className="text-h3 text-text-primary mb-2">
                What do you want to learn?
              </h3>
              <p className="text-body text-text-muted max-w-md">
                Describe your research goals in your own words. For example: 
                &quot;I want to understand why users are churning after the first month.&quot;
              </p>
            </div>
          ) : (
            state.messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] whitespace-pre-wrap",
                    message.role === "user"
                      ? "chat-bubble-user"
                      : "chat-bubble-ai"
                  )}
                >
                  <p className="text-body text-text-primary leading-relaxed">
                    {message.content}
                  </p>
                </div>
              </div>
            ))
          )}

          {/* Loading indicator */}
          {state.isLoading && (
            <div className="flex justify-start">
              <div className="chat-bubble-ai">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary-600" />
                  <span className="text-body text-text-muted">Thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Continue Button */}
      {state.canContinue && (
        <div className="px-4 py-3 border-t border-border-subtle bg-primary-50/50">
          <Button
            onClick={handleContinue}
            className="w-full h-9"
          >
            Continue to study setup
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}

      {/* Input Area */}
      <div className="px-4 py-4 border-t border-border-subtle bg-surface">
        <div className="flex items-end gap-3">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what you want to learn... e.g., 'I want to understand why users are dropping off during onboarding'"
            className="min-h-[44px] max-h-[200px] resize-none"
            rows={1}
            disabled={state.isLoading || state.canContinue}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || state.isLoading || state.canContinue}
            size="icon"
            className="h-9 w-9"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
        <p className="text-caption text-text-muted mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

// Helper functions (would be AI-powered in production)
function generateStudyTitle(messages: BriefMessage[]): string {
  const firstUserMessage = messages.find((m) => m.role === "user");
  if (!firstUserMessage) return "Untitled Study";
  
  const content = firstUserMessage.content;
  // Simple extraction - take first 50 chars and clean up
  const title = content.slice(0, 50).replace(/[^\w\s]/g, "").trim();
  return title.length > 0 ? title : "Untitled Study";
}

function extractObjective(messages: BriefMessage[]): string {
  const firstUserMessage = messages.find((m) => m.role === "user");
  return firstUserMessage?.content || "Understand user needs and experiences.";
}

function extractAudience(messages: BriefMessage[]): string {
  const audienceMessage = messages.filter((m) => m.role === "user")[1];
  return audienceMessage?.content || "Target audience to be defined.";
}
