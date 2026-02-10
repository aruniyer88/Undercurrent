"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check, X, AlertTriangle, Download, ChevronDown, Loader2 } from "lucide-react";
import type { BulkReviewAction } from "@/lib/types/responses";

interface BulkActionsBarProps {
  selectedCount: number;
  studyId: string;
  selectedIds: string[];
  onComplete: () => void;
  onExport: (format: "csv" | "json") => void;
}

export function BulkActionsBar({
  selectedCount,
  studyId,
  selectedIds,
  onComplete,
  onExport,
}: BulkActionsBarProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleBulkAction = async (action: BulkReviewAction) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/studies/${studyId}/responses/bulk-review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, session_ids: selectedIds }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Bulk action failed");
      }

      onComplete();
    } catch (err) {
      console.error("Bulk action error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-surface border border-border-subtle rounded-xl shadow-lg px-4 py-3 flex items-center gap-3">
      <span className="text-sm text-text-secondary font-medium">
        {selectedCount} selected
      </span>

      <div className="w-px h-6 bg-border-subtle" />

      <Button
        size="sm"
        variant="outline"
        onClick={() => handleBulkAction("accept_all")}
        disabled={isLoading}
        className="gap-1.5"
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Check className="w-3.5 h-3.5" />
        )}
        Accept
      </Button>

      <Button
        size="sm"
        variant="outline"
        onClick={() => handleBulkAction("reject_all")}
        disabled={isLoading}
        className="gap-1.5"
      >
        <X className="w-3.5 h-3.5" />
        Reject
      </Button>

      <Button
        size="sm"
        variant="outline"
        onClick={() => handleBulkAction("reject_incomplete")}
        disabled={isLoading}
        className="gap-1.5"
      >
        <AlertTriangle className="w-3.5 h-3.5" />
        Reject Incomplete
      </Button>

      <div className="w-px h-6 bg-border-subtle" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline" className="gap-1.5">
            <Download className="w-3.5 h-3.5" />
            Export
            <ChevronDown className="w-3 h-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => onExport("csv")}>
            Export as CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onExport("json")}>
            Export as JSON
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
