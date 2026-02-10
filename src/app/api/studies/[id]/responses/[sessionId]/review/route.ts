import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ id: string; sessionId: string }>;
}

// PATCH /api/studies/[id]/responses/[sessionId]/review - Update review status
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    const body = await request.json();
    const { review_status } = body;

    if (!["pending", "accepted", "rejected"].includes(review_status)) {
      return NextResponse.json(
        { error: "Invalid review_status. Must be pending, accepted, or rejected." },
        { status: 400 }
      );
    }

    const { data: session, error: updateError } = await supabase
      .from("interview_sessions")
      .update({ review_status })
      .eq("id", sessionId)
      .eq("study_id", studyId)
      .select("id, review_status")
      .single();

    if (updateError || !session) {
      console.error("Error updating review status:", updateError);
      return NextResponse.json(
        { error: "Failed to update review status" },
        { status: 500 }
      );
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error("Error in PATCH review:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
