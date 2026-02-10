import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { ensureStudyAgent } from "@/lib/elevenlabs/agents";

// POST /api/distributions - Create a new distribution for a study
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      study_id,
      name,
      max_responses,
      redirect_completion_url,
      redirect_screenout_url,
      redirect_quota_full_url,
    } = body;

    // Validate required fields
    if (!study_id) {
      return NextResponse.json({ error: "study_id is required" }, { status: 400 });
    }
    if (!name || name.trim() === "") {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    // Verify the study exists and belongs to the user
    const { data: study, error: studyError } = await supabase
      .from("studies")
      .select("id, user_id, status, study_type")
      .eq("id", study_id)
      .single();

    if (studyError || !study) {
      return NextResponse.json({ error: "Study not found" }, { status: 404 });
    }

    if (study.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if an active distribution already exists for this study
    const { data: existingDistribution } = await supabase
      .from("distributions")
      .select("id")
      .eq("study_id", study_id)
      .eq("is_active", true)
      .maybeSingle();

    if (existingDistribution) {
      return NextResponse.json(
        { error: "An active distribution already exists for this study" },
        { status: 409 }
      );
    }

    // Generate unique shareable link ID (10 characters, base64url)
    const shareable_link_id = randomBytes(8).toString("base64url").slice(0, 10);

    // Create the distribution
    const { data: distribution, error: createError } = await supabase
      .from("distributions")
      .insert({
        study_id,
        name: name.trim(),
        shareable_link_id,
        max_responses: max_responses || null,
        redirect_completion_url: redirect_completion_url || null,
        redirect_screenout_url: redirect_screenout_url || null,
        redirect_quota_full_url: redirect_quota_full_url || null,
        is_active: true,
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating distribution:", createError);
      return NextResponse.json(
        { error: "Failed to create distribution" },
        { status: 500 }
      );
    }

    // Update study status to live and set published_at
    const { error: updateError } = await supabase
      .from("studies")
      .update({
        status: "live",
        published_at: new Date().toISOString(),
      })
      .eq("id", study_id);

    if (updateError) {
      console.error("Error updating study status:", updateError);
      // Distribution was created but study status update failed
      // Continue and return the distribution anyway
    }

    // Create a dedicated ElevenLabs agent for streaming studies
    if (study.study_type === "streaming") {
      try {
        await ensureStudyAgent(study_id);
      } catch (agentError) {
        console.error("Error creating ElevenLabs agent:", agentError);
        // Return the distribution but flag the agent creation failure
        return NextResponse.json(
          { distribution, warning: "Distribution created but ElevenLabs agent creation failed. Streaming interviews may not work." },
          { status: 201 }
        );
      }
    }

    return NextResponse.json({ distribution }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/distributions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
