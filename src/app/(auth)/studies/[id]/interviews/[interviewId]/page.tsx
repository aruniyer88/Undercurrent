import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { InterviewDetail } from "@/components/features/interview-detail";
import { Study, Interview } from "@/lib/types/database";

interface InterviewDetailPageProps {
  params: Promise<{ id: string; interviewId: string }>;
}

export default async function InterviewDetailPage({ params }: InterviewDetailPageProps) {
  const { id, interviewId } = await params;
  const supabase = await createClient();
  
  // Fetch study
  const { data: study, error: studyError } = await supabase
    .from("studies")
    .select("*")
    .eq("id", id)
    .single();

  if (studyError || !study) {
    notFound();
  }

  // Fetch interview
  const { data: interview, error: interviewError } = await supabase
    .from("interviews")
    .select("*")
    .eq("id", interviewId)
    .single();

  if (interviewError || !interview) {
    notFound();
  }

  return (
    <InterviewDetail 
      study={study as Study} 
      interview={interview as Interview}
    />
  );
}

