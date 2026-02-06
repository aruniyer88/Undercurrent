import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { ParticipantInterview } from "@/components/features/participant-interview";
import { Study, InterviewGuide, StudyFlowWithSections, Distribution } from "@/lib/types/database";

interface ParticipantInterviewPageProps {
  params: Promise<{ token: string }>;
}

function StudyUnavailable({ title, message }: { title: string; message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-neutral-900">{title}</h1>
        <p className="text-neutral-600">{message}</p>
      </div>
    </div>
  );
}

export default async function ParticipantInterviewPage({ params }: ParticipantInterviewPageProps) {
  const { token } = await params;
  const supabase = await createClient();

  let study = null;
  let distribution: Distribution | null = null;

  // Check if this is a distribution link (10-char base64url format)
  if (token.length === 10 && /^[A-Za-z0-9_-]+$/.test(token)) {
    // Query without is_active filter so we can show friendly messages for paused/ended studies
    const { data: distributionData } = await supabase
      .from("distributions")
      .select("*")
      .eq("shareable_link_id", token)
      .single();

    if (distributionData) {
      distribution = distributionData as Distribution;

      // Load the study to check its status
      const { data: studyData } = await supabase
        .from("studies")
        .select("*")
        .eq("id", distribution.study_id)
        .single();

      if (studyData) {
        // Handle inactive distributions
        if (!distribution.is_active) {
          if (studyData.status === "paused") {
            return (
              <StudyUnavailable
                title="Study Paused"
                message="This study is temporarily unavailable. Please check back later."
              />
            );
          }
          // closed or any other inactive reason
          return (
            <StudyUnavailable
              title="Study Ended"
              message="This study has ended and is no longer accepting responses."
            />
          );
        }

        // Check quota
        if (distribution.max_responses && distribution.current_responses >= distribution.max_responses) {
          if (distribution.redirect_quota_full_url) {
            redirect(distribution.redirect_quota_full_url);
          }
          return (
            <StudyUnavailable
              title="Study Full"
              message="This study has reached its maximum number of responses."
            />
          );
        }

        if (studyData.status === "live") {
          study = studyData;
        }
      }
    }
  }

  // If not found via distribution, try interview token
  if (!study) {
    const { data: interview } = await supabase
      .from("interviews")
      .select("study_id, is_test")
      .eq("token", token)
      .single();

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
