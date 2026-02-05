import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/studies/[id]/distribution - Get the active distribution for a study
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: studyId } = await params;
    const supabase = await createClient();

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the study exists and belongs to the user
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

    // Get the active distribution for this study
    const { data: distribution, error: fetchError } = await supabase
      .from("distributions")
      .select("*")
      .eq("study_id", studyId)
      .eq("is_active", true)
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching distribution:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch distribution" },
        { status: 500 }
      );
    }

    // Return null if no distribution exists (not an error)
    return NextResponse.json({ distribution: distribution || null });
  } catch (error) {
    console.error("Error in GET /api/studies/[id]/distribution:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
