"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { RankingItem, ItemValidationErrors } from "@/lib/types/study-flow";

interface RankingEditorProps {
  item: RankingItem;
  errors?: ItemValidationErrors;
  touched?: boolean;
  onUpdate: (updates: Partial<RankingItem>) => void;
}

export function RankingEditor({
  item,
  errors,
  touched,
  onUpdate,
}: RankingEditorProps) {
  const handleAddItem = () => {
    if (item.items.length >= 7) return;
    onUpdate({ items: [...item.items, ""] });
  };

  const handleUpdateItem = (index: number, value: string) => {
    const newItems = [...item.items];
    newItems[index] = value;
    onUpdate({ items: newItems });
  };

  const handleRemoveItem = (index: number) => {
    if (item.items.length <= 2) return;
    onUpdate({ items: item.items.filter((_, i) => i !== index) });
  };

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Question Text */}
        <div className="space-y-2">
          <Textarea
            id={`question-${item.id}`}
            value={item.questionText}
            onChange={(e) => onUpdate({ questionText: e.target.value })}
            placeholder="e.g., Please rank these features from most to least important"
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

        {/* Items to Rank */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5">
            <Label>Items to Rank</Label>
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
                  Participants will drag and drop these items to rank them. Keep
                  to 7 or fewer items for best experience.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          {item.items.map((rankItem, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={rankItem}
                onChange={(e) => handleUpdateItem(index, e.target.value)}
                placeholder={`Item ${index + 1}`}
                className="flex-1 h-8 px-2 py-1"
              />
              <button
                type="button"
                onClick={() => handleRemoveItem(index)}
                disabled={item.items.length <= 2}
                className="p-1 text-text-muted hover:text-danger-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Remove item"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleAddItem}
              disabled={item.items.length >= 7}
              className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </button>
            <span className="text-caption text-text-muted">
              {item.items.length}/7 items
            </span>
          </div>
          {touched && errors?.items && (
            <p className="text-caption text-danger-600">{errors.items}</p>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
