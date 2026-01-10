import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ParticipantInterview } from "@/components/features/participant-interview";
import { Study, InterviewGuide } from "@/lib/types/database";

interface ParticipantInterviewPageProps {
  params: Promise<{ token: string }>;
}

export default async function ParticipantInterviewPage({ params }: ParticipantInterviewPageProps) {
  const { token } = await params;
  const supabase = await createClient();
  
  // Find study by token (using first 8 chars of study id)
  const { data: studies } = await supabase
    .from("studies")
    .select("*")
    .eq("status", "live");

  const study = studies?.find(s => s.id.slice(0, 8) === token);

  if (!study) {
    notFound();
  }

  // Fetch interview guide
  const { data: guide } = await supabase
    .from("interview_guides")
    .select("*")
    .eq("study_id", study.id)
    .single();

  if (!guide) {
    notFound();
  }

  return (
    <ParticipantInterview 
      study={study as Study} 
      guide={guide as InterviewGuide}
      token={token}
    />
  );
}

