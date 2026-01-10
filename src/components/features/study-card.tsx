"use client";

import Link from "next/link";
import { Study } from "@/lib/types/database";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Copy, Archive, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface StudyCardProps {
  study: Study;
  statusConfig: {
    label: string;
    icon: React.ElementType;
    className: string;
  };
}

export function StudyCard({ study, statusConfig }: StudyCardProps) {
  const StatusIcon = statusConfig.icon;
  
  // Format date
  const createdDate = new Date(study.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: study.created_at.includes(new Date().getFullYear().toString()) ? undefined : "numeric",
  });

  // Determine the appropriate link based on status
  const getStudyLink = () => {
    switch (study.status) {
      case "draft":
        return `/studies/${study.id}/setup`;
      case "ready_for_test":
        return `/studies/${study.id}/test`;
      case "tested":
        return `/studies/${study.id}/publish`;
      case "live":
      case "closed":
        return `/studies/${study.id}/report`;
      default:
        return `/studies/${study.id}/setup`;
    }
  };

  return (
    <div className="group relative rounded-lg border border-border-subtle bg-surface hover:border-border-strong hover:shadow-sm transition-all duration-200">
      <Link href={getStudyLink()} className="block p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-body-strong text-text-primary truncate group-hover:text-primary-600 transition-colors">
              {study.title}
            </h3>
            <p className="text-caption text-text-muted mt-1">
              Created {createdDate}
            </p>
          </div>
          <Badge className={cn("flex-shrink-0", statusConfig.className)}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {statusConfig.label}
          </Badge>
        </div>
        
        {study.objective && (
          <p className="text-body text-text-secondary mt-3 line-clamp-2">
            {study.objective}
          </p>
        )}
      </Link>

      {/* Action Menu */}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link href={getStudyLink()}>
                <ExternalLink className="w-4 h-4 mr-2" />
                Open
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Copy className="w-4 h-4 mr-2" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-danger-600 focus:text-danger-600 focus:bg-danger-50">
              <Archive className="w-4 h-4 mr-2" />
              Archive
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
