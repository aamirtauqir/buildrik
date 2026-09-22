/**
 * Activity router — B6 (code-gap plan).
 *
 * The editor's Activity tab calls `activity.recent`. The full implementation
 * lives behind a dashboard-side reader that does not exist yet — plan §P5
 * ("packages/editor alone is enough | ACCEPT with a named gap") logged this
 * as a needs-dashboard followup. Until that ships, this stub returns an
 * empty list: editor renders its empty state ("Nothing here yet"), no fake
 * rows surface to a real user, and the dashboard procedure can drop in
 * here without touching the editor.
 *
 * The stub lives on the server (not the editor mock) so that
 *   1. `AppRouter.activity.recent` resolves at editor tsc time —
 *      no `as any`, no editor-side `// @ts-expect-error`, and the editor's
 *      call site is the real tRPC client, not a fake
 *   2. the dashboard procedure's signature can be tightened in lockstep
 *      with this stub when it lands (same input/output Zod schemas)
 *
 * @license BSD-3-Clause
 */
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

const activityFilterSchema = z.enum(["all", "edits", "comments", "publish"]);

export const activityRouter = router({
  recent: protectedProcedure
    .input(z.object({ siteId: z.string(), filter: activityFilterSchema }))
    .query(async () => {
      // Dashboard reader is a needs-dashboard gap (code-gap plan §P5).
      // When it lands, replace this body — input/output shapes already match.
      return [];
    }),
});
