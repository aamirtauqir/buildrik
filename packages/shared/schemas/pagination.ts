import { z } from "zod";

/**
 * Cursor pagination — the SSOT for every "load more" feed. `cursor` is an opaque
 * row id (the last item of the previous page); `limit` is capped so no query can
 * scan an unbounded table newest-first (G7 perf guard). The field is named
 * `cursor` so tRPC's `useInfiniteQuery` picks it up without extra config.
 */
export const paginationInput = z.object({
  limit: z.number().int().min(1).max(100).optional(),
  cursor: z.string().optional(),
});
export type PaginationInput = z.infer<typeof paginationInput>;

/** A bounded page of `T` plus the cursor to fetch the next one (null = last page). */
export interface Paginated<T> {
  items: T[];
  nextCursor: string | null;
}
