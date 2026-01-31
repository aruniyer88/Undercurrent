"use client";

import { useState } from "react";
import Link from "next/link";
import { Study, Report, Interview, Insight } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  ArrowLeft,
  BarChart3,
  Users,
  Clock,
  FileText,
  Lightbulb,
  Quote,
  Share2,
  Download,
  Copy,
  CheckCircle2,
  Loader2,
  Sparkles,
  Play
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ReportViewProps {
  study: Study;
  report: Report;
  interviews: Interview[];
}

// Sample insights for demo (would be AI-generated in production)
const SAMPLE_INSIGHTS: Insight[] = [
  {
    id: "1",
    headline: "Users struggle with initial onboarding",
    description: "Multiple participants mentioned confusion during the first-time setup process.",
    evidence: [
      { quote: "I wasn't sure what to do next after signing up. The interface was overwhelming.", interviewId: "int-1" },
      { quote: "It took me a while to figure out where to start.", interviewId: "int-2" }
    ]
  },
  {
    id: "2",
    headline: "Voice feature highly valued",
    description: "Participants expressed strong positive sentiment about the voice interaction.",
    evidence: [
      { quote: "Hearing a familiar voice made me feel more comfortable sharing honestly.", interviewId: "int-1" },
      { quote: "It felt like talking to a real person, which made it easier.", interviewId: "int-3" }
    ]
  },
  {
    id: "3",
    headline: "Mobile experience needs improvement",
    description: "Several participants attempted to use the product on mobile with mixed results.",
    evidence: [
      { quote: "I tried on my phone first but some buttons were hard to tap.", interviewId: "int-2" }
    ]
  }
];

export function ReportView({ study, report, interviews }: ReportViewProps) {
  const { toast } = useToast();
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Use sample insights if none exist
  const insights = report.insights?.length > 0 ? report.insights : SAMPLE_INSIGHTS;
  const hasRealData = interviews.filter(i => i.status === "completed").length > 0;

  // Stats
  const completedInterviews = interviews.filter(i => i.status === "completed").length;
  const avgDuration = interviews.length > 0 
    ? Math.round(interviews.reduce((acc, i) => acc + (i.duration_seconds || 0), 0) / interviews.length / 60)
    : 0;

  const shareUrl = `${window.location.origin}/report/${report.share_token}`;

  const handleCopyShareLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    toast({
      title: "Link copied!",
      description: "Share this link to give read-only access to the report.",
    });
  };

  const handleGenerateInsights = async () => {
    setIsGenerating(true);
    // Simulate AI generation
    await new Promise(resolve => setTimeout(resolve, 3000));
    setIsGenerating(false);
    toast({
      title: "Insights generated",
      description: "New insights have been synthesized from your interviews.",
    });
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fafafa' }}>
      {/* Header */}
      <div className="sticky top-16 z-40 bg-white border-b border-neutral-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-lg font-semibold text-neutral-900">
                  {study.title}
                </h1>
                <p className="text-sm text-neutral-500">
                  Research Report
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => setShowShareDialog(true)}>
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-neutral-900">{completedInterviews}</p>
                  <p className="text-sm text-neutral-500">Completed Interviews</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-success-50 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-success-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-neutral-900">{avgDuration || "—"}</p>
                  <p className="text-sm text-neutral-500">Avg. Duration (min)</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent-50 flex items-center justify-center">
                  <Lightbulb className="w-6 h-6 text-accent-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-neutral-900">{insights.length}</p>
                  <p className="text-sm text-neutral-500">Key Insights</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="insights" className="space-y-6">
          <TabsList>
            <TabsTrigger value="insights">
              <Lightbulb className="w-4 h-4 mr-2" />
              Insights
            </TabsTrigger>
            <TabsTrigger value="interviews">
              <FileText className="w-4 h-4 mr-2" />
              Interviews ({interviews.length})
            </TabsTrigger>
          </TabsList>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Executive Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                {report.summary ? (
                  <p className="text-neutral-600 leading-relaxed">{report.summary}</p>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-neutral-500 mb-4">
                      {hasRealData 
                        ? "Generate an AI summary from your interview data."
                        : "Complete at least one interview to generate a summary."
                      }
                    </p>
                    {hasRealData && (
                      <Button 
                        onClick={handleGenerateInsights}
                        disabled={isGenerating}
                        className="bg-primary-600 hover:bg-primary-700"
                      >
                        {isGenerating ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4 mr-2" />
                        )}
                        Generate Summary
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Key Insights */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-neutral-900">Key Insights</h2>
                {hasRealData && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleGenerateInsights}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-2" />
                    )}
                    Regenerate
                  </Button>
                )}
              </div>

              {!hasRealData && (
                <div className="bg-warning-50 border border-warning-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-warning-800">
                    These are sample insights for demonstration. Complete interviews to generate real insights.
                  </p>
                </div>
              )}

              <div className="space-y-4">
                {insights.map((insight, index) => (
                  <Card key={insight.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-semibold text-primary-600">{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-neutral-900 mb-2">
                            {insight.headline}
                          </h3>
                          {insight.description && (
                            <p className="text-sm text-neutral-600 mb-4">
                              {insight.description}
                            </p>
                          )}
                          
                          {/* Evidence Quotes */}
                          <div className="space-y-3">
                            {insight.evidence.map((ev, evIndex) => (
                              <div 
                                key={evIndex}
                                className="insight-quote"
                              >
                                <Quote className="w-4 h-4 text-primary-400 inline mr-2" />
                                <span className="text-sm">{ev.quote}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Interviews Tab */}
          <TabsContent value="interviews">
            {interviews.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-neutral-400" />
                  </div>
                  <h3 className="font-semibold text-neutral-900 mb-2">
                    No interviews yet
                  </h3>
                  <p className="text-sm text-neutral-500 mb-4">
                    Share your interview link to start collecting responses.
                  </p>
                  <Link href={`/studies/${study.id}/publish`}>
                    <Button>Go to Publish</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {interviews.map((interview) => (
                  <Card key={interview.id} className="hover:border-neutral-300 transition-colors">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center",
                            interview.status === "completed" ? "bg-success-100" : "bg-neutral-100"
                          )}>
                            {interview.status === "completed" ? (
                              <CheckCircle2 className="w-5 h-5 text-success-600" />
                            ) : (
                              <Clock className="w-5 h-5 text-neutral-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-neutral-900">
                              {interview.participant_name || "Anonymous Participant"}
                            </p>
                            <p className="text-sm text-neutral-500">
                              {new Date(interview.created_at).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit"
                              })}
                              {interview.duration_seconds && (
                                <> · {Math.round(interview.duration_seconds / 60)} min</>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={interview.status === "completed" ? "badge-live" : "badge-draft"}>
                            {interview.status}
                          </Badge>
                          {interview.status === "completed" && (
                            <Link href={`/studies/${study.id}/interviews/${interview.id}`}>
                              <Button variant="ghost" size="sm">
                                <Play className="w-4 h-4 mr-1" />
                                View
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Report</DialogTitle>
            <DialogDescription>
              Share a read-only link to this report with stakeholders.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 px-3 py-2 border border-neutral-200 rounded-md text-sm bg-neutral-50"
              />
              <Button onClick={handleCopyShareLink}>
                {isCopied ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowShareDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

