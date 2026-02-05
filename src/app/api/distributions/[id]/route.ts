import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/distributions/[id] - Get a distribution by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get distribution with study info to verify ownership
    const { data: distribution, error: fetchError } = await supabase
      .from("distributions")
      .select("*, studies(user_id)")
      .eq("id", id)
      .single();

    if (fetchError || !distribution) {
      return NextResponse.json({ error: "Distribution not found" }, { status: 404 });
    }

    // Verify ownership through study
    const study = distribution.studies as { user_id: string } | null;
    if (!study || study.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Remove nested study object from response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { studies: _studiesRelation, ...distributionData } = distribution;

    return NextResponse.json({ distribution: distributionData });
  } catch (error) {
    console.error("Error in GET /api/distributions/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/distributions/[id] - Update a distribution
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      max_responses,
      redirect_completion_url,
      redirect_screenout_url,
      redirect_quota_full_url,
    } = body;

    // Get existing distribution with study info to verify ownership
    const { data: existingDistribution, error: fetchError } = await supabase
      .from("distributions")
      .select("*, studies(user_id)")
      .eq("id", id)
      .single();

    if (fetchError || !existingDistribution) {
      return NextResponse.json({ error: "Distribution not found" }, { status: 404 });
    }

    // Verify ownership through study
    const study = existingDistribution.studies as { user_id: string } | null;
    if (!study || study.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) {
      if (name.trim() === "") {
        return NextResponse.json({ error: "name cannot be empty" }, { status: 400 });
      }
      updateData.name = name.trim();
    }
    if (max_responses !== undefined) {
      updateData.max_responses = max_responses || null;
    }
    if (redirect_completion_url !== undefined) {
      updateData.redirect_completion_url = redirect_completion_url || null;
    }
    if (redirect_screenout_url !== undefined) {
      updateData.redirect_screenout_url = redirect_screenout_url || null;
    }
    if (redirect_quota_full_url !== undefined) {
      updateData.redirect_quota_full_url = redirect_quota_full_url || null;
    }

    // Update the distribution
    const { data: distribution, error: updateError } = await supabase
      .from("distributions")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating distribution:", updateError);
      return NextResponse.json(
        { error: "Failed to update distribution" },
        { status: 500 }
      );
    }

    return NextResponse.json({ distribution });
  } catch (error) {
    console.error("Error in PATCH /api/distributions/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
