import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Tag, TagCategory } from "@/types/tags";

export interface TagSearchParams {
  q?: string;
  category?: TagCategory;
  limit?: number;
}

function buildQueryString(params: Record<string, string | number | undefined>): string {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === "") continue;
    usp.set(k, String(v));
  }
  const qs = usp.toString();
  return qs === "" ? "" : `?${qs}`;
}

/** Substring search over tag names + aliases. Results ranked by usage_count. */
export function useTagSearch(params: TagSearchParams = {}) {
  const qs = buildQueryString({ ...params });
  return useQuery<Tag[]>({
    queryKey: ["tags", "search", params],
    queryFn: () => apiFetch<Tag[]>(`/api/tags${qs}`),
  });
}

/** Top-N most-used tags, optionally filtered by category. */
export function usePopularTags(params: { category?: TagCategory; limit?: number } = {}) {
  const qs = buildQueryString({ ...params });
  return useQuery<Tag[]>({
    queryKey: ["tags", "popular", params],
    queryFn: () => apiFetch<Tag[]>(`/api/tags/popular${qs}`),
  });
}
