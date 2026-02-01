"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { MultiSelectItem, ItemValidationErrors } from "@/lib/types/study-flow";

interface MultiSelectEditorProps {
  item: MultiSelectItem;
  errors?: ItemValidationErrors;
  touched?: boolean;
  onUpdate: (updates: Partial<MultiSelectItem>) => void;
}

export function MultiSelectEditor({
  item,
  errors,
  touched,
  onUpdate,
}: MultiSelectEditorProps) {
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
          placeholder="e.g., Which of the following features have you used? Select all that apply."
          rows={1}
          className={cn(
            "resize-none overflow-hidden",
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
            <Input
              value={option}
              onChange={(e) => handleUpdateOption(index, e.target.value)}
              placeholder={`Option ${index + 1}`}
              className="flex-1 h-8 px-2 py-1"
            />
            <button
              type="button"
              onClick={() => handleRemoveOption(index)}
              disabled={item.options.length <= 2}
              className="p-1 text-text-muted hover:text-danger-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Remove option"
            >
              <X className="w-4 h-4" />
            </button>
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
