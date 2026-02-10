import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

interface RouteParams {
  params: Promise<{ id: string; sessionId: string }>;
}

// POST /api/studies/[id]/responses/[sessionId]/summary - Generate AI summary
export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id: studyId, sessionId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify study ownership
    const { data: study, error: studyError } = await supabase
      .from("studies")
      .select("id, user_id, title, objective")
      .eq("id", studyId)
      .single();

    if (studyError || !study) {
      return NextResponse.json({ error: "Study not found" }, { status: 404 });
    }
    if (study.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check for cached summary
    const { data: session } = await supabase
      .from("interview_sessions")
      .select("ai_summary, completed_at")
      .eq("id", sessionId)
      .eq("study_id", studyId)
      .single();

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // Return cached summary if it exists and force is not set
    const url = new URL(_request.url);
    const force = url.searchParams.get("force") === "true";

    if (session.ai_summary && !force) {
      return NextResponse.json({ summary: session.ai_summary });
    }

    // Fetch conversation turns for the transcript
    const { data: turns } = await supabase
      .from("conversation_turns")
      .select("speaker, text_content, is_probe")
      .eq("session_id", sessionId)
      .order("turn_number", { ascending: true });

    if (!turns || turns.length === 0) {
      return NextResponse.json(
        { error: "No conversation data to summarize" },
        { status: 400 }
      );
    }

    // Build transcript text
    const transcript = turns
      .map(
        (t) =>
          `${t.speaker === "ai" ? "Interviewer" : "Participant"}: ${t.text_content}`
      )
      .join("\n");

    // Generate summary with GPT-4o-mini
    const openai = new OpenAI();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a qualitative research analyst. Given an interview transcript from a study titled "${study.title}" with objective "${study.objective || "N/A"}", provide exactly 3 concise bullet points summarizing the key takeaways from this participant's interview. Each bullet should be 1-2 sentences. Focus on the most insightful or actionable findings.`,
        },
        {
          role: "user",
          content: transcript,
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const responseText = completion.choices[0]?.message?.content || "";

    // Parse bullets from the response
    const bullets = responseText
      .split("\n")
      .map((line) => line.replace(/^[-•*]\s*/, "").trim())
      .filter((line) => line.length > 0)
      .slice(0, 3);

    const summary = {
      bullets,
      generated_at: new Date().toISOString(),
      model: "gpt-4o-mini",
    };

    // Cache the summary
    await supabase
      .from("interview_sessions")
      .update({ ai_summary: summary })
      .eq("id", sessionId);

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Error in POST summary:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
