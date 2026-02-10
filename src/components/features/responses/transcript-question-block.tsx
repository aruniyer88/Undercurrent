"use client";

import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Play, Copy } from "lucide-react";
import type { ConversationTurn } from "@/lib/types/database";
import type { WaveformPlayerHandle } from "./response-detail-player";

interface TranscriptQuestionBlockProps {
  questionText: string;
  turns: ConversationTurn[];
  sessionStartedAt: string | null;
  playerRef: React.RefObject<WaveformPlayerHandle | null>;
}

export function TranscriptQuestionBlock({
  questionText,
  turns,
  sessionStartedAt,
  playerRef,
}: TranscriptQuestionBlockProps) {
  const handlePlay = useCallback(
    (turn: ConversationTurn) => {
      if (!sessionStartedAt || !turn.started_at || !playerRef.current) return;
      const offsetMs =
        new Date(turn.started_at).getTime() -
        new Date(sessionStartedAt).getTime();
      playerRef.current.seekTo(offsetMs / 1000);
    },
    [sessionStartedAt, playerRef]
  );

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
  }, []);

  // Separate main turns from probe turns
  const mainTurns = turns.filter(
    (t) => t.speaker === "participant" && !t.is_probe
  );

  // Group probe turns: AI probe question followed by participant response
  const groupedTurns: { ai?: ConversationTurn; participant?: ConversationTurn }[] = [];
  let currentProbeGroup: { ai?: ConversationTurn; participant?: ConversationTurn } = {};

  for (const turn of turns) {
    if (turn.speaker === "ai" && !turn.is_probe) continue; // skip initial AI question (it's the questionText)
    if (turn.speaker === "participant" && !turn.is_probe) {
      // Main response
      continue;
    }
    if (turn.speaker === "ai" && turn.is_probe) {
      if (currentProbeGroup.ai) {
        groupedTurns.push(currentProbeGroup);
      }
      currentProbeGroup = { ai: turn };
    }
    if (turn.speaker === "participant" && turn.is_probe) {
      currentProbeGroup.participant = turn;
      groupedTurns.push(currentProbeGroup);
      currentProbeGroup = {};
    }
  }
  if (currentProbeGroup.ai) {
    groupedTurns.push(currentProbeGroup);
  }

  // Find the first participant response (main, non-probe)
  const firstParticipantResponse = turns.find(
    (t) => t.speaker === "participant" && !t.is_probe
  );

  return (
    <div className="space-y-2">
      {/* Question */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-text-primary">
          Q: {questionText}
        </p>
        <div className="flex items-center gap-1 flex-shrink-0">
          {firstParticipantResponse && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={() => handlePlay(firstParticipantResponse)}
              title="Play from here"
            >
              <Play className="w-3 h-3" />
            </Button>
          )}
          {firstParticipantResponse && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={() => handleCopy(firstParticipantResponse.text_content)}
              title="Copy response"
            >
              <Copy className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Main participant response */}
      {mainTurns.map((turn) => (
        <p key={turn.id} className="text-sm text-text-secondary pl-4">
          {turn.text_content}
        </p>
      ))}

      {/* Probe follow-ups */}
      {groupedTurns.map((group, i) => (
        <div key={i} className="pl-6 border-l-2 border-border-subtle ml-2 space-y-1">
          {group.ai && (
            <p className="text-xs text-text-muted italic">
              AI Follow-up: {group.ai.text_content}
            </p>
          )}
          {group.participant && (
            <div className="flex items-start justify-between gap-1">
              <p className="text-sm text-text-secondary">
                {group.participant.text_content}
              </p>
              <Button
                size="sm"
                variant="ghost"
                className="h-5 w-5 p-0 flex-shrink-0"
                onClick={() => handlePlay(group.participant!)}
                title="Play from here"
              >
                <Play className="w-2.5 h-2.5" />
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
