"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { SingleSelectItem, ItemValidationErrors } from "@/lib/types/study-flow";

interface SingleSelectEditorProps {
  item: SingleSelectItem;
  errors?: ItemValidationErrors;
  touched?: boolean;
  onUpdate: (updates: Partial<SingleSelectItem>) => void;
}

export function SingleSelectEditor({
  item,
  errors,
  touched,
  onUpdate,
}: SingleSelectEditorProps) {
  const handleAddOption = () => {
    onUpdate({ options: [...item.options, ""] });
  };

  const handleUpdateOption = (index: number, value: string) => {
    const newOptions = [...item.options];
    newOptions[index] = value;
    onUpdate({ options: newOptions });
  };

  const handleRemoveOption = (index: number) => {
    if (item.options.length <= 2) return;
    onUpdate({ options: item.options.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-4">
      {/* Question Text */}
      <div className="space-y-2">
        <Textarea
          id={`question-${item.id}`}
          value={item.questionText}
          onChange={(e) => onUpdate({ questionText: e.target.value })}
          placeholder="e.g., Which of these best describes your role?"
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

      {/* Options */}
      <div className="space-y-3">
        <Label>Options</Label>
        {item.options.map((option, index) => (
          <div key={index} className="flex items-center gap-2">
            <GripVertical className="w-4 h-4 text-text-muted cursor-grab" />
            <Input
              value={option}
              onChange={(e) => handleUpdateOption(index, e.target.value)}
              placeholder={`Option ${index + 1}`}
              className="flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleRemoveOption(index)}
              disabled={item.options.length <= 2}
              className="text-text-muted hover:text-danger-600 disabled:opacity-50"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ))}
        <button
          type="button"
          onClick={handleAddOption}
          className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text-primary transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Option
        </button>
        {touched && errors?.options && (
          <p className="text-caption text-danger-600">{errors.options}</p>
        )}
      </div>
    </div>
  );
}
