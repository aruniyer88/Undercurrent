import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const RequestSchema = z.object({
  study_id: z.string().uuid("Invalid study ID"),
});

export type GeneratePersonaResponse = {
  persona_prompt: string;
  tokens_used: number;
};

const SYSTEM_PROMPT = `You are designing an AI interviewer persona for a qualitative research study.

Based on the study context provided, write a concise AI interviewer persona prompt (2-4 paragraphs) that describes:
1. Who the AI should act as (role, expertise, background)
2. How it should behave (communication style, tone, pacing)
3. What personality traits to adopt (warmth, curiosity, formality level)

The persona should feel natural for the research context and put the target audience at ease.
Write in second person ("You are..."). Be specific and actionable.
Do NOT include interview questions — only the persona description.
Keep it under 300 words.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { study_id } = RequestSchema.parse(body);

    const supabase = await createClient();

    // Verify the user owns this study
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch study data
    const { data: study, error: studyError } = await supabase
      .from("studies")
      .select("id, user_id, title, objective, audience, about_interviewer, language, study_type")
      .eq("id", study_id)
      .single();

    if (studyError || !study) {
      return NextResponse.json({ error: "Study not found" }, { status: 404 });
    }

    if (study.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Fetch study flow + questions
    const { data: flow } = await supabase
      .from("study_flows")
      .select("id")
      .eq("study_id", study_id)
      .single();

    let questionsText = "No questions defined yet.";
    if (flow) {
      const { data: sections } = await supabase
        .from("flow_sections")
        .select("id, title, display_order")
        .eq("study_flow_id", flow.id)
        .order("display_order");

      if (sections && sections.length > 0) {
        const sectionIds = sections.map((s) => s.id);
        const { data: items } = await supabase
          .from("flow_items")
          .select("section_id, question_text, item_type, display_order")
          .in("section_id", sectionIds)
          .order("display_order");

        if (items && items.length > 0) {
          const questionLines: string[] = [];
          for (const section of sections) {
            const sectionItems = items.filter((i) => i.section_id === section.id);
            if (sectionItems.length > 0) {
              questionLines.push(`${section.title}:`);
              for (const item of sectionItems) {
                if (item.question_text) {
                  questionLines.push(`  - ${item.question_text} (${item.item_type})`);
                }
              }
            }
          }
          questionsText = questionLines.join("\n");
        }
      }
    }

    // Build the user prompt with study context
    const userPrompt = `RESEARCHER CONTEXT:
${study.about_interviewer || "Not provided"}

STUDY OBJECTIVE:
${study.objective || "Not provided"}

TARGET AUDIENCE:
${study.audience || "Not provided"}

INTERVIEW LANGUAGE: ${study.language || "English"}
STUDY TYPE: ${study.study_type} (${study.study_type === "structured" ? "step-by-step questions" : "natural conversation"})

QUESTIONS THE INTERVIEWER WILL ASK:
${questionsText}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const personaPrompt = completion.choices[0]?.message?.content;
    if (!personaPrompt) {
      throw new Error("No content in OpenAI response");
    }

    const tokensUsed = completion.usage?.total_tokens || 0;

    // Store in studies table
    const { error: updateError } = await supabase
      .from("studies")
      .update({
        ai_persona_prompt: personaPrompt.trim(),
        ai_persona_generated_at: new Date().toISOString(),
      })
      .eq("id", study_id);

    if (updateError) {
      console.error("Error saving persona:", updateError);
      throw new Error("Failed to save persona");
    }

    const response: GeneratePersonaResponse = {
      persona_prompt: personaPrompt.trim(),
      tokens_used: tokensUsed,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error generating persona:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof Error && (error.message.includes("rate") || error.message.includes("429"))) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment and try again." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "Failed to generate AI persona. Please try again." },
      { status: 500 }
    );
  }
}
