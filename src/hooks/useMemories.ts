import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { MemorySummary, MemoryType } from "@/lib/types";

export interface MemoryFilters {
  type?: MemoryType | "all";
  favorite?: boolean;
  q?: string;
  sort?: "newest" | "oldest" | "recently_updated" | "alphabetical";
}

export function useMemories(filters: MemoryFilters) {
  const [memories, setMemories] = useState<MemorySummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.type && filters.type !== "all") params.set("type", filters.type);
      if (filters.favorite) params.set("favorite", "true");
      if (filters.q) params.set("q", filters.q);
      if (filters.sort) params.set("sort", filters.sort);
      params.set("pageSize", "60");

      const res = await api.get<{ memories: MemorySummary[]; total: number }>(
        `/memories-list?${params.toString()}`
      );
      setMemories(res.memories);
      setTotal(res.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load memories.");
    } finally {
      setLoading(false);
    }
  }, [filters.type, filters.favorite, filters.q, filters.sort]);

  useEffect(() => {
    load();
  }, [load]);

  return { memories, total, loading, error, reload: load };
}
