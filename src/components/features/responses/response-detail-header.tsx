"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  X,
} from "lucide-react";
import type { InterviewSession, ReviewStatus } from "@/lib/types/database";
import { formatDateTime, formatDuration } from "@/lib/utils/format";
import type { CompletionStatus } from "@/lib/types/responses";

interface ResponseDetailHeaderProps {
  session: InterviewSession;
  rowNumber?: number;
  completionStatus: CompletionStatus;
  onReview: (status: ReviewStatus) => void;
  onPrev?: () => void;
  onNext?: () => void;
  onClose: () => void;
}

const completionBadge: Record<
  CompletionStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  complete: { label: "Complete", variant: "default" },
  in_progress: { label: "In Progress", variant: "secondary" },
  not_started: { label: "Not Started", variant: "outline" },
};

export function ResponseDetailHeader({
  session,
  completionStatus,
  onReview,
  onPrev,
  onNext,
  onClose,
}: ResponseDetailHeaderProps) {
  const badge = completionBadge[completionStatus];

  return (
    <div className="flex items-center justify-between px-6 py-3 border-b border-border-subtle bg-surface">
      {/* Left info */}
      <div className="flex items-center gap-3 text-sm">
        {session.started_at && (
          <span className="text-text-muted">
            {formatDateTime(session.started_at)}
          </span>
        )}
        <Badge variant={badge.variant}>{badge.label}</Badge>
        {session.language && (
          <Badge variant="secondary" className="text-[10px]">
            {session.language.toUpperCase()}
          </Badge>
        )}
        <span className="text-text-muted">
          {formatDuration(session.actual_duration_seconds)}
        </span>
      </div>

      {/* Center: Accept/Reject */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant={session.review_status === "accepted" ? "default" : "outline"}
          onClick={() =>
            onReview(
              session.review_status === "accepted" ? "pending" : "accepted"
            )
          }
          className="gap-1.5"
        >
          <Check className="w-3.5 h-3.5" />
          Accept
        </Button>
        <Button
          size="sm"
          variant={
            session.review_status === "rejected" ? "destructive" : "outline"
          }
          onClick={() =>
            onReview(
              session.review_status === "rejected" ? "pending" : "rejected"
            )
          }
          className="gap-1.5"
        >
          <X className="w-3.5 h-3.5" />
          Reject
        </Button>
      </div>

      {/* Right: Nav + Close */}
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={onPrev}
          disabled={!onPrev}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onNext}
          disabled={!onNext}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onClose}
          className="h-8 w-8 p-0 ml-2"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
