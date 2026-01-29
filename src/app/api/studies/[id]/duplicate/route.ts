import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/studies/[id]/duplicate - Duplicate a study
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch the original study
    const { data: originalStudy, error: fetchError } = await supabase
      .from("studies")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !originalStudy) {
      return NextResponse.json({ error: "Study not found" }, { status: 404 });
    }

    if (originalStudy.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Create a duplicate study with a new title
    const { data: newStudy, error: createError } = await supabase
      .from("studies")
      .insert({
        user_id: user.id,
        title: `${originalStudy.title} (Copy)`,
        status: "draft", // Always start as draft
        project_type: originalStudy.project_type,
        objective: originalStudy.objective,
        topics: originalStudy.topics,
        success_criteria: originalStudy.success_criteria,
        audience: originalStudy.audience,
        guidelines: originalStudy.guidelines,
        intro_text: originalStudy.intro_text,
        brief_messages: originalStudy.brief_messages,
        about_interviewer: originalStudy.about_interviewer,
        language: originalStudy.language,
        // Don't copy voice_profile_id, published_at, closed_at
      })
      .select()
      .single();

    if (createError || !newStudy) {
      console.error("Error creating duplicate study:", createError);
      return NextResponse.json(
        { error: "Failed to duplicate study" },
        { status: 500 }
      );
    }

    // Duplicate the study flow if it exists
    const { data: originalFlow } = await supabase
      .from("study_flows")
      .select("*")
      .eq("study_id", id)
      .single();

    if (originalFlow) {
      const { data: newFlow, error: flowError } = await supabase
        .from("study_flows")
        .insert({
          study_id: newStudy.id,
          welcome_message: originalFlow.welcome_message,
          welcome_logo_url: originalFlow.welcome_logo_url,
        })
        .select()
        .single();

      if (!flowError && newFlow) {
        // Duplicate flow sections
        const { data: originalSections } = await supabase
          .from("flow_sections")
          .select("*")
          .eq("study_flow_id", originalFlow.id)
          .order("display_order");

        if (originalSections) {
          for (const section of originalSections) {
            const { data: newSection } = await supabase
              .from("flow_sections")
              .insert({
                study_flow_id: newFlow.id,
                title: section.title,
                display_order: section.display_order,
                stimulus_type: section.stimulus_type,
                stimulus_config: section.stimulus_config,
              })
              .select()
              .single();

            if (newSection) {
              // Duplicate flow items for this section
              const { data: originalItems } = await supabase
                .from("flow_items")
                .select("*")
                .eq("section_id", section.id)
                .order("display_order");

              if (originalItems && originalItems.length > 0) {
                await supabase.from("flow_items").insert(
                  originalItems.map((item) => ({
                    section_id: newSection.id,
                    item_type: item.item_type,
                    display_order: item.display_order,
                    question_text: item.question_text,
                    response_mode: item.response_mode,
                    item_config: item.item_config,
                  }))
                );
              }
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true, study: newStudy });
  } catch (error) {
    console.error("Error in POST /api/studies/[id]/duplicate:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
