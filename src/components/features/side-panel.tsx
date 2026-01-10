"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    label: "Home",
    href: "/dashboard",
    icon: Home,
  },
  {
    label: "Your studies",
    href: "/studies",
    icon: FolderOpen,
  },
];

export function SidePanel() {
  const pathname = usePathname();

  return (
    <aside className="fixed top-[56px] left-0 w-[220px] h-[calc(100vh-56px)] bg-canvas border-r border-border-subtle">
      <nav className="p-3">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = 
              item.href === "/dashboard" 
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href) && !pathname.startsWith("/studies/");
            
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-body transition-colors",
                    "focus:outline-none focus:ring-2 focus:ring-primary-border focus:ring-offset-1",
                    "hover:bg-surface-alt",
                    isActive
                      ? "bg-surface text-text-primary font-medium shadow-sm border border-border-subtle"
                      : "text-text-secondary bg-transparent border border-transparent"
                  )}
                >
                  <item.icon className={cn(
                    "w-5 h-5",
                    isActive ? "text-primary-600" : "text-icon-default"
                  )} />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

