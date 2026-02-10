"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, User, Mail } from "lucide-react";
import type { InterviewSession } from "@/lib/types/database";

interface ScreenerResponseItem {
  id: string;
  answer: string;
  passed: boolean;
  screener_question: {
    id: string;
    question_text: string;
    question_type: string;
    options: string[];
    qualifying_answers: string[];
  };
}

interface ResponseDetailProfileProps {
  session: InterviewSession;
  screenerResponses: ScreenerResponseItem[];
}

const DEMOGRAPHIC_LABELS: Record<string, string> = {
  gender: "Gender",
  age: "Age",
  ethnicity: "Ethnicity",
  location: "Location",
  education: "Education",
  income: "Income",
  occupation: "Occupation",
};

export function ResponseDetailProfile({
  session,
  screenerResponses,
}: ResponseDetailProfileProps) {
  const [isOpen, setIsOpen] = useState(true);
  const metadata = session.participant_metadata || {};
  const demographics = Object.entries(metadata).filter(
    ([key]) => key in DEMOGRAPHIC_LABELS
  );

  const hasContent =
    session.participant_name ||
    session.participant_email ||
    demographics.length > 0 ||
    screenerResponses.length > 0;

  if (!hasContent) return null;

  return (
    <div className="bg-surface rounded-lg border border-border-subtle">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-text-primary hover:bg-gray-50 transition-colors rounded-lg"
      >
        <span>Respondent Profile</span>
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-text-muted" />
        ) : (
          <ChevronRight className="w-4 h-4 text-text-muted" />
        )}
      </button>

      {isOpen && (
        <div className="px-4 pb-4 space-y-4">
          {/* Name & Email */}
          {(session.participant_name || session.participant_email) && (
            <div className="space-y-2">
              {session.participant_name && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-3.5 h-3.5 text-text-muted" />
                  <span className="text-text-primary">
                    {session.participant_name}
                  </span>
                </div>
              )}
              {session.participant_email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-3.5 h-3.5 text-text-muted" />
                  <span className="text-text-muted">
                    {session.participant_email}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Demographics */}
          {demographics.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-text-muted uppercase tracking-wider">
                Demographics
              </p>
              {demographics.map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-text-muted">
                    {DEMOGRAPHIC_LABELS[key] || key}
                  </span>
                  <span className="text-text-primary">{String(value)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Screener Results */}
          {screenerResponses.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-text-muted uppercase tracking-wider">
                Screener
              </p>
              {screenerResponses.map((sr) => (
                <div key={sr.id} className="space-y-1">
                  <p className="text-xs text-text-secondary">
                    {sr.screener_question.question_text}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-text-primary">
                      {sr.answer}
                    </span>
                    <Badge
                      variant={sr.passed ? "default" : "destructive"}
                      className="text-[10px] px-1.5 py-0"
                    >
                      {sr.passed ? "Pass" : "Fail"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
