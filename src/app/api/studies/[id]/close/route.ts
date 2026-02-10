import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { deleteStudyAgent } from "@/lib/elevenlabs/agents";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/studies/[id]/close - Permanently close a study
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: study, error: fetchError } = await supabase
      .from("studies")
      .select("id, user_id, status")
      .eq("id", id)
      .single();

    if (fetchError || !study) {
      return NextResponse.json({ error: "Study not found" }, { status: 404 });
    }

    if (study.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (study.status !== "live" && study.status !== "paused") {
      return NextResponse.json(
        { error: "Only live or paused studies can be closed" },
        { status: 400 }
      );
    }

    // Update study status to closed
    const { data: updatedStudy, error: updateError } = await supabase
      .from("studies")
      .update({
        status: "closed",
        closed_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: "Failed to close study" }, { status: 500 });
    }

    // Deactivate all distributions
    await supabase
      .from("distributions")
      .update({ is_active: false })
      .eq("study_id", id);

    // Clean up ElevenLabs agent (non-blocking — don't fail the close if this errors)
    deleteStudyAgent(id).catch((err) =>
      console.error("Failed to delete ElevenLabs agent on close:", err)
    );

    return NextResponse.json({ study: updatedStudy });
  } catch (error) {
    console.error("Error in POST /api/studies/[id]/close:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
