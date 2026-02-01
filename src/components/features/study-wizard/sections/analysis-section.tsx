"use client";

import { Lightbulb, TrendingUp, MessageSquareQuote, Tags } from "lucide-react";
import { useWizard } from "../wizard-context";

export function AnalysisSection() {
  const { projectName } = useWizard();

  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-h1 text-text-primary mb-2">Analysis</h1>
        <p className="text-body text-text-muted">
          AI-powered insights and analysis for {projectName || "your study"}
        </p>
      </div>

      {/* Placeholder content */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Key Insights Card */}
        <div className="bg-surface rounded-xl border border-border-subtle p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 className="text-h4 text-text-primary">Key Insights</h3>
            </div>
          </div>
          <p className="text-body text-text-muted mb-4">
            AI-generated summary of the most important findings from your interviews
          </p>
          <div className="h-24 bg-surface-alt rounded-lg flex items-center justify-center">
            <p className="text-caption text-text-muted">Coming soon</p>
          </div>
        </div>

        {/* Themes Card */}
        <div className="bg-surface rounded-xl border border-border-subtle p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-success-50 flex items-center justify-center">
              <Tags className="w-5 h-5 text-success-600" />
            </div>
            <div>
              <h3 className="text-h4 text-text-primary">Themes & Topics</h3>
            </div>
          </div>
          <p className="text-body text-text-muted mb-4">
            Automatically identified themes and topics across all responses
          </p>
          <div className="h-24 bg-surface-alt rounded-lg flex items-center justify-center">
            <p className="text-caption text-text-muted">Coming soon</p>
          </div>
        </div>

        {/* Sentiment Analysis Card */}
        <div className="bg-surface rounded-xl border border-border-subtle p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-warning-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-warning-600" />
            </div>
            <div>
              <h3 className="text-h4 text-text-primary">Sentiment Analysis</h3>
            </div>
          </div>
          <p className="text-body text-text-muted mb-4">
            Track sentiment trends across different topics and questions
          </p>
          <div className="h-24 bg-surface-alt rounded-lg flex items-center justify-center">
            <p className="text-caption text-text-muted">Coming soon</p>
          </div>
        </div>

        {/* Notable Quotes Card */}
        <div className="bg-surface rounded-xl border border-border-subtle p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
              <MessageSquareQuote className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 className="text-h4 text-text-primary">Notable Quotes</h3>
            </div>
          </div>
          <p className="text-body text-text-muted mb-4">
            Highlighted quotes and standout responses from participants
          </p>
          <div className="h-24 bg-surface-alt rounded-lg flex items-center justify-center">
            <p className="text-caption text-text-muted">Coming soon</p>
          </div>
        </div>
      </div>

      {/* Empty state message */}
      <div className="mt-12 text-center py-12 bg-surface rounded-xl border border-border-subtle">
        <div className="w-16 h-16 rounded-full bg-surface-alt flex items-center justify-center mx-auto mb-4">
          <Lightbulb className="w-8 h-8 text-text-muted" />
        </div>
        <h3 className="text-h3 text-text-primary mb-2">Analysis will appear here</h3>
        <p className="text-body text-text-muted max-w-md mx-auto">
          Once you have collected responses, our AI will analyze the data and
          provide insights, themes, and actionable recommendations.
        </p>
      </div>
    </div>
  );
}
