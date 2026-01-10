import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { TestInterview } from "@/components/features/test-interview";
import { Study, InterviewGuide } from "@/lib/types/database";

interface TestInterviewPageProps {
  params: Promise<{ id: string }>;
}

export default async function TestInterviewPage({ params }: TestInterviewPageProps) {
  const { id } = await params;
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

  // Fetch interview guide
  const { data: guide } = await supabase
    .from("interview_guides")
    .select("*")
    .eq("study_id", id)
    .single();

  if (!guide) {
    notFound();
  }

  return (
    <TestInterview 
      study={study as Study} 
      guide={guide as InterviewGuide}
    />
  );
}

