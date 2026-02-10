"use client";

import { useRef, useCallback } from "react";
import { Dialog, DialogPortal, DialogOverlay } from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Loader2 } from "lucide-react";
import { useResponseDetail } from "@/hooks/use-response-detail";
import { deriveCompletionStatus } from "@/lib/types/responses";
import type { ReviewStatus } from "@/lib/types/database";
import { ResponseDetailHeader } from "./response-detail-header";
import {
  ResponseDetailPlayer,
  type WaveformPlayerHandle,
} from "./response-detail-player";
import { ResponseDetailProfile } from "./response-detail-profile";
import { ResponseDetailSummary } from "./response-detail-summary";
import { ResponseDetailTranscript } from "./response-detail-transcript";

interface ResponseDetailDialogProps {
  studyId: string;
  sessionId: string;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  onReviewChange: () => void;
}

export function ResponseDetailDialog({
  studyId,
  sessionId,
  onClose,
  onPrev,
  onNext,
  onReviewChange,
}: ResponseDetailDialogProps) {
  const { data, isLoading, mutate } = useResponseDetail(studyId, sessionId);
  const playerRef = useRef<WaveformPlayerHandle>(null);

  const handleReview = useCallback(
    async (status: ReviewStatus) => {
      try {
        const res = await fetch(
          `/api/studies/${studyId}/responses/${sessionId}/review`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ review_status: status }),
          }
        );
        if (res.ok) {
          mutate();
          onReviewChange();
        }
      } catch (err) {
        console.error("Failed to update review:", err);
      }
    },
    [studyId, sessionId, mutate, onReviewChange]
  );

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          className="fixed inset-4 z-[100] bg-surface border border-border-subtle rounded-xl shadow-lg flex flex-col overflow-hidden"
          aria-describedby={undefined}
        >
          <DialogPrimitive.Title className="sr-only">
            Response Detail
          </DialogPrimitive.Title>

          {isLoading || !data ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-text-muted" />
              <span className="ml-2 text-sm text-text-muted">
                Loading response...
              </span>
            </div>
          ) : (
            <>
              {/* Header */}
              <ResponseDetailHeader
                session={data.session}
                completionStatus={deriveCompletionStatus(data.session)}
                onReview={handleReview}
                onPrev={onPrev}
                onNext={onNext}
                onClose={onClose}
              />

              {/* Two-panel layout */}
              <div className="flex-1 flex overflow-hidden">
                {/* Left Panel - 40% */}
                <div className="w-[40%] border-r border-border-subtle overflow-y-auto p-4 space-y-4">
                  {/* Audio Player */}
                  <ResponseDetailPlayer
                    ref={playerRef}
                    recordingUrl={data.session.recording_url}
                  />

                  {/* Profile */}
                  <ResponseDetailProfile
                    session={data.session}
                    screenerResponses={data.screenerResponses}
                  />

                  {/* AI Summary */}
                  <ResponseDetailSummary
                    studyId={studyId}
                    sessionId={sessionId}
                    initialSummary={data.session.ai_summary}
                  />
                </div>

                {/* Right Panel - 60% */}
                <div className="w-[60%] overflow-y-auto p-4">
                  <ResponseDetailTranscript
                    transcript={data.transcript}
                    sessionStartedAt={data.session.started_at}
                    playerRef={playerRef}
                  />
                </div>
              </div>
            </>
          )}
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
