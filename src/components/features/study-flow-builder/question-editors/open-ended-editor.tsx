"use client";

import { useState, useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Sparkles, Mic, Keyboard, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  OpenEndedItem,
  ItemValidationErrors,
} from "@/lib/types/study-flow";

interface OpenEndedEditorProps {
  item: OpenEndedItem;
  errors?: ItemValidationErrors;
  touched?: boolean;
  onUpdate: (updates: Partial<OpenEndedItem>) => void;
}

export function OpenEndedEditor({
  item,
  errors,
  touched,
  onUpdate,
}: OpenEndedEditorProps) {
  const [probingOpen, setProbingOpen] = useState(false);
  const [responseModeOpen, setResponseModeOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [item.questionText]);

  const ResponseModeIcon = item.responseMode === "voice" ? Mic : Keyboard;

  return (
    <div className="space-y-4">
      {/* Compact Question Text with Inline Icons */}
      <div className="space-y-2">
        <div className="relative">
          <Textarea
            ref={textareaRef}
            id={`question-${item.id}`}
            value={item.questionText}
            onChange={(e) => onUpdate({ questionText: e.target.value })}
            placeholder="Enter your question here"
            rows={1}
            className={cn(
              "resize-none overflow-hidden pr-20",
              touched && errors?.questionText && "border-danger-600"
            )}
          />

          {/* Icons Container - Right Side */}
          <div className="absolute right-2 top-2 flex items-center gap-2">
            {/* Probing Icon */}
            <TooltipProvider>
              <Tooltip>
                <Popover open={probingOpen} onOpenChange={setProbingOpen}>
                  <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="text-text-muted hover:text-primary-600 transition-colors"
                      >
                        <Sparkles className="w-5 h-5" />
                      </button>
                    </PopoverTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="text-xs">
                      AI Probing - Configure follow-up questions
                    </p>
                  </TooltipContent>
                  <PopoverContent align="end" className="w-64 p-2">
                    <div className="space-y-1">
                      <button
                        type="button"
                        onClick={() => {
                          onUpdate({ probingMode: "auto" });
                          setProbingOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm hover:bg-surface-alt transition-colors",
                          item.probingMode === "auto" && "bg-surface-alt"
                        )}
                      >
                        <span>Let AI probe on its own</span>
                        {item.probingMode === "auto" && (
                          <Check className="w-4 h-4 text-primary-600" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onUpdate({ probingMode: "disabled" });
                          setProbingOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm hover:bg-surface-alt transition-colors",
                          item.probingMode === "disabled" && "bg-surface-alt"
                        )}
                      >
                        <span>No follow-up probing</span>
                        {item.probingMode === "disabled" && (
                          <Check className="w-4 h-4 text-primary-600" />
                        )}
                      </button>
                    </div>
                  </PopoverContent>
                </Popover>
              </Tooltip>
            </TooltipProvider>

            {/* Response Mode Icon */}
            <TooltipProvider>
              <Tooltip>
                <Popover open={responseModeOpen} onOpenChange={setResponseModeOpen}>
                  <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="text-text-muted hover:text-primary-600 transition-colors"
                      >
                        <ResponseModeIcon className="w-5 h-5" />
                      </button>
                    </PopoverTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="text-xs">
                      Response Mode - How participants will answer
                    </p>
                  </TooltipContent>
                  <PopoverContent align="end" className="w-64 p-2">
                    <div className="space-y-1">
                      <button
                        type="button"
                        onClick={() => {
                          onUpdate({ responseMode: "voice" });
                          setResponseModeOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm hover:bg-surface-alt transition-colors",
                          item.responseMode === "voice" && "bg-surface-alt"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Mic className="w-4 h-4" />
                          <span>Voice - Speak response</span>
                        </div>
                        {item.responseMode === "voice" && (
                          <Check className="w-4 h-4 text-primary-600" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onUpdate({ responseMode: "text" });
                          setResponseModeOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm hover:bg-surface-alt transition-colors",
                          item.responseMode === "text" && "bg-surface-alt"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Keyboard className="w-4 h-4" />
                          <span>Text - Type response</span>
                        </div>
                        {item.responseMode === "text" && (
                          <Check className="w-4 h-4 text-primary-600" />
                        )}
                      </button>
                    </div>
                  </PopoverContent>
                </Popover>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {touched && errors?.questionText && (
          <p className="text-caption text-danger-600">{errors.questionText}</p>
        )}
      </div>
    </div>
  );
}
