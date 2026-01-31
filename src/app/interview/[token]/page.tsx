import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ParticipantInterview } from "@/components/features/participant-interview";
import { Study, InterviewGuide, StudyFlowWithSections } from "@/lib/types/database";

interface ParticipantInterviewPageProps {
  params: Promise<{ token: string }>;
}

export default async function ParticipantInterviewPage({ params }: ParticipantInterviewPageProps) {
  const { token } = await params;
  const supabase = await createClient();

  // First, try to find an interview by token
  const { data: interview } = await supabase
    .from("interviews")
    .select("study_id, is_test")
    .eq("token", token)
    .single();

  let study = null;

  if (interview) {
    // Found an interview, get the associated study
    const { data: studyData } = await supabase
      .from("studies")
      .select("*")
      .eq("id", interview.study_id)
      .single();

    study = studyData;

    // For test interviews, allow any status. For regular interviews, require "live" status
    if (!interview.is_test && study?.status !== "live") {
      notFound();
    }
  } else {
    // Fallback: Try to find study by token (using first 8 chars of study id)
    // This is for backwards compatibility
    const { data: studies } = await supabase
      .from("studies")
      .select("*")
      .eq("status", "live");

    study = studies?.find(s => s.id.slice(0, 8) === token);
  }

  if (!study) {
    notFound();
  }

  // Fetch study flow (new system) or interview guide (legacy)
  const { data: studyFlow } = await supabase
    .from("study_flows")
    .select("*, flow_sections(*, flow_items(*))")
    .eq("study_id", study.id)
    .maybeSingle();

  // Convert study flow to interview guide format for compatibility
  let guide: InterviewGuide | null = null;

  if (studyFlow) {
    const typedFlow = studyFlow as unknown as StudyFlowWithSections;
    const sections = (typedFlow.sections || [])
      .sort((a, b) => a.display_order - b.display_order)
      .map((section) => {
        const items = (section.items || [])
          .sort((a, b) => a.display_order - b.display_order)
          .filter(item => item.item_type !== 'instruction'); // Filter out instructions for interview guide

        const questions = items.map((item) => ({
          id: item.id,
          text: item.question_text || "",
          probes: [], // TODO: Extract probes from item_config if available
        }));

        return {
          id: section.id,
          title: section.title,
          questions,
        };
      });

    guide = {
      id: typedFlow.id,
      study_id: study.id,
      sections,
      approved_at: null,
      approved_by: null,
      created_at: typedFlow.created_at,
      updated_at: typedFlow.updated_at,
    };
  } else {
    // Fallback: Try legacy interview guide
    const { data: legacyGuide } = await supabase
      .from("interview_guides")
      .select("*")
      .eq("study_id", study.id)
      .maybeSingle();

    guide = legacyGuide as InterviewGuide;
  }

  if (!guide) {
    notFound();
  }

  return (
    <ParticipantInterview
      study={study as Study}
      guide={guide}
      token={token}
    />
  );
}

