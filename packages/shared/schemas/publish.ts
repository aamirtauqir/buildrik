import { z } from "zod";

export const prePublishCheckSchema = z.object({
  siteId: z.string(),
});

/** Per-page HTML cap — 2 MB. Real-world rendered HTML for a page is
 *  rarely above 200 KB; 2 MB leaves headroom for embedded data URIs while
 *  still rejecting obvious abuse (gzip bombs, accidental dataURL spam).
 *  Server-side PublishBuildJob.log persists pages verbatim, so unbounded
 *  HTML would force huge JSON DB writes + worker memory use. */
export const MAX_PAGE_HTML_BYTES = 2 * 1024 * 1024;

/** Total payload cap across all pages — 16 MB. */
export const MAX_PUBLISH_PAYLOAD_BYTES = 16 * 1024 * 1024;

/** Max pages per publish — sanity check against runaway publishes. */
export const MAX_PUBLISH_PAGES = 500;

/** Payload sent by editor when publishing — one entry per page. */
export const publishPageSchema = z.object({
  /** Path inside deployment, e.g. "index.html", "about/index.html". */
  path: z.string().min(1).max(500),
  /** Rendered HTML for this page. Capped at MAX_PAGE_HTML_BYTES. */
  html: z
    .string()
    .min(1)
    .refine(
      (s) => new TextEncoder().encode(s).length <= MAX_PAGE_HTML_BYTES,
      { message: `Page HTML exceeds ${MAX_PAGE_HTML_BYTES} bytes` },
    ),
});

/** Editor → dashboard publish input. `pages` is optional so existing
 *  callers (without HTML render) still work — worker falls back to
 *  simulation when pages absent or Vercel unconfigured. */
export const publishInputSchema = z
  .object({
    siteId: z.string(),
    pages: z.array(publishPageSchema).max(MAX_PUBLISH_PAGES).optional(),
    /** The publisher saw that the approval is stale (the site changed since it
     *  was approved) and chose to publish anyway (contracts §1.5). Without it, a
     *  stale approval blocks the publish with APPROVAL_STALE. */
    acknowledgeStale: z.boolean().optional(),
  })
  .refine(
    (input) => {
      if (!input.pages) return true;
      const total = input.pages.reduce(
        (sum, p) => sum + new TextEncoder().encode(p.html).length,
        0,
      );
      return total <= MAX_PUBLISH_PAYLOAD_BYTES;
    },
    { message: `Total HTML payload exceeds ${MAX_PUBLISH_PAYLOAD_BYTES} bytes` },
  );

export type PublishPage = z.infer<typeof publishPageSchema>;
export type PublishInput = z.infer<typeof publishInputSchema>;

export const publishResultSchema = z.object({
  jobId: z.string(),
  status: z.string(),
  progress: z.number(),
  steps: z.array(z.object({ step: z.string(), status: z.string(), duration: z.number().optional() })),
  publicUrl: z.string().nullable(),
  error: z.string().nullable(),
  lighthouseScore: z.number().nullable(),
});

/**
 * The one check whose failure has a fix the user can act on in one click, so the
 * UI hangs a "Connect Vercel" link off it. Shared so the label can't drift apart
 * from the string the check is pushed with.
 */
export const VERCEL_CHECK_LABEL = "Vercel connected";

/**
 * The four states the approval gate can block a publish in, and the sentence
 * the user is shown for each. Same reason as VERCEL_CHECK_LABEL above: the
 * server throws these and the EDITOR reads them back to decide which recovery
 * UI to draw, so they cross the transport boundary and cannot live on one side.
 *
 * They lived only in `server/trpc/routers/sites.ts`, with the editor matching
 * them by regex in `usePublishJob.ts:classifyPublishBlock`. Nothing tied the
 * two together: editing a sentence in the router would have left every test
 * green while the editor silently fell through to "no reason" and drew the
 * generic failure instead of the acknowledge / send-for-review path.
 */
export const PUBLISH_APPROVAL_MESSAGES = {
  "no-review-sent":
    "This site has not been sent for review yet. Send it for review to publish.",
  "review-pending":
    "This site is waiting on its review. You can publish once it is approved.",
  "changes-requested":
    "The reviewer asked for changes. Resolve the open comments and re-send for review.",
  "stale-unacknowledged":
    "This site changed after it was approved. Re-send it for review, or acknowledge to publish the un-approved changes.",
} as const;

export type PublishApprovalBlockId = keyof typeof PUBLISH_APPROVAL_MESSAGES;

export const prePublishChecksResultSchema = z.object({
  ready: z.boolean(),
  checks: z.array(z.object({
    label: z.string(),
    status: z.enum(["pass", "warning", "fail"]),
    detail: z.string(),
  })),
});

export type PublishResult = z.infer<typeof publishResultSchema>;
export type PrePublishChecksResult = z.infer<typeof prePublishChecksResultSchema>;

/** P1 — publish history + rollback (contract §5). */
export const publishHistoryInput = z.object({ siteId: z.string().min(1) });
export type PublishHistoryInput = z.infer<typeof publishHistoryInput>;

export const rollbackInput = z.object({ siteId: z.string().min(1), jobId: z.string().min(1) });

/** Two COMPLETED publish jobs of one site to compare, page by page. */
export const publishDiffInput = z.object({
  siteId: z.string().min(1),
  fromJobId: z.string().min(1),
  toJobId: z.string().min(1),
});
export type PublishDiffInput = z.infer<typeof publishDiffInput>;
export type RollbackInput = z.infer<typeof rollbackInput>;
