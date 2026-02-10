"use client";

import { Users, CheckCircle2, ThumbsUp, Clock } from "lucide-react";
import { StatCard } from "./stat-card";
import type { ResponseStats } from "@/lib/types/responses";
import { formatDuration } from "@/lib/utils/format";

interface ResponsesOverviewProps {
  stats: ResponseStats;
}

export function ResponsesOverview({ stats }: ResponsesOverviewProps) {
  const completionRate =
    stats.totalSessions > 0
      ? Math.round((stats.completedSessions / stats.totalSessions) * 100)
      : 0;

  const reviewedCount =
    stats.totalSessions > 0
      ? `of ${stats.completedSessions} reviewed`
      : "no responses yet";

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        icon={Users}
        iconBgClass="bg-primary-50"
        iconColorClass="text-primary-600"
        label="Total Responses"
        value={stats.totalSessions}
        subtext={`${completionRate}% completion rate`}
      />
      <StatCard
        icon={CheckCircle2}
        iconBgClass="bg-success-50"
        iconColorClass="text-success-600"
        label="Completed"
        value={stats.completedSessions}
        subtext={`of ${stats.totalSessions} responses`}
      />
      <StatCard
        icon={ThumbsUp}
        iconBgClass="bg-warning-50"
        iconColorClass="text-warning-600"
        label="Accepted"
        value={stats.acceptedSessions}
        subtext={reviewedCount}
      />
      <StatCard
        icon={Clock}
        iconBgClass="bg-surface-alt"
        iconColorClass="text-text-secondary"
        label="Avg Duration"
        value={formatDuration(stats.avgDurationSeconds)}
        subtext="mean interview length"
      />
    </div>
  );
}
