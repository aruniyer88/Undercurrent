import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/studies/[id]/responses/bulk-review - Bulk accept/reject sessions
export async function POST(request: NextRequest, { params }: RouteParams) {
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

    const body = await request.json();
    const { action, session_ids } = body;

    if (!["accept_all", "reject_all", "reject_incomplete"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be accept_all, reject_all, or reject_incomplete." },
        { status: 400 }
      );
    }

    let query = supabase
      .from("interview_sessions")
      .update({
        review_status: action === "accept_all" ? "accepted" : "rejected",
      })
      .eq("study_id", studyId);

    // If session_ids provided, scope to those; otherwise apply to all matching
    if (session_ids && Array.isArray(session_ids) && session_ids.length > 0) {
      query = query.in("id", session_ids);
    }

    // For reject_incomplete, only target sessions without completed_at
    if (action === "reject_incomplete") {
      query = query.is("completed_at", null);
    }

    const { data: updated, error: updateError } = await query.select("id");

    if (updateError) {
      console.error("Error in bulk review:", updateError);
      return NextResponse.json(
        { error: "Failed to update sessions" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      updated: (updated || []).length,
      action,
    });
  } catch (error) {
    console.error("Error in POST bulk-review:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
