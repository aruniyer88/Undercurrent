import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// DELETE /api/studies/[id] - Delete a study
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the study exists and belongs to the user
    const { data: study, error: fetchError } = await supabase
      .from("studies")
      .select("id, user_id")
      .eq("id", id)
      .single();

    if (fetchError || !study) {
      return NextResponse.json({ error: "Study not found" }, { status: 404 });
    }

    if (study.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete the study (cascade will handle related records if configured)
    const { error: deleteError } = await supabase
      .from("studies")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Error deleting study:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete study" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/studies/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
