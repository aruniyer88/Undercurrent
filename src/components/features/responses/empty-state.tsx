"use client";

import { BarChart3 } from "lucide-react";

export function EmptyState() {
  return (
    <div className="mt-8 text-center py-12 bg-surface rounded-xl border border-border-subtle">
      <div className="w-16 h-16 rounded-full bg-surface-alt flex items-center justify-center mx-auto mb-4">
        <BarChart3 className="w-8 h-8 text-text-muted" />
      </div>
      <h3 className="text-h3 text-text-primary mb-2">No responses yet</h3>
      <p className="text-body text-text-muted max-w-md mx-auto">
        Share your study link with participants to start collecting responses.
        All interview data will appear here as it comes in.
      </p>
    </div>
  );
}
