"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  MessageSquare,
  ListChecks,
  CheckSquare,
  Star,
  ArrowUpDown,
  FileText,
  Bot,
} from "lucide-react";
import { ItemType, ITEM_TYPE_LABELS, ITEM_TYPE_DESCRIPTIONS } from "@/lib/types/study-flow";
import type { StudyType } from "@/lib/types/database";

interface AddItemMenuProps {
  onSelect: (type: ItemType) => void;
  studyType?: StudyType;
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

const ALL_QUESTION_TYPES: ItemType[] = [
  "open_ended",
  "single_select",
  "multi_select",
  "rating_scale",
  "ranking",
];

// Streaming mode: only open-ended conversations
const STREAMING_QUESTION_TYPES: ItemType[] = ["open_ended"];

const OTHER_TYPES: ItemType[] = ["instruction", "ai_conversation"];

export function AddItemMenu({ onSelect, studyType = "structured" }: AddItemMenuProps) {
  const QUESTION_TYPES = studyType === "streaming" ? STREAMING_QUESTION_TYPES : ALL_QUESTION_TYPES;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border-2 border-dashed border-border-subtle bg-transparent hover:border-primary-400 hover:bg-primary-50/50 transition-all group text-text-muted hover:text-primary-600">
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">Add Question</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-72">
        <div className="px-2 py-1.5 text-xs font-medium text-text-muted">
          Questions
        </div>
        {QUESTION_TYPES.map((type) => {
          const Icon = ITEM_ICONS[type];
          return (
            <DropdownMenuItem
              key={type}
              onClick={() => onSelect(type)}
              className="flex items-start gap-3 py-2.5"
            >
              <Icon className="w-4 h-4 mt-0.5 text-text-muted" />
              <div className="flex-1">
                <div className="text-body-strong">{ITEM_TYPE_LABELS[type]}</div>
                <div className="text-caption text-text-muted">
                  {ITEM_TYPE_DESCRIPTIONS[type]}
                </div>
              </div>
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5 text-xs font-medium text-text-muted">
          Other
        </div>
        {OTHER_TYPES.map((type) => {
          const Icon = ITEM_ICONS[type];
          return (
            <DropdownMenuItem
              key={type}
              onClick={() => onSelect(type)}
              className="flex items-start gap-3 py-2.5"
            >
              <Icon className="w-4 h-4 mt-0.5 text-text-muted" />
              <div className="flex-1">
                <div className="text-body-strong">{ITEM_TYPE_LABELS[type]}</div>
                <div className="text-caption text-text-muted">
                  {ITEM_TYPE_DESCRIPTIONS[type]}
                </div>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
