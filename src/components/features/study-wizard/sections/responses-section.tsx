"use client";

import { BarChart3, FileText, Users } from "lucide-react";
import { useWizard } from "../wizard-context";

export function ResponsesSection() {
  const { projectName } = useWizard();

  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-h1 text-text-primary mb-2">Responses</h1>
        <p className="text-body text-text-muted">
          View and manage interview responses for {projectName || "your study"}
        </p>
      </div>

      {/* Placeholder content */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Total Responses Card */}
        <div className="bg-surface rounded-xl border border-border-subtle p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-caption text-text-muted">Total Responses</p>
              <p className="text-h2 text-text-primary">--</p>
            </div>
          </div>
          <p className="text-caption text-text-muted">
            Responses will appear here once your study is live
          </p>
        </div>

        {/* Completion Rate Card */}
        <div className="bg-surface rounded-xl border border-border-subtle p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-success-50 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-success-600" />
            </div>
            <div>
              <p className="text-caption text-text-muted">Completion Rate</p>
              <p className="text-h2 text-text-primary">--</p>
            </div>
          </div>
          <p className="text-caption text-text-muted">
            Track how many participants complete the full interview
          </p>
        </div>

        {/* Transcripts Card */}
        <div className="bg-surface rounded-xl border border-border-subtle p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-warning-50 flex items-center justify-center">
              <FileText className="w-5 h-5 text-warning-600" />
            </div>
            <div>
              <p className="text-caption text-text-muted">Transcripts</p>
              <p className="text-h2 text-text-primary">--</p>
            </div>
          </div>
          <p className="text-caption text-text-muted">
            Full transcripts of each interview session
          </p>
        </div>
      </div>

      {/* Empty state message */}
      <div className="mt-12 text-center py-12 bg-surface rounded-xl border border-border-subtle">
        <div className="w-16 h-16 rounded-full bg-surface-alt flex items-center justify-center mx-auto mb-4">
          <BarChart3 className="w-8 h-8 text-text-muted" />
        </div>
        <h3 className="text-h3 text-text-primary mb-2">No responses yet</h3>
        <p className="text-body text-text-muted max-w-md mx-auto">
          Share your study link with participants to start collecting responses.
          All interview data will appear here in real-time.
        </p>
      </div>
    </div>
  );
}
