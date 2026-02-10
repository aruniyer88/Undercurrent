import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { InterviewProvider } from "@/components/features/interview/interview-context";
import { InterviewShell } from "@/components/features/interview/interview-shell";
import type { Study, StudyFlowWithSections, VoiceProfile, Distribution } from "@/lib/types/database";

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

  let study: Study | null = null;
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
          study = studyData as Study;
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
      const { data: studyData } = await supabase
        .from("studies")
        .select("*")
        .eq("id", interview.study_id)
        .single();

      study = studyData as Study | null;

      // For test interviews, allow any status. For regular interviews, require "live" status
      if (!interview.is_test && study?.status !== "live") {
        notFound();
      }
    }
  }

  if (!study) {
    notFound();
  }

  // Fetch study flow with sections and items (native format, no lossy conversion)
  const { data: studyFlowRaw } = await supabase
    .from("study_flows")
    .select("*, flow_sections(*, flow_items(*))")
    .eq("study_id", study.id)
    .maybeSingle();

  if (!studyFlowRaw) {
    notFound();
  }

  // Map the Supabase join naming to our TypeScript types
  const studyFlow: StudyFlowWithSections = {
    ...studyFlowRaw,
    sections: (studyFlowRaw.flow_sections || []).map((section: Record<string, unknown>) => ({
      ...section,
      items: (section.flow_items as unknown[]) || [],
      flow_items: undefined,
    })),
    flow_sections: undefined,
  } as unknown as StudyFlowWithSections;

  // Fetch voice profile if set
  let voiceProfile: VoiceProfile | null = null;
  if (study.voice_profile_id) {
    const { data: vp } = await supabase
      .from("voice_profiles")
      .select("*")
      .eq("id", study.voice_profile_id)
      .single();
    voiceProfile = vp as VoiceProfile | null;
  }

  return (
    <InterviewProvider
      study={study}
      studyFlow={studyFlow}
      voiceProfile={voiceProfile}
      distribution={distribution}
      token={token}
    >
      <InterviewShell />
    </InterviewProvider>
  );
}
