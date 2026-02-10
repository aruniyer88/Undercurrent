"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ResponseFilters } from "@/lib/types/responses";

interface FilterBarProps {
  filters: ResponseFilters;
  onChange: (filters: Partial<ResponseFilters>) => void;
}

export function FilterBar({ filters, onChange }: FilterBarProps) {
  return (
    <div className="flex items-center gap-3">
      <Select
        value={filters.completion}
        onValueChange={(v) =>
          onChange({ completion: v as ResponseFilters["completion"], page: 1 })
        }
      >
        <SelectTrigger className="w-[150px] h-9 text-sm">
          <SelectValue placeholder="Completion" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="complete">Complete</SelectItem>
          <SelectItem value="in_progress">In progress</SelectItem>
          <SelectItem value="not_started">Not started</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.review}
        onValueChange={(v) =>
          onChange({ review: v as ResponseFilters["review"], page: 1 })
        }
      >
        <SelectTrigger className="w-[140px] h-9 text-sm">
          <SelectValue placeholder="Review" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All reviews</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="accepted">Accepted</SelectItem>
          <SelectItem value="rejected">Rejected</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
