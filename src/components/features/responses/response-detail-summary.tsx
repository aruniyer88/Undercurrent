"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, RefreshCw } from "lucide-react";
import type { AISummary } from "@/lib/types/database";

interface ResponseDetailSummaryProps {
  studyId: string;
  sessionId: string;
  initialSummary: AISummary | null;
}

export function ResponseDetailSummary({
  studyId,
  sessionId,
  initialSummary,
}: ResponseDetailSummaryProps) {
  const [summary, setSummary] = useState<AISummary | null>(initialSummary);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSummary = async (force = false) => {
    setIsGenerating(true);
    setError(null);

    try {
      const url = `/api/studies/${studyId}/responses/${sessionId}/summary${force ? "?force=true" : ""}`;
      const res = await fetch(url, { method: "POST" });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate summary");
      }

      const data = await res.json();
      setSummary(data.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate summary");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!summary && !isGenerating) {
    return (
      <div className="bg-surface rounded-lg border border-border-subtle p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-text-primary">AI Summary</h4>
        </div>
        {error ? (
          <p className="text-xs text-red-500 mb-2">{error}</p>
        ) : null}
        <Button
          size="sm"
          variant="outline"
          onClick={() => generateSummary()}
          className="gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Generate Summary
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-lg border border-border-subtle p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-text-primary">AI Summary</h4>
        {summary && !isGenerating && (
          <button
            onClick={() => generateSummary(true)}
            className="text-xs text-text-muted hover:text-text-secondary flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            Regenerate
          </button>
        )}
      </div>

      {isGenerating ? (
        <div className="flex items-center gap-2 text-sm text-text-muted py-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Generating summary...
        </div>
      ) : summary ? (
        <ul className="space-y-2">
          {summary.bullets.map((bullet, i) => (
            <li key={i} className="text-sm text-text-secondary flex gap-2">
              <span className="text-text-muted flex-shrink-0">•</span>
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
    </div>
  );
}
