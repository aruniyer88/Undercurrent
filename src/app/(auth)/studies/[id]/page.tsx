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

  // For live, paused, or closed studies: route based on response count
  if (study.status === "live" || study.status === "paused" || study.status === "closed") {
    const { count } = await supabase
      .from("interviews")
      .select("id", { count: "exact", head: true })
      .eq("study_id", id)
      .eq("status", "completed")
      .eq("is_test", false);

    const responseCount = count ?? 0;

    if (responseCount === 0) {
      // No responses — show distribution page (step 5)
      redirect(`/studies/wizard?studyId=${id}`);
    } else if (responseCount <= 3) {
      // Few responses — show responses section
      redirect(`/studies/wizard?studyId=${id}&section=responses`);
    } else {
      // Enough data for analysis
      redirect(`/studies/wizard?studyId=${id}&section=analysis`);
    }
  }

  // Draft, ready_for_test, tested — let wizard completion check handle step
  redirect(`/studies/wizard?studyId=${id}`);
}
