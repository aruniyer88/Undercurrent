"use client";

import { useState } from "react";
import Link from "next/link";
import { Study, Interview } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ArrowLeft,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  User,
  Clock,
  Calendar,
  Quote,
  MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";

interface InterviewDetailProps {
  study: Study;
  interview: Interview;
}

// Sample transcript for demo
const SAMPLE_TRANSCRIPT = [
  { speaker: "AI", text: "Thanks for joining today! Before we dive in, could you tell me a bit about yourself and your role?", timestamp: 0 },
  { speaker: "Participant", text: "Sure! I'm a product manager at a mid-sized tech company. I've been in this role for about two years now, mostly working on our mobile app.", timestamp: 15 },
  { speaker: "AI", text: "That's great context. When you think about your current workflow, what comes to mind first?", timestamp: 35 },
  { speaker: "Participant", text: "Honestly, the first thing that comes to mind is all the switching between tools. We use Jira for tickets, Figma for designs, Slack for communication, and then various analytics tools. It's a lot to manage.", timestamp: 50 },
  { speaker: "AI", text: "I see. Can you walk me through a specific example where this tool switching caused issues?", timestamp: 85 },
  { speaker: "Participant", text: "Last week, we were trying to prioritize features for the next sprint. I had to pull data from three different places to make the case for one feature. By the time I had everything together, the meeting had moved on.", timestamp: 100 },
  { speaker: "AI", text: "That sounds frustrating. How often does this happen?", timestamp: 140 },
  { speaker: "Participant", text: "Pretty regularly, maybe a few times a week. It's become such a norm that I almost don't notice it anymore, but it definitely slows us down.", timestamp: 155 },
];

export function InterviewDetail({ study, interview }: InterviewDetailProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  
  const transcript = interview.transcript_text 
    ? JSON.parse(interview.transcript_text) 
    : SAMPLE_TRANSCRIPT;

  const totalDuration = interview.duration_seconds || 180;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fafafa' }}>
      {/* Header */}
      <div className="sticky top-16 z-40 bg-white border-b border-neutral-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/studies/${study.id}/report`}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Report
                </Button>
              </Link>
              <div>
                <h1 className="text-lg font-semibold text-neutral-900">
                  Interview Details
                </h1>
                <p className="text-sm text-neutral-500">
                  {interview.participant_name || "Anonymous Participant"}
                </p>
              </div>
            </div>
            <Badge className={interview.status === "completed" ? "badge-live" : "badge-draft"}>
              {interview.status}
            </Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-[1fr_320px] gap-8">
          {/* Main Content - Audio Player + Transcript */}
          <div className="space-y-6">
            {/* Audio Player */}
            <Card>
              <CardContent className="pt-6">
                {/* Waveform Placeholder */}
                <div className="h-20 bg-neutral-100 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                  <div className="waveform justify-center w-full px-4">
                    {Array.from({ length: 60 }).map((_, i) => (
                      <div 
                        key={i} 
                        className={cn(
                          "waveform-bar",
                          i < (currentTime / totalDuration) * 60 ? "bg-primary-500" : "bg-neutral-300"
                        )}
                        style={{ height: `${Math.random() * 40 + 20}px` }} 
                      />
                    ))}
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <SkipBack className="w-4 h-4" />
                    </Button>
                    <Button 
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="w-12 h-12 rounded-full bg-primary-600 hover:bg-primary-700"
                    >
                      {isPlaying ? (
                        <Pause className="w-5 h-5 text-white" />
                      ) : (
                        <Play className="w-5 h-5 text-white ml-0.5" />
                      )}
                    </Button>
                    <Button variant="ghost" size="sm">
                      <SkipForward className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-neutral-500">
                    <span>{formatTime(currentTime)}</span>
                    <div className="w-32 h-1 bg-neutral-200 rounded-full">
                      <div 
                        className="h-full bg-primary-500 rounded-full"
                        style={{ width: `${(currentTime / totalDuration) * 100}%` }}
                      />
                    </div>
                    <span>{formatTime(totalDuration)}</span>
                  </div>

                  <Button variant="ghost" size="sm">
                    <Volume2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Transcript */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Transcript
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-4">
                    {transcript.map((entry: { speaker: string; text: string; timestamp: number }, index: number) => (
                      <div 
                        key={index}
                        className={cn(
                          "flex gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                          currentTime >= entry.timestamp && currentTime < (transcript[index + 1]?.timestamp || totalDuration)
                            ? "bg-primary-50"
                            : "hover:bg-neutral-50"
                        )}
                        onClick={() => setCurrentTime(entry.timestamp)}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                          entry.speaker === "AI" 
                            ? "bg-primary-100" 
                            : "bg-neutral-200"
                        )}>
                          {entry.speaker === "AI" ? (
                            <Volume2 className="w-4 h-4 text-primary-600" />
                          ) : (
                            <User className="w-4 h-4 text-neutral-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-neutral-700">
                              {entry.speaker === "AI" ? "Interviewer" : "Participant"}
                            </span>
                            <span className="text-xs text-neutral-400">
                              {formatTime(entry.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm text-neutral-600 leading-relaxed">
                            {entry.text}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Metadata */}
          <div className="space-y-6">
            {/* Participant Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Participant
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <span className="text-neutral-500">Name</span>
                  <p className="font-medium">{interview.participant_name || "Anonymous"}</p>
                </div>
                {interview.participant_metadata && Object.keys(interview.participant_metadata).length > 0 && (
                  <>
                    {Object.entries(interview.participant_metadata).map(([key, value]) => (
                      <div key={key}>
                        <span className="text-neutral-500 capitalize">{key}</span>
                        <p className="font-medium">{String(value)}</p>
                      </div>
                    ))}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Session Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Session Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-neutral-400" />
                  <span>
                    {new Date(interview.created_at).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric"
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-neutral-400" />
                  <span>
                    {interview.duration_seconds 
                      ? `${Math.round(interview.duration_seconds / 60)} minutes`
                      : "3 minutes (demo)"
                    }
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Key Quotes */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Quote className="w-4 h-4" />
                  Key Quotes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {transcript
                    .filter((e: { speaker: string }) => e.speaker === "Participant")
                    .slice(0, 3)
                    .map((entry: { text: string; timestamp: number }, index: number) => (
                      <div 
                        key={index}
                        className="insight-quote text-xs cursor-pointer hover:bg-neutral-50 p-2 rounded"
                        onClick={() => setCurrentTime(entry.timestamp)}
                      >
                        &quot;{entry.text.slice(0, 80)}...&quot;
                      </div>
                    ))
                  }
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

