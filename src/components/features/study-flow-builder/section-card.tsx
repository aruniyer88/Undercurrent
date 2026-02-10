"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
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
  Images,
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
  studyType?: import("@/lib/types/database").StudyType;
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
  studyType,
  onUpdate,
  onDelete,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
}: SectionCardProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
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
            <div className="flex-1 flex items-center gap-2">
              <div>
                <h3 className="text-body-strong text-text-primary">
                  {section.title}
                </h3>
                <p className="text-caption text-text-muted">
                  {section.items.length} item{section.items.length !== 1 && "s"}
                </p>
              </div>
              {/* Add Media Icon */}
              {!showStimulus && (
                <button
                  type="button"
                  onClick={handleToggleStimulus}
                  className="text-text-muted hover:text-primary-600 transition-colors"
                  title="Add media"
                >
                  <Images className="w-5 h-5" />
                </button>
              )}
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
              {/* Optional Media */}
              {showStimulus && (
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

                {/* Add Question Button */}
                <AddItemMenu onSelect={onAddItem} studyType={studyType} />
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
