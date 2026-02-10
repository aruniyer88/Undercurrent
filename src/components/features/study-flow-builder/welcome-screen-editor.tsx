"use client";

import { useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { WelcomeScreen } from "@/lib/types/study-flow";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface WelcomeScreenEditorProps {
  data: WelcomeScreen;
  errors?: {
    message?: string;
  };
  touched?: boolean;
  onChange: <K extends keyof WelcomeScreen>(field: K, value: WelcomeScreen[K]) => void;
}

export function WelcomeScreenEditor({
  data,
  errors,
  touched,
  onChange,
}: WelcomeScreenEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [data.message]);

  return (
    <div>
      <div className="bg-surface rounded-xl border border-border-subtle p-6 space-y-4">
        <div className="pb-2 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <h2 className="text-h3 text-text-primary">Participant Welcome Screen <span className="text-danger-600">*</span></h2>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="text-text-tertiary hover:text-text-secondary transition-colors">
                    <Info className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">The welcome screen is the first thing participants see when starting your study. Use it to greet them and explain what to expect.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="space-y-2">
          <Textarea
            ref={textareaRef}
            id="welcomeMessage"
            value={data.message}
            onChange={(e) => onChange("message", e.target.value)}
            placeholder="e.g., Thank you for taking the time to share your thoughts with us. This conversation will take about 10-15 minutes..."
            className={cn(
              touched && errors?.message && "border-danger-600 focus:ring-danger-600"
            )}
          />
          {touched && errors?.message && (
            <p className="text-caption text-danger-600">{errors.message}</p>
          )}
        </div>
      </div>
    </div>
  );
}
