"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

      {/* Labels */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`low-label-${item.id}`}>Lowest rating label</Label>
          <Input
            id={`low-label-${item.id}`}
            value={item.lowLabel}
            onChange={(e) => onUpdate({ lowLabel: e.target.value })}
            placeholder="e.g., Not satisfied"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`high-label-${item.id}`}>Highest rating label</Label>
          <Input
            id={`high-label-${item.id}`}
            value={item.highLabel}
            onChange={(e) => onUpdate({ highLabel: e.target.value })}
            placeholder="e.g., Very satisfied"
          />
        </div>
      </div>
    </div>
  );
}
