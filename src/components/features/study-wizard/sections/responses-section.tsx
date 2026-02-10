"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useWizard } from "../wizard-context";
import { useResponses } from "@/hooks/use-responses";
import { ResponsesOverview } from "@/components/features/responses/responses-overview";
import { FilterBar } from "@/components/features/responses/filter-bar";
import { ResponsesList } from "@/components/features/responses/responses-list";
import { EmptyState } from "@/components/features/responses/empty-state";
import { ResponseDetailDialog } from "@/components/features/responses/response-detail-dialog";

export function ResponsesSection() {
  const { studyId } = useWizard();
  const { sessions, stats, filters, setFilters, isLoading, mutate } =
    useResponses(studyId);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null
  );

  // Find index of selected session for prev/next navigation
  const selectedIndex = selectedSessionId
    ? sessions.findIndex((s) => s.id === selectedSessionId)
    : -1;

  const handlePrev = () => {
    if (selectedIndex > 0) {
      setSelectedSessionId(sessions[selectedIndex - 1].id);
    }
  };

  const handleNext = () => {
    if (selectedIndex < sessions.length - 1) {
      setSelectedSessionId(sessions[selectedIndex + 1].id);
    }
  };

  if (isLoading && sessions.length === 0) {
    return (
      <div className="max-w-5xl mx-auto py-8 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-text-muted" />
        <span className="ml-2 text-sm text-text-muted">Loading responses...</span>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-6">
      {/* Layer 1: Overview */}
      <ResponsesOverview stats={stats} />

      {/* Empty state or list */}
      {stats.totalSessions === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* Filter Bar */}
          <FilterBar filters={filters} onChange={setFilters} />

          {/* Layer 2: Response List */}
          <ResponsesList
            sessions={sessions}
            studyId={studyId!}
            onSelectSession={setSelectedSessionId}
            onMutate={mutate}
          />
        </>
      )}

      {/* Layer 3: Response Detail Dialog */}
      {selectedSessionId && studyId && (
        <ResponseDetailDialog
          studyId={studyId}
          sessionId={selectedSessionId}
          onClose={() => setSelectedSessionId(null)}
          onPrev={selectedIndex > 0 ? handlePrev : undefined}
          onNext={selectedIndex < sessions.length - 1 ? handleNext : undefined}
          onReviewChange={mutate}
        />
      )}
    </div>
  );
}
