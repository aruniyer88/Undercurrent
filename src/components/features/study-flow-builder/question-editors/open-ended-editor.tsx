"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  OpenEndedItem,
  ProbingMode,
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
  const handleAddProbe = () => {
    onUpdate({ customProbes: [...item.customProbes, ""] });
  };

  const handleUpdateProbe = (index: number, value: string) => {
    const newProbes = [...item.customProbes];
    newProbes[index] = value;
    onUpdate({ customProbes: newProbes });
  };

  const handleRemoveProbe = (index: number) => {
    onUpdate({ customProbes: item.customProbes.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-4">
      {/* Question Text */}
      <div className="space-y-2">
        <Label htmlFor={`question-${item.id}`}>Question</Label>
        <Textarea
          id={`question-${item.id}`}
          value={item.questionText}
          onChange={(e) => onUpdate({ questionText: e.target.value })}
          placeholder="Enter your question here"
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

      {/* Probing Mode */}
      <div className="space-y-2">
        <Label>Probing Instructions</Label>
        <Select
          value={item.probingMode}
          onValueChange={(value) => onUpdate({ probingMode: value as ProbingMode })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="disabled">Disabled - No follow-up probing</SelectItem>
            <SelectItem value="auto">Auto - Let AI probe automatically</SelectItem>
            <SelectItem value="custom">Custom - Provide specific probes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Custom Probes */}
      {item.probingMode === "custom" && (
        <div className="space-y-3">
          <Label>Custom Probes</Label>
          {item.customProbes.map((probe, index) => (
            <div key={index} className="flex items-center gap-2">
              <Textarea
                value={probe}
                onChange={(e) => handleUpdateProbe(index, e.target.value)}
                placeholder={`Probe ${index + 1}: e.g., "Can you tell me more about that?"`}
                rows={1}
                className="resize-none flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveProbe(index)}
                className="text-text-muted hover:text-danger-600"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddProbe}
            className="gap-1"
          >
            <Plus className="w-4 h-4" />
            Add Probe
          </Button>
          {touched && errors?.customProbes && (
            <p className="text-caption text-danger-600">{errors.customProbes}</p>
          )}
        </div>
      )}

      {/* Response Mode */}
      <div className="space-y-2">
        <Label>Response Mode</Label>
        <Select
          value={item.responseMode}
          onValueChange={(value) =>
            onUpdate({ responseMode: value as "voice" | "text" })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="voice">Voice - Participant speaks their response</SelectItem>
            <SelectItem value="text">Text - Participant types their response</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
