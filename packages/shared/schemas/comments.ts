import { z } from "zod";

/**
 * Client comment review (redesign E7). A viewer/client pins a change-request on
 * the preview (x/y are page-relative fractions 0..1 so the pin survives viewport
 * changes); the agency resolves it. SSOT for the create/list/resolve payloads.
 */
const fraction = z.number().min(0).max(1);

export const createCommentInput = z.object({
  siteId: z.string().min(1),
  pageId: z.string().nullable().optional(),
  body: z.string().min(1).max(2000),
  x: fraction.nullable().optional(),
  y: fraction.nullable().optional(),
  targetSelector: z.string().max(500).nullable().optional(),
});
export type CreateCommentInput = z.infer<typeof createCommentInput>;

export const listCommentsInput = z.object({
  siteId: z.string().min(1),
  status: z.enum(["OPEN", "RESOLVED"]).optional(),
});
export type ListCommentsInput = z.infer<typeof listCommentsInput>;

/** Re-anchor an orphaned pin to a new element (S5 orphan-comment recovery).
 *  targetSelector is the new anchor; x/y update alongside so the pin lands on
 *  the picked element rather than the dead one's last position. */
export const reattachCommentInput = z.object({
  id: z.string().min(1),
  siteId: z.string().min(1),
  targetSelector: z.string().min(1).max(500),
  pageId: z.string().nullable().optional(),
  x: fraction.nullable().optional(),
  y: fraction.nullable().optional(),
});
export type ReattachCommentInput = z.infer<typeof reattachCommentInput>;

export const resolveCommentInput = z.object({
  id: z.string().min(1),
  siteId: z.string().min(1),
  status: z.enum(["OPEN", "RESOLVED"]),
});
export type ResolveCommentInput = z.infer<typeof resolveCommentInput>;
