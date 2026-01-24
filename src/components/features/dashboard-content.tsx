"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Clock,
  HelpCircle,
  Users,
  MoreHorizontal,
  Pencil,
  Copy,
  Trash2,
  FolderOpen,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Type for project status
type ProjectStatus = "draft" | "ready" | "live" | "closed";

interface Project {
  id: string;
  title: string;
  status: ProjectStatus;
  createdAt: Date;
  questionCount: number;
  responseCount: number;
  completeCount: number;
}

// Mock data for demonstration - replace with real data fetching
const mockProjects: Project[] = [];

// Helper function to format relative time
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)}w ago`;
  return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
}

// Status badge component
function StatusBadge({ status }: { status: ProjectStatus }) {
  const statusConfig = {
    draft: { label: "Draft", className: "badge-draft" },
    ready: { label: "Ready", className: "badge-ready" },
    live: { label: "Live", className: "badge-live" },
    closed: { label: "Closed", className: "badge-closed" },
  };

  const config = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-caption font-medium",
        config.className
      )}
    >
      {config.label}
    </span>
  );
}

// Project row component
function ProjectRow({ project }: { project: Project }) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/studies/${project.id}`)}
      className="group flex items-center gap-6 px-4 py-4 border-b border-border-subtle hover:bg-table-hover cursor-pointer transition-colors"
    >
      {/* Project Title */}
      <div className="flex-1 min-w-0">
        <h3 className="text-body-strong text-text-primary truncate group-hover:text-primary-600 transition-colors">
          {project.title}
        </h3>
      </div>

      {/* Status */}
      <div className="w-20 flex-shrink-0">
        <StatusBadge status={project.status} />
      </div>

      {/* Created At */}
      <div className="w-28 flex-shrink-0 flex items-center gap-1.5 text-text-muted">
        <Clock className="w-4 h-4" />
        <span className="text-caption">Created {formatRelativeTime(project.createdAt)}</span>
      </div>

      {/* Questions */}
      <div className="w-28 flex-shrink-0 flex items-center gap-1.5 text-text-muted">
        <HelpCircle className="w-4 h-4" />
        <span className="text-caption">{project.questionCount} questions</span>
      </div>

      {/* Responses */}
      <div className="w-40 flex-shrink-0 flex items-center gap-1.5 text-text-muted">
        <Users className="w-4 h-4" />
        <span className="text-caption">
          {project.responseCount} responses ({project.completeCount} complete)
        </span>
      </div>

      {/* Actions Menu */}
      <div className="w-10 flex-shrink-0 flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 rounded-md text-icon-default opacity-0 group-hover:opacity-100 hover:bg-surface-alt hover:text-icon-strong transition-all focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary-border"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit project
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => e.stopPropagation()}
              className="text-danger-600 focus:text-danger-600 focus:bg-danger-50"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete project
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// Empty state component
function EmptyState() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center py-24 px-6">
      <div className="w-16 h-16 rounded-full bg-surface-alt flex items-center justify-center mb-6">
        <FolderOpen className="w-8 h-8 text-text-muted" />
      </div>
      <h3 className="text-h2 text-text-primary mb-2">You have no active projects.</h3>
      <p className="text-body text-text-secondary text-center max-w-md mb-1">
        It&apos;s quieter than a focus group with free snacks in here.
      </p>
      <p className="text-body text-text-muted text-center max-w-md mb-8">
        Create your first project and start gathering insights that actually matter.
      </p>
      <Button
        onClick={() => router.push("/studies/new")}
        className="gap-2"
      >
        <Sparkles className="w-4 h-4" />
        Create your first project
      </Button>
    </div>
  );
}

export function DashboardContent() {
  const router = useRouter();
  const [projects] = useState<Project[]>(mockProjects);

  return (
    <div className="min-h-screen bg-canvas">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-canvas border-b border-border-subtle">
        <div className="max-w-[1400px] mx-auto px-8 py-5 flex items-center justify-between">
          <h1 className="text-h1 text-text-primary">Projects</h1>
          <Button
            onClick={() => router.push("/studies/new")}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            New project
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1400px] mx-auto">
        {projects.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="divide-y divide-border-subtle">
            {/* Column Headers */}
            <div className="flex items-center gap-6 px-4 py-3 bg-surface-alt text-caption text-text-muted uppercase tracking-wide">
              <div className="flex-1 min-w-0">Project</div>
              <div className="w-20 flex-shrink-0">Status</div>
              <div className="w-28 flex-shrink-0">Created</div>
              <div className="w-28 flex-shrink-0">Questions</div>
              <div className="w-40 flex-shrink-0">Responses</div>
              <div className="w-10 flex-shrink-0"></div>
            </div>

            {/* Project Rows */}
            {projects.map((project) => (
              <ProjectRow key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
