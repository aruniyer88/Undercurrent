import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AuthHeader } from "@/components/features/auth-header";
import { SidePanel } from "@/components/features/side-panel";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-canvas">
      <AuthHeader user={user} />
      <SidePanel />
      <main className="pt-[56px] pl-[220px]">
        {children}
      </main>
    </div>
  );
}
