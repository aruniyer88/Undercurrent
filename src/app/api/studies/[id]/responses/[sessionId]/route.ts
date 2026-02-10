import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ id: string; sessionId: string }>;
}

// GET /api/studies/[id]/responses/[sessionId] - Single session detail
export async function GET(_request: NextRequest, { params }: RouteParams) {
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
      .select("id, user_id")
      .eq("id", studyId)
      .single();

    if (studyError || !study) {
      return NextResponse.json({ error: "Study not found" }, { status: 404 });
    }
    if (study.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch session
    const { data: session, error: sessionError } = await supabase
      .from("interview_sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("study_id", studyId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // Fetch conversation turns ordered by turn_number
    const { data: turns } = await supabase
      .from("conversation_turns")
      .select("*")
      .eq("session_id", sessionId)
      .order("turn_number", { ascending: true });

    // Fetch study flow with sections and items for transcript organization
    const { data: studyFlow } = await supabase
      .from("study_flows")
      .select(
        `
        id,
        flow_sections (
          id, title, display_order,
          flow_items (
            id, item_type, display_order, question_text, response_mode, item_config
          )
        )
      `
      )
      .eq("study_id", studyId)
      .single();

    // Fetch screener responses with question text
    const { data: screenerResponses } = await supabase
      .from("screener_responses")
      .select(
        `
        id, answer, passed,
        screener_questions (
          id, question_text, question_type, options, qualifying_answers
        )
      `
      )
      .eq("session_id", sessionId);

    // Organize turns into transcript sections
    const sections = (studyFlow?.flow_sections || [])
      .sort(
        (a: { display_order: number }, b: { display_order: number }) =>
          a.display_order - b.display_order
      )
      .map(
        (section: {
          id: string;
          title: string;
          display_order: number;
          flow_items: {
            id: string;
            item_type: string;
            display_order: number;
            question_text: string | null;
            response_mode: string | null;
            item_config: Record<string, unknown>;
          }[];
        }) => ({
          section: {
            id: section.id,
            title: section.title,
            display_order: section.display_order,
          },
          questions: (section.flow_items || [])
            .sort(
              (
                a: { display_order: number },
                b: { display_order: number }
              ) => a.display_order - b.display_order
            )
            .map(
              (item: {
                id: string;
                item_type: string;
                display_order: number;
                question_text: string | null;
                response_mode: string | null;
                item_config: Record<string, unknown>;
              }) => ({
                item,
                turns: (turns || []).filter(
                  (t: { flow_item_id: string | null }) =>
                    t.flow_item_id === item.id
                ),
              })
            ),
        })
      );

    return NextResponse.json({
      session,
      conversationTurns: turns || [],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      screenerResponses: (screenerResponses || []).map((sr: any) => ({
        ...sr,
        screener_question: sr.screener_questions,
      })),
      transcript: sections,
    });
  } catch (error) {
    console.error(
      "Error in GET /api/studies/[id]/responses/[sessionId]:",
      error
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
