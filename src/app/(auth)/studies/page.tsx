import { createClient } from "@/lib/supabase/server";
import { StudiesContent } from "@/components/features/studies-content";
import { Study } from "@/lib/types/database";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function StudiesPage() {
  const supabase = await createClient();
  
  // Fetch user's studies
  const { data: studies } = await supabase
    .from("studies")
    .select("*")
    .order("created_at", { ascending: false });

  return <StudiesContent studies={(studies as Study[]) || []} />;
}

