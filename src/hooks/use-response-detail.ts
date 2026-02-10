"use client";

import { useState, useEffect, useCallback } from "react";
import type { ResponseDetailData } from "@/lib/types/responses";

interface UseResponseDetailReturn {
  data: ResponseDetailData | null;
  isLoading: boolean;
  error: string | null;
  mutate: () => void;
}

export function useResponseDetail(
  studyId: string | null,
  sessionId: string | null
): UseResponseDetailReturn {
  const [data, setData] = useState<ResponseDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const mutate = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (!studyId || !sessionId) {
      setData(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetch(`/api/studies/${studyId}/responses/${sessionId}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json();
          throw new Error(body.error || "Failed to fetch response detail");
        }
        return res.json();
      })
      .then((responseData) => {
        if (cancelled) return;
        setData(responseData);
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
  }, [studyId, sessionId, refreshKey]);

  return { data, isLoading, error, mutate };
}
