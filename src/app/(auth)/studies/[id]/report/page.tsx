import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ReportView } from "@/components/features/report-view";
import { Study, Report, Interview } from "@/lib/types/database";

interface ReportPageProps {
  params: Promise<{ id: string }>;
}

export default async function ReportPage({ params }: ReportPageProps) {
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

  // Fetch report
  let { data: report } = await supabase
    .from("reports")
    .select("*")
    .eq("study_id", id)
    .single();

  // If no report, create a placeholder
  if (!report) {
    const { data: newReport } = await supabase
      .from("reports")
      .insert({
        study_id: id,
        summary: null,
        insights: [],
      })
      .select()
      .single();
    report = newReport;
  }

  // Fetch interviews
  const { data: interviews } = await supabase
    .from("interviews")
    .select("*")
    .eq("study_id", id)
    .eq("is_test", false)
    .order("created_at", { ascending: false });

  return (
    <ReportView 
      study={study as Study} 
      report={report as Report}
      interviews={(interviews as Interview[]) || []}
    />
  );
}

