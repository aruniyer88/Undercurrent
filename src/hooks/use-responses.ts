"use client";

import { useState, useEffect, useCallback } from "react";
import type { ResponseListItem, ResponseStats, ResponseFilters } from "@/lib/types/responses";

interface UseResponsesReturn {
  sessions: ResponseListItem[];
  stats: ResponseStats;
  totalCount: number;
  filters: ResponseFilters;
  setFilters: (filters: Partial<ResponseFilters>) => void;
  isLoading: boolean;
  error: string | null;
  mutate: () => void;
}

const DEFAULT_FILTERS: ResponseFilters = {
  completion: "all",
  review: "all",
  page: 1,
  limit: 50,
};

const DEFAULT_STATS: ResponseStats = {
  totalSessions: 0,
  completedSessions: 0,
  acceptedSessions: 0,
  avgDurationSeconds: null,
};

export function useResponses(studyId: string | null): UseResponsesReturn {
  const [sessions, setSessions] = useState<ResponseListItem[]>([]);
  const [stats, setStats] = useState<ResponseStats>(DEFAULT_STATS);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFiltersState] = useState<ResponseFilters>(DEFAULT_FILTERS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const setFilters = useCallback((partial: Partial<ResponseFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...partial }));
  }, []);

  const mutate = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (!studyId) return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (filters.completion !== "all") params.set("completion", filters.completion);
    if (filters.review !== "all") params.set("review", filters.review);
    params.set("page", String(filters.page));
    params.set("limit", String(filters.limit));

    fetch(`/api/studies/${studyId}/responses?${params}`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to fetch responses");
        }
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        setSessions(data.sessions);
        setStats(data.stats);
        setTotalCount(data.totalCount);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [studyId, filters, refreshKey]);

  return { sessions, stats, totalCount, filters, setFilters, isLoading, error, mutate };
}
