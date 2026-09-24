import { z } from "zod";

/**
 * Site-scoped activity (editor History › Activity, B6). Crosses the transport
 * boundary: the dashboard router validates the input, the editor reads the rows
 * through the typed tRPC client. The four filters match the editor's chip row.
 */
export const siteActivityFilterSchema = z.enum(["all", "edits", "comments", "publish"]);

export const siteActivityInput = z.object({
  siteId: z.string().min(1),
  filter: siteActivityFilterSchema.default("all"),
});

export type SiteActivityFilter = z.infer<typeof siteActivityFilterSchema>;
export type SiteActivityInput = z.infer<typeof siteActivityInput>;

export type SiteActivityKind = "edit" | "comment" | "publish";

export interface SiteActivityEntry {
  id: string;
  kind: SiteActivityKind;
  actorName: string | null;
  summary: string;
  /** A dashboard deep link for the row. No row kind carries one yet: always null. */
  actionUrl: string | null;
  createdAt: Date;
}
