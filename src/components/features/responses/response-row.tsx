"use client";

import { Check, X, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import type { ResponseListItem } from "@/lib/types/responses";
import { formatRelativeTime, formatDuration } from "@/lib/utils/format";

interface ResponseRowProps {
  item: ResponseListItem;
  isSelected: boolean;
  onSelect: (id: string, selected: boolean) => void;
  onClick: (id: string) => void;
  onToggleReview: (id: string, status: "accepted" | "rejected" | "pending") => void;
}

const completionDot: Record<string, string> = {
  complete: "bg-green-500",
  in_progress: "bg-yellow-500",
  not_started: "bg-gray-300",
};

const completionLabel: Record<string, string> = {
  complete: "Complete",
  in_progress: "In progress",
  not_started: "Not started",
};

export function ResponseRow({
  item,
  isSelected,
  onSelect,
  onClick,
  onToggleReview,
}: ResponseRowProps) {
  const handleReviewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Cycle: pending → accepted → rejected → pending
    const next =
      item.reviewStatus === "pending"
        ? "accepted"
        : item.reviewStatus === "accepted"
          ? "rejected"
          : "pending";
    onToggleReview(item.id, next);
  };

  return (
    <div
      onClick={() => onClick(item.id)}
      className="group flex items-center gap-4 cursor-pointer transition-all duration-150 px-4 py-3 rounded-lg border border-border-subtle bg-surface hover:bg-gray-50 hover:shadow-sm mb-2"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick(item.id)}
    >
      {/* Checkbox */}
      <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onSelect(item.id, !!checked)}
        />
      </div>

      {/* Row Number */}
      <span className="w-8 text-sm text-text-muted text-right flex-shrink-0">
        {item.rowNumber}
      </span>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary truncate">
          {item.participantName || "Anonymous"}
        </p>
        <p className="text-xs text-text-muted truncate">
          {item.id.slice(0, 8)}
        </p>
      </div>

      {/* Date */}
      <span className="w-20 text-xs text-text-muted flex-shrink-0">
        {item.startedAt ? formatRelativeTime(new Date(item.startedAt)) : "--"}
      </span>

      {/* Status */}
      <div className="w-24 flex items-center gap-1.5 flex-shrink-0">
        <span
          className={`w-2 h-2 rounded-full ${completionDot[item.completionStatus]}`}
        />
        <span className="text-xs text-text-muted">
          {completionLabel[item.completionStatus]}
        </span>
      </div>

      {/* Language */}
      <div className="w-12 flex-shrink-0">
        {item.language && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {item.language.toUpperCase()}
          </Badge>
        )}
      </div>

      {/* Duration */}
      <span className="w-14 text-xs text-text-muted text-right flex-shrink-0">
        {formatDuration(item.durationSeconds)}
      </span>

      {/* Review */}
      <button
        onClick={handleReviewClick}
        className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors flex-shrink-0"
        title={`Review: ${item.reviewStatus}`}
      >
        {item.reviewStatus === "accepted" && (
          <Check className="w-4 h-4 text-green-600" />
        )}
        {item.reviewStatus === "rejected" && (
          <X className="w-4 h-4 text-red-500" />
        )}
        {item.reviewStatus === "pending" && (
          <Minus className="w-4 h-4 text-gray-400" />
        )}
      </button>
    </div>
  );
}
