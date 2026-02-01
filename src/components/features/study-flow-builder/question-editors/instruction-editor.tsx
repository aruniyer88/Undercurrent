"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { InstructionItem, ItemValidationErrors } from "@/lib/types/study-flow";

interface InstructionEditorProps {
  item: InstructionItem;
  errors?: ItemValidationErrors;
  touched?: boolean;
  onUpdate: (updates: Partial<InstructionItem>) => void;
}

export function InstructionEditor({
  item,
  errors,
  touched,
  onUpdate,
}: InstructionEditorProps) {
  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Instruction Content */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Label htmlFor={`instruction-${item.id}`}>Instruction Text</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="text-text-muted hover:text-text-primary transition-colors"
                >
                  <Info className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                <p>
                  Instructions are displayed on screen and read aloud by the AI
                  interviewer. Use them to provide context or transition between
                  sections.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Textarea
            id={`instruction-${item.id}`}
            value={item.content}
            onChange={(e) => onUpdate({ content: e.target.value })}
            placeholder="e.g., In the next section, we'll show you a prototype. Please take your time to explore it before answering questions."
            className={cn(
              touched && errors?.content && "border-danger-600"
            )}
          />
          {touched && errors?.content && (
            <p className="text-caption text-danger-600">{errors.content}</p>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
