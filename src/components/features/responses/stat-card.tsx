"use client";

import { type LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  iconBgClass: string;
  iconColorClass: string;
  label: string;
  value: string | number;
  subtext: string;
}

export function StatCard({
  icon: Icon,
  iconBgClass,
  iconColorClass,
  label,
  value,
  subtext,
}: StatCardProps) {
  return (
    <div className="bg-surface rounded-xl border border-border-subtle p-6">
      <div className="flex items-center gap-3 mb-2">
        <div
          className={`w-10 h-10 rounded-lg ${iconBgClass} flex items-center justify-center`}
        >
          <Icon className={`w-5 h-5 ${iconColorClass}`} />
        </div>
        <div>
          <p className="text-caption text-text-muted">{label}</p>
          <p className="text-h2 text-text-primary">{value}</p>
        </div>
      </div>
      <p className="text-caption text-text-muted">{subtext}</p>
    </div>
  );
}
