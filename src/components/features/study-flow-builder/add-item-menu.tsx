"use client";

import { Button } from "@/components/ui/button";
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

interface AddItemMenuProps {
  onSelect: (type: ItemType) => void;
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

const QUESTION_TYPES: ItemType[] = [
  "open_ended",
  "single_select",
  "multi_select",
  "rating_scale",
  "ranking",
];

const OTHER_TYPES: ItemType[] = ["instruction", "ai_conversation"];

export function AddItemMenu({ onSelect }: AddItemMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full gap-2 border-dashed">
          <Plus className="w-4 h-4" />
          Add Step
        </Button>
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
