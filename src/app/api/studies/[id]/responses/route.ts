import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/studies/[id]/responses - List sessions + aggregate stats
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
      .select("id, user_id")
      .eq("id", studyId)
      .single();

    if (studyError || !study) {
      return NextResponse.json({ error: "Study not found" }, { status: 404 });
    }
    if (study.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse query params
    const url = new URL(request.url);
    const completion = url.searchParams.get("completion") || "all";
    const review = url.searchParams.get("review") || "all";
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "50", 10);
    const offset = (page - 1) * limit;

    // Build sessions query with filters
    let sessionsQuery = supabase
      .from("interview_sessions")
      .select(
        "id, participant_name, participant_email, started_at, completed_at, review_status, language, actual_duration_seconds, recording_url, created_at",
        { count: "exact" }
      )
      .eq("study_id", studyId)
      .order("started_at", { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1);

    // Apply completion filter
    if (completion === "complete") {
      sessionsQuery = sessionsQuery.not("completed_at", "is", null);
    } else if (completion === "in_progress") {
      sessionsQuery = sessionsQuery
        .not("started_at", "is", null)
        .is("completed_at", null);
    } else if (completion === "not_started") {
      sessionsQuery = sessionsQuery.is("started_at", null);
    }

    // Apply review filter
    if (review !== "all") {
      sessionsQuery = sessionsQuery.eq("review_status", review);
    }

    const { data: sessions, error: sessionsError, count } = await sessionsQuery;

    if (sessionsError) {
      console.error("Error fetching sessions:", sessionsError);
      return NextResponse.json(
        { error: "Failed to fetch sessions" },
        { status: 500 }
      );
    }

    // Compute aggregate stats (unfiltered, for the overview cards)
    const { data: allSessions } = await supabase
      .from("interview_sessions")
      .select(
        "started_at, completed_at, review_status, actual_duration_seconds"
      )
      .eq("study_id", studyId);

    const all = allSessions || [];
    const totalSessions = all.filter((s) => s.started_at).length;
    const completedSessions = all.filter((s) => s.completed_at).length;
    const acceptedSessions = all.filter(
      (s) => s.review_status === "accepted"
    ).length;
    const durations = all
      .filter((s) => s.actual_duration_seconds !== null)
      .map((s) => s.actual_duration_seconds as number);
    const avgDurationSeconds =
      durations.length > 0
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : null;

    // Map sessions to list items with row numbers
    const items = (sessions || []).map((s, i) => ({
      id: s.id,
      rowNumber: offset + i + 1,
      participantName: s.participant_name,
      participantEmail: s.participant_email,
      startedAt: s.started_at,
      completedAt: s.completed_at,
      completionStatus: s.completed_at
        ? "complete"
        : s.started_at
          ? "in_progress"
          : "not_started",
      reviewStatus: s.review_status,
      language: s.language,
      durationSeconds: s.actual_duration_seconds,
      recordingUrl: s.recording_url,
    }));

    return NextResponse.json({
      sessions: items,
      stats: {
        totalSessions,
        completedSessions,
        acceptedSessions,
        avgDurationSeconds,
      },
      totalCount: count || 0,
      page,
      limit,
    });
  } catch (error) {
    console.error("Error in GET /api/studies/[id]/responses:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
