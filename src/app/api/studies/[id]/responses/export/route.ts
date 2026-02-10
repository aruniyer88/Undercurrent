import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/studies/[id]/responses/export - Export responses as CSV or JSON
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: studyId } = await params;
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
      .select("id, user_id, title")
      .eq("id", studyId)
      .single();

    if (studyError || !study) {
      return NextResponse.json({ error: "Study not found" }, { status: 404 });
    }
    if (study.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const url = new URL(request.url);
    const format = url.searchParams.get("format") || "csv";

    // Fetch all sessions with their turns
    const { data: sessions } = await supabase
      .from("interview_sessions")
      .select("*")
      .eq("study_id", studyId)
      .order("started_at", { ascending: true });

    if (!sessions || sessions.length === 0) {
      return NextResponse.json(
        { error: "No responses to export" },
        { status: 400 }
      );
    }

    // Fetch all turns for these sessions
    const sessionIds = sessions.map((s) => s.id);
    const { data: allTurns } = await supabase
      .from("conversation_turns")
      .select("session_id, speaker, text_content, is_probe, turn_number")
      .in("session_id", sessionIds)
      .order("turn_number", { ascending: true });

    const turnsBySession = new Map<string, typeof allTurns>();
    for (const turn of allTurns || []) {
      const existing = turnsBySession.get(turn.session_id) || [];
      existing.push(turn);
      turnsBySession.set(turn.session_id, existing);
    }

    // Build export rows
    const rows = sessions.map((s, i) => {
      const turns = turnsBySession.get(s.id) || [];
      const transcript = turns
        .map(
          (t) =>
            `${t.speaker === "ai" ? "Interviewer" : "Participant"}: ${t.text_content}`
        )
        .join(" | ");

      const completionStatus = s.completed_at
        ? "complete"
        : s.started_at
          ? "in_progress"
          : "not_started";

      const durationMin = s.actual_duration_seconds
        ? `${Math.floor(s.actual_duration_seconds / 60)}:${String(s.actual_duration_seconds % 60).padStart(2, "0")}`
        : "";

      return {
        "#": i + 1,
        name: s.participant_name || "Anonymous",
        email: s.participant_email || "",
        date: s.started_at
          ? new Date(s.started_at).toISOString().split("T")[0]
          : "",
        status: completionStatus,
        duration: durationMin,
        review: s.review_status,
        language: s.language || "",
        transcript,
      };
    });

    if (format === "json") {
      return NextResponse.json(rows, {
        headers: {
          "Content-Disposition": `attachment; filename="${study.title || "responses"}-export.json"`,
        },
      });
    }

    // CSV format
    const headers = [
      "#",
      "name",
      "email",
      "date",
      "status",
      "duration",
      "review",
      "language",
      "transcript",
    ];
    const csvLines = [headers.join(",")];

    for (const row of rows) {
      const values = headers.map((h) => {
        const val = String(row[h as keyof typeof row] || "");
        // Escape CSV values
        if (val.includes(",") || val.includes('"') || val.includes("\n")) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      });
      csvLines.push(values.join(","));
    }

    const csv = csvLines.join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${study.title || "responses"}-export.csv"`,
      },
    });
  } catch (error) {
    console.error("Error in GET export:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
