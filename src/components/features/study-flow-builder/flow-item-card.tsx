"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
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
  GripVertical,
  Trash2,
  MessageSquare,
  ListChecks,
  CheckSquare,
  Star,
  ArrowUpDown,
  FileText,
  Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  FlowItem,
  ItemType,
  ItemValidationErrors,
  ITEM_TYPE_LABELS,
} from "@/lib/types/study-flow";

import { OpenEndedEditor } from "./question-editors/open-ended-editor";
import { SingleSelectEditor } from "./question-editors/single-select-editor";
import { MultiSelectEditor } from "./question-editors/multi-select-editor";
import { RatingScaleEditor } from "./question-editors/rating-scale-editor";
import { RankingEditor } from "./question-editors/ranking-editor";
import { InstructionEditor } from "./question-editors/instruction-editor";
import { AIConversationEditor } from "./question-editors/ai-conversation-editor";

interface FlowItemCardProps {
  item: FlowItem;
  sectionId: string;
  errors?: ItemValidationErrors;
  touched?: boolean;
  onUpdate: (updates: Partial<FlowItem>) => void;
  onDelete: () => void;
}

const ITEM_ICONS: Record<ItemType, React.ElementType> = {
  open_ended: MessageSquare,
  single_select: ListChecks,
  multi_select: CheckSquare,
  rating_scale: Star,
  ranking: ArrowUpDown,
  instruction: FileText,
  ai_conversation: Bot,
};

export function FlowItemCard({
  item,
  sectionId,
  errors,
  touched,
  onUpdate,
  onDelete,
}: FlowItemCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    data: { type: "item", sectionId },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const Icon = ITEM_ICONS[item.type];

  const handleDeleteConfirm = () => {
    setShowDeleteDialog(false);
    onDelete();
  };

  const renderEditor = () => {
    switch (item.type) {
      case "open_ended":
        return (
          <OpenEndedEditor
            item={item}
            errors={errors}
            touched={touched}
            onUpdate={onUpdate}
          />
        );
      case "single_select":
        return (
          <SingleSelectEditor
            item={item}
            errors={errors}
            touched={touched}
            onUpdate={onUpdate}
          />
        );
      case "multi_select":
        return (
          <MultiSelectEditor
            item={item}
            errors={errors}
            touched={touched}
            onUpdate={onUpdate}
          />
        );
      case "rating_scale":
        return (
          <RatingScaleEditor
            item={item}
            errors={errors}
            touched={touched}
            onUpdate={onUpdate}
          />
        );
      case "ranking":
        return (
          <RankingEditor
            item={item}
            errors={errors}
            touched={touched}
            onUpdate={onUpdate}
          />
        );
      case "instruction":
        return (
          <InstructionEditor
            item={item}
            errors={errors}
            touched={touched}
            onUpdate={onUpdate}
          />
        );
      case "ai_conversation":
        return (
          <AIConversationEditor
            item={item}
            errors={errors}
            touched={touched}
            onUpdate={onUpdate}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          "bg-surface-alt rounded-lg border border-border-subtle",
          isDragging && "opacity-50 shadow-lg"
        )}
      >
        {/* Item Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border-subtle">
          {/* Drag Handle */}
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-text-muted hover:text-text-primary"
          >
            <GripVertical className="w-4 h-4" />
          </button>

          {/* Icon & Type */}
          <div className="flex items-center gap-2 flex-1">
            <Icon className="w-4 h-4 text-primary-600" />
            <span className="text-caption font-medium text-text-muted">
              {ITEM_TYPE_LABELS[item.type]}
            </span>
          </div>

          {/* Delete Button */}
          <button
            type="button"
            onClick={() => setShowDeleteDialog(true)}
            className="text-text-muted hover:text-danger-600 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Item Editor */}
        <div className="p-4">{renderEditor()}</div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this {ITEM_TYPE_LABELS[item.type].toLowerCase()}?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
