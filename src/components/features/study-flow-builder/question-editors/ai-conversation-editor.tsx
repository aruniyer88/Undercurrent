"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  AIConversationItem,
  AIConversationDuration,
  AIConversationBasis,
  ItemValidationErrors,
} from "@/lib/types/study-flow";

interface AIConversationEditorProps {
  item: AIConversationItem;
  errors?: ItemValidationErrors;
  touched?: boolean;
  onUpdate: (updates: Partial<AIConversationItem>) => void;
}

const DURATION_OPTIONS: { value: AIConversationDuration; label: string }[] = [
  { value: 30, label: "30 seconds" },
  { value: 60, label: "1 minute" },
  { value: 120, label: "2 minutes" },
  { value: 180, label: "3 minutes" },
  { value: 240, label: "4 minutes" },
  { value: 300, label: "5 minutes" },
];

export function AIConversationEditor({
  item,
  errors,
  touched,
  onUpdate,
}: AIConversationEditorProps) {
  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Conversation Duration */}
        <div className="space-y-2">
          <Label>Conversation Duration</Label>
          <Select
            value={item.durationSeconds.toString()}
            onValueChange={(value) =>
              onUpdate({ durationSeconds: parseInt(value) as AIConversationDuration })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DURATION_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value.toString()}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Conversation Basis */}
        <div className="space-y-2">
          <Label>Conversation Basis</Label>
          <Select
            value={item.basis}
            onValueChange={(value) =>
              onUpdate({ basis: value as AIConversationBasis })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="prior_answers">
                Based on prior answers in this interview
              </SelectItem>
              <SelectItem value="custom">
                Using custom instructions below
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Custom Instructions */}
        {item.basis === "custom" && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Label htmlFor={`custom-instructions-${item.id}`}>
                Custom Instructions
              </Label>
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
                    Guide the AI on what to explore during this conversation. You
                    can specify: topics to cover, specific angles to probe,
                    sentiments to explore, comparisons to make, or areas to
                    avoid.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Textarea
              id={`custom-instructions-${item.id}`}
              value={item.customInstructions}
              onChange={(e) => onUpdate({ customInstructions: e.target.value })}
              placeholder="e.g., Explore their emotional reaction to the new packaging design. Ask about first impressions, what stands out, and whether it changes their perception of the brand."
              className={cn(
                touched && errors?.customInstructions && "border-danger-600"
              )}
            />
            {touched && errors?.customInstructions && (
              <p className="text-caption text-danger-600">
                {errors.customInstructions}
              </p>
            )}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
