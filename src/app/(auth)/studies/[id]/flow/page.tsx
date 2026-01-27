import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { StudyFlowBuilder } from "@/components/features/study-flow-builder";
import { Study, StudyFlow, FlowSection, FlowItem } from "@/lib/types/database";

interface StudyFlowPageProps {
  params: Promise<{ id: string }>;
}

export default async function StudyFlowPage({ params }: StudyFlowPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch the study
  const { data: study, error: studyError } = await supabase
    .from("studies")
    .select("*")
    .eq("id", id)
    .single();

  if (studyError || !study) {
    notFound();
  }

  // Fetch existing flow if any
  const { data: existingFlow } = await supabase
    .from("study_flows")
    .select("*")
    .eq("study_id", id)
    .single();

  // If flow exists, fetch sections with items
  let sections: (FlowSection & { items: FlowItem[] })[] = [];
  if (existingFlow) {
    const { data: sectionsData } = await supabase
      .from("flow_sections")
      .select(`
        *,
        items:flow_items(*)
      `)
      .eq("study_flow_id", existingFlow.id)
      .order("display_order");

    if (sectionsData) {
      sections = sectionsData as (FlowSection & { items: FlowItem[] })[];
    }
  }

  return (
    <StudyFlowBuilder
      study={study as Study}
      existingFlow={existingFlow as StudyFlow | null}
      existingSections={sections}
    />
  );
}
