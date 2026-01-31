import { getCurrentUser } from "@/lib/supabase/server";
import { AppSidebar } from "@/components/features/app-sidebar";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Middleware already validates authentication and redirects unauthenticated users
  // Use memoized getCurrentUser() to avoid duplicate auth checks within the same request
  const user = await getCurrentUser();

  // User will always exist here due to middleware protection, but check for TypeScript
  if (!user) {
    // This should never happen due to middleware, but TypeScript needs the check
    return null;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fafafa' }}>
      <AppSidebar user={user} />
      <main className="pl-[60px]">
        {children}
      </main>
    </div>
  );
}
