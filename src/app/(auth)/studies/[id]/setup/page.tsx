import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { StudySetupForm } from "@/components/features/study-setup-form";
import { Study } from "@/lib/types/database";

interface StudySetupPageProps {
  params: Promise<{ id: string }>;
}

export default async function StudySetupPage({ params }: StudySetupPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  
  const { data: study, error } = await supabase
    .from("studies")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !study) {
    notFound();
  }

  return <StudySetupForm study={study as Study} />;
}

