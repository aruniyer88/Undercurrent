import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";

interface StudyPageProps {
  params: Promise<{ id: string }>;
}

export default async function StudyPage({ params }: StudyPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch the study to check its status
  const { data: study, error } = await supabase
    .from("studies")
    .select("id, status")
    .eq("id", id)
    .single();

  if (error || !study) {
    notFound();
  }

  // Redirect based on study status
  switch (study.status) {
    case "draft":
      // Draft studies go to the wizard for editing
      redirect(`/studies/wizard?studyId=${id}`);
    case "ready_for_test":
    case "tested":
      // Ready/tested studies go to the test page
      redirect(`/studies/${id}/test`);
    case "live":
      // Live studies go to the report/monitoring page
      redirect(`/studies/${id}/report`);
    case "closed":
      // Closed studies go to the report page
      redirect(`/studies/${id}/report`);
    default:
      // Default to wizard
      redirect(`/studies/wizard?studyId=${id}`);
  }
}
