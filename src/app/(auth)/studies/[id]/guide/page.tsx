import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { GuideEditor } from "@/components/features/guide-editor";
import { Study, InterviewGuide, GuideSection } from "@/lib/types/database";

interface GuidePageProps {
  params: Promise<{ id: string }>;
}

// Generate default guide sections based on study
function generateDefaultGuide(study: Study): GuideSection[] {
  return [
    {
      id: crypto.randomUUID(),
      title: "Introduction & Rapport",
      questions: [
        {
          id: crypto.randomUUID(),
          text: "Thanks for joining today! Before we dive in, could you tell me a bit about yourself and your role?",
          probes: [
            "How long have you been in this role?",
            "What does a typical day look like for you?"
          ]
        }
      ]
    },
    {
      id: crypto.randomUUID(),
      title: "Core Experience",
      questions: [
        {
          id: crypto.randomUUID(),
          text: `When you think about ${study.topics?.[0] || "this topic"}, what comes to mind first?`,
          probes: [
            "Can you walk me through a specific example?",
            "How did that make you feel?"
          ]
        },
        {
          id: crypto.randomUUID(),
          text: "What challenges or frustrations have you experienced in this area?",
          probes: [
            "How often does this happen?",
            "What impact does this have on you?"
          ]
        }
      ]
    },
    {
      id: crypto.randomUUID(),
      title: "Deeper Exploration",
      questions: [
        {
          id: crypto.randomUUID(),
          text: "If you could change one thing about your current experience, what would it be?",
          probes: [
            "Why is that important to you?",
            "What would that change enable you to do?"
          ]
        },
        {
          id: crypto.randomUUID(),
          text: "How do you currently solve or work around this?",
          probes: [
            "What alternatives have you tried?",
            "What's missing from those solutions?"
          ]
        }
      ]
    },
    {
      id: crypto.randomUUID(),
      title: "Wrap Up",
      questions: [
        {
          id: crypto.randomUUID(),
          text: "Is there anything else you'd like to share that we haven't covered?",
          probes: [
            "Any final thoughts or recommendations?"
          ]
        }
      ]
    }
  ];
}

export default async function GuidePage({ params }: GuidePageProps) {
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

  // Fetch or create interview guide
  let { data: guide } = await supabase
    .from("interview_guides")
    .select("*")
    .eq("study_id", id)
    .single();

  // If no guide exists, create one with default sections
  if (!guide) {
    const defaultSections = generateDefaultGuide(study as Study);
    const { data: newGuide, error: createError } = await supabase
      .from("interview_guides")
      .insert({
        study_id: id,
        sections: defaultSections,
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating guide:", createError);
    }
    guide = newGuide;
  }

  return (
    <GuideEditor 
      study={study as Study} 
      guide={guide as InterviewGuide} 
    />
  );
}

