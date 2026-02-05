"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, Mic, Video } from "lucide-react";
import { cn } from "@/lib/utils";

interface InterviewModeSelectorProps {
  interviewMode: "voice" | "video";
  cameraRequired: boolean;
  onInterviewModeChange: (mode: "voice" | "video") => void;
  onCameraRequiredChange: (required: boolean) => void;
}

export function InterviewModeSelector({
  interviewMode,
  cameraRequired,
  onInterviewModeChange,
  onCameraRequiredChange,
}: InterviewModeSelectorProps) {
  return (
    <div className="bg-surface rounded-xl border border-border-subtle p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Label className="text-sm font-medium text-text-primary">
          Interview Mode <span className="text-danger-600">*</span>
        </Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="text-text-tertiary hover:text-text-secondary transition-colors"
              >
                <Info className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">
                Choose whether participants will respond using voice only or
                with video recording. This applies to the entire interview.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Interview Mode Selection */}
      <RadioGroup
        value={interviewMode}
        onValueChange={onInterviewModeChange}
        className="space-y-3"
      >
        {/* Voice Option */}
        <div className="flex items-start gap-3">
          <RadioGroupItem value="voice" id="voice-mode" className="mt-0.5" />
          <div className="flex items-start gap-2 flex-1">
            <Mic className="w-4 h-4 text-text-muted mt-0.5 flex-shrink-0" />
            <label
              htmlFor="voice-mode"
              className="flex-1 cursor-pointer space-y-0.5"
            >
              <div className="font-medium text-text-primary text-sm">
                Voice Interview
              </div>
              <p className="text-sm text-text-muted">
                Audio recording with transcription
              </p>
            </label>
          </div>
        </div>

        {/* Video Option */}
        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <RadioGroupItem value="video" id="video-mode" className="mt-0.5" />
            <div className="flex items-start gap-2 flex-1">
              <Video className="w-4 h-4 text-text-muted mt-0.5 flex-shrink-0" />
              <label
                htmlFor="video-mode"
                className="flex-1 cursor-pointer space-y-0.5"
              >
                <div className="font-medium text-text-primary text-sm">
                  Video Interview
                </div>
                <p className="text-sm text-text-muted">
                  Video recording with visual responses
                </p>
              </label>
            </div>
          </div>

          {/* Camera Toggle - Inline under video option */}
          {interviewMode === "video" && (
            <div className="pl-6 pt-2 flex items-center gap-2">
              <Label
                htmlFor="camera-required"
                className="text-sm text-text-primary cursor-pointer"
              >
                Require camera always on
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="text-text-tertiary hover:text-text-secondary transition-colors"
                    >
                      <Info className="h-3 w-3" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      {cameraRequired
                        ? "Participants must keep their camera on. Interview pauses if camera is turned off."
                        : "Camera is optional. Participants can turn off camera during interview."}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <button
                id="camera-required"
                type="button"
                role="switch"
                aria-checked={cameraRequired}
                onClick={() => onCameraRequiredChange(!cameraRequired)}
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-border focus-visible:ring-offset-2 flex-shrink-0",
                  cameraRequired ? "bg-primary-600" : "bg-input"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm",
                    cameraRequired ? "translate-x-6" : "translate-x-0.5"
                  )}
                />
              </button>
            </div>
          )}
        </div>
      </RadioGroup>
    </div>
  );
}
