"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  GripVertical,
  Trash2,
  ChevronDown,
  ChevronRight,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Section,
  FlowItem,
  ItemType,
  SectionValidationErrors,
} from "@/lib/types/study-flow";

import { FlowItemCard } from "./flow-item-card";
import { AddItemMenu } from "./add-item-menu";
import { StimulusEditor } from "./stimulus-editor";

interface SectionCardProps {
  section: Section;
  sectionErrors?: SectionValidationErrors;
  touched?: boolean;
  canDelete: boolean;
  onUpdate: (updates: Partial<Section>) => void;
  onDelete: () => void;
  onAddItem: (type: ItemType) => void;
  onUpdateItem: (itemId: string, updates: Partial<FlowItem>) => void;
  onDeleteItem: (itemId: string) => void;
}

export function SectionCard({
  section,
  sectionErrors,
  touched,
  canDelete,
  onUpdate,
  onDelete,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
}: SectionCardProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showIntro, setShowIntro] = useState(!!section.intro);
  const [showStimulus, setShowStimulus] = useState(!!section.stimulus);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: section.id,
    data: { type: "section" },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleDeleteConfirm = () => {
    setShowDeleteDialog(false);
    onDelete();
  };

  const handleToggleIntro = () => {
    if (showIntro) {
      onUpdate({ intro: undefined });
    }
    setShowIntro(!showIntro);
  };

  const handleToggleStimulus = () => {
    if (showStimulus) {
      onUpdate({ stimulus: undefined });
    }
    setShowStimulus(!showStimulus);
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          "bg-surface rounded-xl border border-border-subtle",
          isDragging && "opacity-50 shadow-lg"
        )}
      >
        {/* Section Header */}
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <div className="flex items-center gap-3 p-4 border-b border-border-subtle">
            {/* Drag Handle */}
            <button
              type="button"
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing text-text-muted hover:text-text-primary"
            >
              <GripVertical className="w-5 h-5" />
            </button>

            {/* Collapse Toggle */}
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="text-text-muted hover:text-text-primary"
              >
                {isOpen ? (
                  <ChevronDown className="w-5 h-5" />
                ) : (
                  <ChevronRight className="w-5 h-5" />
                )}
              </button>
            </CollapsibleTrigger>

            {/* Section Title */}
            <div className="flex-1">
              <h3 className="text-body-strong text-text-primary">
                {section.title}
              </h3>
              <p className="text-caption text-text-muted">
                {section.items.length} item{section.items.length !== 1 && "s"}
              </p>
            </div>

            {/* Delete Button */}
            {canDelete && (
              <button
                type="button"
                onClick={() => setShowDeleteDialog(true)}
                className="text-text-muted hover:text-danger-600 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>

          <CollapsibleContent>
            <div className="p-4 space-y-4">
              {/* Optional Section Intro */}
              {!showIntro ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleToggleIntro}
                  className="text-primary-600 hover:text-primary-700"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Section Intro
                </Button>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">
                      Section Introduction
                    </Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleToggleIntro}
                      className="text-text-muted hover:text-danger-600 h-auto p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <Textarea
                    value={section.intro || ""}
                    onChange={(e) => onUpdate({ intro: e.target.value })}
                    placeholder="Introduce this section to participants..."
                    rows={2}
                    className="resize-none"
                  />
                </div>
              )}

              {/* Optional Stimulus */}
              {!showStimulus ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleToggleStimulus}
                  className="text-primary-600 hover:text-primary-700"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Stimulus
                </Button>
              ) : (
                <StimulusEditor
                  stimulus={section.stimulus}
                  onChange={(stimulus) => onUpdate({ stimulus })}
                  onRemove={handleToggleStimulus}
                />
              )}

              {/* Items List */}
              <div className="space-y-3 pt-2">
                <SortableContext
                  items={section.items.map((item) => item.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {section.items.map((item) => (
                    <FlowItemCard
                      key={item.id}
                      item={item}
                      sectionId={section.id}
                      errors={sectionErrors?.items?.[item.id]}
                      touched={touched}
                      onUpdate={(updates) => onUpdateItem(item.id, updates)}
                      onDelete={() => onDeleteItem(item.id)}
                    />
                  ))}
                </SortableContext>

                {/* Add Item Button */}
                <AddItemMenu onSelect={onAddItem} />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Section</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{section.title}&quot; and all
              its questions? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
