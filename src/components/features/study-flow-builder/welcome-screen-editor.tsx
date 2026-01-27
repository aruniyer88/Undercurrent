"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { WelcomeScreen } from "@/lib/types/study-flow";

interface WelcomeScreenEditorProps {
  data: WelcomeScreen;
  errors?: {
    title?: string;
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
  return (
    <TooltipProvider>
      <div className="bg-surface rounded-xl border border-border-subtle p-6 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-border-subtle">
          <h2 className="text-h3 text-text-primary">Welcome Screen</h2>
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
                The first thing participants see when they open the interview
                link. Set the tone and let them know what to expect.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Welcome Title */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Label htmlFor="welcomeTitle" className="text-base font-medium">
              Welcome Title <span className="text-danger-600">*</span>
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
                <p>The headline participants see when they start the interview</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Input
            id="welcomeTitle"
            value={data.title}
            onChange={(e) => onChange("title", e.target.value)}
            placeholder="e.g., Welcome to our feedback session"
            maxLength={200}
            className={cn(
              touched && errors?.title && "border-danger-600 focus:ring-danger-600"
            )}
          />
          {touched && errors?.title && (
            <p className="text-caption text-danger-600">{errors.title}</p>
          )}
        </div>

        {/* Welcome Message */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Label htmlFor="welcomeMessage" className="text-base font-medium">
              Welcome Message <span className="text-danger-600">*</span>
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
                  Set the tone and let participants know what to expect. Keep it
                  warm and concise.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Textarea
            id="welcomeMessage"
            value={data.message}
            onChange={(e) => onChange("message", e.target.value)}
            placeholder="e.g., Thank you for taking the time to share your thoughts with us. This conversation will take about 10-15 minutes..."
            rows={4}
            className={cn(
              "resize-none",
              touched && errors?.message && "border-danger-600 focus:ring-danger-600"
            )}
          />
          {touched && errors?.message && (
            <p className="text-caption text-danger-600">{errors.message}</p>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
