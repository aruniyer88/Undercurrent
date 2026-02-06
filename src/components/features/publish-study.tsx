"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Study } from "@/lib/types/database";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ArrowLeft, 
  Link as LinkIcon,
  Copy,
  CheckCircle2,
  ExternalLink,
  Send,
  Users,
  BarChart3,
  Loader2,
  Rocket
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PublishStudyProps {
  study: Study;
  baseUrl: string;
}

export function PublishStudy({ study, baseUrl }: PublishStudyProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  const [isPublishing, setIsPublishing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  
  // Generate interview link
  const interviewToken = study.id.slice(0, 8);
  const interviewLink = `${baseUrl}/interview/${interviewToken}`;
  
  const isPublished = study.status === "live";

  const handlePublish = async () => {
    setIsPublishing(true);
    
    try {
      const supabase = createClient();
      
      // Create initial interview record for tracking
      await supabase.from("interviews").insert({
        study_id: study.id,
        is_test: false,
        status: "created"
      });
      
      // Update study status
      const { error } = await supabase
        .from("studies")
        .update({ 
          status: "live",
          published_at: new Date().toISOString()
        })
        .eq("id", study.id);

      if (error) throw error;

      toast({
        title: "Study published!",
        description: "Your interview link is now live.",
      });
      
      router.refresh();
    } catch {
      toast({
        title: "Error publishing",
        description: "Failed to publish study. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(interviewLink);
    setIsCopied(true);
    toast({
      title: "Link copied!",
      description: "The interview link has been copied to your clipboard.",
    });
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fafafa' }}>
      {/* Header */}
      <div className="sticky top-16 z-40 bg-white border-b border-neutral-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/studies/${study.id}/test`}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-lg font-semibold text-neutral-900">
                  {isPublished ? "Study Live" : "Publish Study"}
                </h1>
                <p className="text-sm text-neutral-500">
                  {isPublished 
                    ? "Share your interview link with participants"
                    : "Review and publish your study"
                  }
                </p>
              </div>
            </div>
            <Link href={`/studies/${study.id}`}>
              <Button variant="outline">
                <BarChart3 className="w-4 h-4 mr-2" />
                View Report
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid md:grid-cols-[1fr_320px] gap-8">
          {/* Main Content */}
          <div className="space-y-6">
            {/* Study Summary */}
            <Card>
              <CardHeader>
                <CardTitle>{study.title}</CardTitle>
                <CardDescription>
                  {study.project_type && (
                    <span className="capitalize">{study.project_type.replace("_", " ")}</span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {study.objective && (
                  <div>
                    <p className="text-sm font-medium text-neutral-700">Objective</p>
                    <p className="text-sm text-neutral-600 mt-1">{study.objective}</p>
                  </div>
                )}
                {study.audience && (
                  <div>
                    <p className="text-sm font-medium text-neutral-700">Target Audience</p>
                    <p className="text-sm text-neutral-600 mt-1">{study.audience}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Interview Link */}
            <Card className={isPublished ? "border-success-200 bg-success-50/50" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LinkIcon className="w-5 h-5" />
                  Interview Link
                </CardTitle>
                <CardDescription>
                  {isPublished 
                    ? "Share this link with your participants"
                    : "This link will be available after publishing"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input 
                    value={interviewLink}
                    readOnly
                    className={!isPublished ? "opacity-50" : ""}
                  />
                  <Button 
                    onClick={handleCopyLink}
                    disabled={!isPublished}
                    className="shrink-0"
                  >
                    {isCopied ? (
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                    ) : (
                      <Copy className="w-4 h-4 mr-2" />
                    )}
                    {isCopied ? "Copied!" : "Copy"}
                  </Button>
                </div>
                
                {isPublished && (
                  <div className="mt-4 flex gap-2">
                    <a href={interviewLink} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Preview Link
                      </Button>
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Distribution Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="w-5 h-5" />
                  Distribution Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm text-neutral-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success-500 mt-0.5 shrink-0" />
                    Share the link via email, Slack, or your community platform
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success-500 mt-0.5 shrink-0" />
                    Include context about who is asking and why
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success-500 mt-0.5 shrink-0" />
                    Mention the expected time commitment (10-15 minutes)
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success-500 mt-0.5 shrink-0" />
                    Send reminders to increase completion rates
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Publish CTA */}
            {!isPublished && (
              <Card className="border-primary-200 bg-primary-50/50">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
                      <Rocket className="w-6 h-6 text-primary-600" />
                    </div>
                    <h3 className="font-semibold text-neutral-900 mb-2">
                      Ready to go live?
                    </h3>
                    <p className="text-sm text-neutral-600 mb-4">
                      Publishing will generate your interview link and allow participants to complete interviews.
                    </p>
                    <Button 
                      onClick={handlePublish}
                      disabled={isPublishing}
                      className="w-full bg-primary-600 hover:bg-primary-700"
                    >
                      {isPublishing ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Rocket className="w-4 h-4 mr-2" />
                      )}
                      Publish Study
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Status Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Study Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isPublished ? "bg-success-500" : "bg-warning-500"}`} />
                  <span className="text-sm font-medium">
                    {isPublished ? "Live" : "Ready to Publish"}
                  </span>
                </div>
                {study.published_at && (
                  <p className="text-xs text-neutral-500 mt-2">
                    Published {new Date(study.published_at).toLocaleDateString()}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Responses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-neutral-900">0</div>
                <p className="text-sm text-neutral-500">completed interviews</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

