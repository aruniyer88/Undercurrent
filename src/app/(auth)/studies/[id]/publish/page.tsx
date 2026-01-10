import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PublishStudy } from "@/components/features/publish-study";
import { Study } from "@/lib/types/database";

interface PublishPageProps {
  params: Promise<{ id: string }>;
}

export default async function PublishPage({ params }: PublishPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  
  const { data: study, error } = await supabase
    .from("studies")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !study) {
    notFound();
  }

  // Get the base URL for generating interview links
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  return <PublishStudy study={study as Study} baseUrl={baseUrl} />;
}

