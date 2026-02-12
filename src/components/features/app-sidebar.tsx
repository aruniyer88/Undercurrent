"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { LayoutGrid, Settings, LogOut, Waves } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";

interface AppSidebarProps {
  user: User;
}

const navItems = [
  {
    label: "Projects",
    href: "/dashboard",
    icon: LayoutGrid,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const initials = user.email
    ? user.email.split("@")[0].slice(0, 2).toUpperCase()
    : "U";

  return (
    <aside
      className={cn(
        "fixed top-0 left-0 h-screen bg-topbar-bg flex flex-col transition-all duration-200 ease-out",
        isExpanded ? "w-[200px] z-[80]" : "w-[60px] z-50"
      )}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => {
        if (!isDropdownOpen) {
          setIsExpanded(false);
        }
      }}
    >
      {/* Logo */}
      <div className={cn(
        "h-[60px] flex items-center border-b border-white/10",
        isExpanded ? "px-4" : "justify-center"
      )}>
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-primary-600 flex items-center justify-center flex-shrink-0">
            <Waves className="w-5 h-5 text-white" />
          </div>
          {isExpanded && (
            <span className="text-body-strong text-white whitespace-nowrap">
              Undercurrent
            </span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className={cn("flex-1 py-4", isExpanded ? "px-2" : "px-0")}>
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center py-2.5 rounded-md transition-all duration-150",
                    "focus:outline-none focus:ring-2 focus:ring-primary-border focus:ring-offset-1 focus:ring-offset-topbar-bg",
                    isExpanded ? "gap-3 px-3" : "justify-center",
                    isActive
                      ? "bg-primary-600 text-white"
                      : "text-topbar-text hover:bg-white/10"
                  )}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {isExpanded && (
                    <span className="text-body whitespace-nowrap">
                      {item.label}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Account */}
      <div className={cn("py-3 border-t border-white/10", isExpanded ? "px-2" : "px-0")}>
        <DropdownMenu onOpenChange={setIsDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "w-full flex items-center py-2 rounded-md transition-colors",
                "hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-primary-border focus:ring-offset-1 focus:ring-offset-topbar-bg",
                isExpanded ? "gap-3 px-2" : "justify-center"
              )}
            >
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className="bg-primary-600 text-caption font-semibold" style={{ color: 'white' }}>
                  {initials}
                </AvatarFallback>
              </Avatar>
              {isExpanded && (
                <div className="flex flex-col items-start overflow-hidden">
                  <span className="text-caption text-topbar-text truncate max-w-[130px]">
                    {user.email}
                  </span>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="start" side="right" sideOffset={8}>
            <div className="flex items-center justify-start gap-2 p-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary-50 text-primary-700 text-body-strong">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col space-y-0.5 leading-none">
                <p className="text-body-strong text-text-primary truncate max-w-[160px]">
                  {user.email}
                </p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-danger-600 focus:text-danger-600 focus:bg-danger-50"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
