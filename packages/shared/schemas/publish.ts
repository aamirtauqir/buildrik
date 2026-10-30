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

/** Top-level directories a deployment reserves: Vercel runs `api/` as
 *  functions and owns `_next/` and `_vercel/`. Dot-segments (`.well-known`,
 *  `.vercel`) are refused separately. */
const RESERVED_PUBLISH_DIRS = new Set(["api", "_next", "_vercel"]);

/**
 * Why a page path may not ship, or null. A page path becomes a file in the
 * workspace owner's Vercel deployment, so it must be a relative `.html` page:
 * never `vercel.json`, `robots.txt` or `sitemap.xml` (the server writes those
 * from ADMIN-owned settings), never a function under `api/`, never a path that
 * climbs out or hides. The exporter's `<slug>.html` / `index.html` names and the
 * CMS generator's `<record path>/index.html` all pass.
 */
export function publishPathError(path: string): string | null {
  if (!path.endsWith(".html")) return "Page paths must end in .html";
  if (/[\\\u0000-\u001f\u007f]/.test(path)) return "Page paths may not contain backslashes or control characters";
  if (path.startsWith("/")) return "Page paths must be relative";
  const segments = path.split("/");
  if (segments.some((seg) => seg === "" || seg.startsWith("."))) {
    return "Page paths may not contain empty, '.', '..' or hidden segments";
  }
  if (segments.length > 1 && RESERVED_PUBLISH_DIRS.has(segments[0].toLowerCase())) {
    return `Page paths may not live under ${segments[0]}/`;
  }
  return null;
}

/** Payload sent by editor when publishing — one entry per page. */
export const publishPageSchema = z.object({
  /** Path inside deployment, e.g. "index.html", "about/index.html". */
  path: z
    .string()
    .min(1)
    .max(500)
    .superRefine((path, ctx) => {
      const error = publishPathError(path);
      if (error) ctx.addIssue({ code: z.ZodIssueCode.custom, message: error });
    }),
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
    /** C-3: the `lastEditedAt` the publishing tab last loaded or saved. The
     *  tab publishes its IN-MEMORY pages, so a tab that fell behind another
     *  writer would ship the older copy over theirs; the server refuses with
     *  SAVE_CONFLICT when the site moved past this. Required whenever `pages`
     *  is sent (refined below): a tab with no token never loaded the site, and
     *  its pages are whatever the fallback put on screen. Callers that send no
     *  pages (cron, dashboard) carry nothing to be stale. */
    expectedLastEditedAt: z.string().datetime().nullish(),
  })
  .refine((input) => !input.pages || !!input.expectedLastEditedAt, {
    message: "Publishing pages requires expectedLastEditedAt — reload the editor before publishing.",
    path: ["expectedLastEditedAt"],
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

/** A-34 (2L9 B8-PB22): the site sits beyond its workspace plan's site limit —
 *  a hard fail whose detail is the CTA's reason. */
export const PLAN_LIMIT_CHECK_LABEL = "Plan limit";

/** A-36 (2L9 B8-PB16): a site that keeps a password on a plan without
 *  password protection — a hard fail with two ways out (upgrade, or remove
 *  the protection and publish). */
export const PASSWORD_CHECK_LABEL = "Password protection";

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

/**
 * What a publish NOW would change against the live version (2L9 B8-PB01–PB03,
 * PB21, A-33): the export the editor would send, compared page by page with
 * the live job's retained payload.
 */
export const publishPreviewDiffInput = z.object({
  siteId: z.string().min(1),
  pages: z.array(publishPageSchema).max(MAX_PUBLISH_PAGES),
});
export type PublishPreviewDiffInput = z.infer<typeof publishPreviewDiffInput>;

/** One COMPLETED publish job of a site whose pages Compare renders. */
export const publishedSnapshotInput = z.object({ siteId: z.string().min(1), jobId: z.string().min(1) });
export type PublishedSnapshotInput = z.infer<typeof publishedSnapshotInput>;
export type RollbackInput = z.infer<typeof rollbackInput>;

/**
 * The publish worker's steps, in order (workers/publish route). One list for
 * the job row the service creates and every write the worker makes.
 */
export const PUBLISH_STEPS = [
  "Generating pages",
  "Optimizing images",
  "Deploying to CDN",
  "Verifying SSL",
  "Performance check",
] as const;

/**
 * Steps the MVP never runs (image optimisation and the Lighthouse check come
 * later). They report "skipped" from the job's first write — never "done", a
 * green check for work that didn't happen, and never "pending", which made
 * the editor count them ("step 2 of 4" where three run; 2L9 B8-PB07, A-32).
 */
export const SKIPPED_PUBLISH_STEPS: ReadonlySet<number> = new Set([1, 4]);

export type PublishStepStatus = "pending" | "active" | "done" | "skipped" | "failed";

/** Every step's status with `activeIndex` running (-1: none started yet —
 *  the queued job; past the end: all finished). */
export function buildPublishSteps(activeIndex: number, failed = false): Array<{ name: string; status: PublishStepStatus }> {
  return PUBLISH_STEPS.map((name, i) => {
    if (SKIPPED_PUBLISH_STEPS.has(i)) return { name, status: "skipped" as const };
    if (i === activeIndex) return { name, status: failed ? ("failed" as const) : ("active" as const) };
    return { name, status: i > activeIndex ? ("pending" as const) : ("done" as const) };
  });
}
