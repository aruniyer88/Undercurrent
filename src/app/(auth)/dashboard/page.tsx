import { createClient } from "@/lib/supabase/server";
import { DashboardContent } from "@/components/features/dashboard-content";
import { StudyWithRelations } from "@/lib/types/database";

export default async function DashboardPage() {
  const supabase = await createClient();

  // Fetch user's studies with related data
  const { data: studies } = await supabase
    .from("studies")
    .select(`
      *,
      study_flow:study_flows(
        id,
        sections:flow_sections(
          id,
          items:flow_items(
            id,
            item_type
          )
        )
      ),
      interviews(
        id,
        status
      )
    `)
    .order("created_at", { ascending: false });

  return <DashboardContent studies={(studies as StudyWithRelations[]) || []} />;
}

