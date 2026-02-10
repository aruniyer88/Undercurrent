"use client";

import { useState, useCallback } from "react";
import { ResponseRow } from "./response-row";
import { BulkActionsBar } from "./bulk-actions-bar";
import type { ResponseListItem } from "@/lib/types/responses";

interface ResponsesListProps {
  sessions: ResponseListItem[];
  studyId: string;
  onSelectSession: (id: string) => void;
  onMutate: () => void;
}

export function ResponsesList({
  sessions,
  studyId,
  onSelectSession,
  onMutate,
}: ResponsesListProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleSelect = useCallback((id: string, selected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (selected) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  const handleToggleReview = useCallback(
    async (
      id: string,
      status: "accepted" | "rejected" | "pending"
    ) => {
      try {
        const res = await fetch(
          `/api/studies/${studyId}/responses/${id}/review`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ review_status: status }),
          }
        );
        if (res.ok) {
          onMutate();
        }
      } catch (err) {
        console.error("Failed to update review:", err);
      }
    },
    [studyId, onMutate]
  );

  const handleBulkComplete = useCallback(() => {
    setSelectedIds(new Set());
    onMutate();
  }, [onMutate]);

  const handleExport = useCallback(
    (format: "csv" | "json") => {
      window.open(
        `/api/studies/${studyId}/responses/export?format=${format}`,
        "_blank"
      );
    },
    [studyId]
  );

  return (
    <div>
      {/* Column Headers */}
      <div
        className="flex items-center gap-4 px-4 py-2 mb-1"
        style={{
          fontWeight: 600,
          color: "#374151",
          textTransform: "uppercase",
          fontSize: "11px",
          letterSpacing: "0.05em",
        }}
      >
        <div className="w-5 flex-shrink-0" /> {/* Checkbox space */}
        <span className="w-8 text-right flex-shrink-0">#</span>
        <span className="flex-1 min-w-0">Respondent</span>
        <span className="w-20 flex-shrink-0">Date</span>
        <span className="w-24 flex-shrink-0">Status</span>
        <span className="w-12 flex-shrink-0">Lang</span>
        <span className="w-14 text-right flex-shrink-0">Duration</span>
        <span className="w-8 flex-shrink-0 text-center">Review</span>
      </div>

      {/* Rows */}
      {sessions.map((session) => (
        <ResponseRow
          key={session.id}
          item={session}
          isSelected={selectedIds.has(session.id)}
          onSelect={handleSelect}
          onClick={onSelectSession}
          onToggleReview={handleToggleReview}
        />
      ))}

      {/* Bulk Actions */}
      <BulkActionsBar
        selectedCount={selectedIds.size}
        studyId={studyId}
        selectedIds={Array.from(selectedIds)}
        onComplete={handleBulkComplete}
        onExport={handleExport}
      />
    </div>
  );
}
