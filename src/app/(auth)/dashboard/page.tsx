import { createClient } from "@/lib/supabase/server";
import { DashboardContent } from "@/components/features/dashboard-content";
import { Study } from "@/lib/types/database";

export default async function DashboardPage() {
  const supabase = await createClient();

  // Fetch user's studies
  const { data: studies } = await supabase
    .from("studies")
    .select("*")
    .order("created_at", { ascending: false });

  return <DashboardContent studies={(studies as Study[]) || []} />;
}

