"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NumberStepper } from "@/components/ui/number-stepper";
import { cn } from "@/lib/utils";
import { RatingScaleItem, ItemValidationErrors } from "@/lib/types/study-flow";

interface RatingScaleEditorProps {
  item: RatingScaleItem;
  errors?: ItemValidationErrors;
  touched?: boolean;
  onUpdate: (updates: Partial<RatingScaleItem>) => void;
}

export function RatingScaleEditor({
  item,
  errors,
  touched,
  onUpdate,
}: RatingScaleEditorProps) {
  // Generate scale preview
  const scaleNumbers = Array.from(
    { length: item.scaleSize },
    (_, i) => i + 1
  );

  return (
    <div className="space-y-4">
      {/* Question Text */}
      <div className="space-y-2">
        <Label htmlFor={`question-${item.id}`}>Question</Label>
        <Textarea
          id={`question-${item.id}`}
          value={item.questionText}
          onChange={(e) => onUpdate({ questionText: e.target.value })}
          placeholder="e.g., How satisfied are you with our customer support?"
          rows={2}
          className={cn(
            "resize-none",
            touched && errors?.questionText && "border-danger-600"
          )}
        />
        {touched && errors?.questionText && (
          <p className="text-caption text-danger-600">{errors.questionText}</p>
        )}
      </div>

      {/* Scale Size */}
      <div className="space-y-2">
        <Label>Scale Size (5-10)</Label>
        <div className="flex items-center gap-4">
          <NumberStepper
            value={item.scaleSize}
            onChange={(value) => onUpdate({ scaleSize: value })}
            min={5}
            max={10}
          />
        </div>
      </div>

      {/* Scale Preview */}
      <div className="space-y-2">
        <Label className="text-text-muted">Scale Preview</Label>
        <div className="flex items-center gap-2 p-3 bg-surface rounded-md border border-border-subtle">
          <span className="text-xs text-text-muted">{item.lowLabel}</span>
          <div className="flex-1 flex items-center justify-center gap-2">
            {scaleNumbers.map((num) => (
              <div
                key={num}
                className="w-8 h-8 rounded-full border border-border-subtle flex items-center justify-center text-sm text-text-muted"
              >
                {num}
              </div>
            ))}
          </div>
          <span className="text-xs text-text-muted">{item.highLabel}</span>
        </div>
      </div>

      {/* Labels */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`low-label-${item.id}`}>Low Label (1)</Label>
          <Input
            id={`low-label-${item.id}`}
            value={item.lowLabel}
            onChange={(e) => onUpdate({ lowLabel: e.target.value })}
            placeholder="Lowest rating"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`high-label-${item.id}`}>High Label ({item.scaleSize})</Label>
          <Input
            id={`high-label-${item.id}`}
            value={item.highLabel}
            onChange={(e) => onUpdate({ highLabel: e.target.value })}
            placeholder="Highest rating"
          />
        </div>
      </div>

      {/* Response Mode */}
      <div className="space-y-2">
        <Label>Response Mode</Label>
        <Select
          value={item.responseMode}
          onValueChange={(value) =>
            onUpdate({ responseMode: value as "screen" | "voice" })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="screen">On-screen Select</SelectItem>
            <SelectItem value="voice">Voice Response</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
