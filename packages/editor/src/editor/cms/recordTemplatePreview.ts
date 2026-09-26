/**
 * renderRecordTemplatePreview — "Preview saved record" (7116:76427, L4 CSV/
 * preview item). Renders a collection's template page with ONE saved
 * record's data for a read-only look at what publish will produce.
 *
 * Mechanism: reuses `exportPublishPages` — the SAME export the Topbar
 * publish button and the AI publish gate call (exportPublishPages.ts) — so
 * the template page comes back exactly as publish would emit it, including
 * the literal `{fieldSlug}` tokens `CMSExportResolver.resolveStatic` writes
 * for this collection's on-page-record bindings. Filling those tokens in
 * with one record's values mirrors the publish-time per-record substitution
 * the server runs in `generateDynamicPages` (`cms.service.ts`) — that
 * function is server-only (Prisma, Node), so this is the client-side
 * equivalent for an interactive, unpublished preview rather than a shared
 * import.
 *
 * @license BSD-3-Clause
 */
import type { Composer } from "@/engine";
import type { CMSCollection, CMSContentItem } from "@/shared/types/cms";
import { exportPublishPages } from "@/editor/shell/exportPublishPages";
import { sanitizeHTML } from "@/shared/utils/html/sanitization";
import { escapeHtmlText } from "@buildrik/shared/schemas/element-markup";

export type RecordTemplatePreview =
  | { ok: true; html: string }
  | { ok: false; reason: "no-template" | "template-missing" | "render-failed" };

export async function renderRecordTemplatePreview(
  composer: Composer,
  collection: CMSCollection,
  record: CMSContentItem,
): Promise<RecordTemplatePreview> {
  if (!collection.pageTemplatePath) return { ok: false, reason: "no-template" };
  let pages: Awaited<ReturnType<typeof exportPublishPages>>;
  try {
    pages = await exportPublishPages(composer);
  } catch {
    return { ok: false, reason: "render-failed" };
  }
  const page = pages.find((p) => p.path === collection.pageTemplatePath);
  if (!page) return { ok: false, reason: "template-missing" };
  /* The export's own head — the inlined page stylesheet (exportPublishPages)
     and SEO tags — came from the exporter, not from the record, and is kept
     as it is: sanitizing the whole page in fragment mode returned the body
     alone, so the preview rendered without any CSS. Only the body, where the
     record's values land, is substituted and sanitized (`{field}` tokens in
     the head, e.g. a bound <title>, are not visible in the preview). This is
     the client-side twin of the server's substitution + sanitizeGeneratedPageHtml
     (cms.service.ts — server-only, jsdom); the preview iframe stays
     `sandbox=""` (RecordTemplatePreviewDialog.tsx). */
  const bodyOpen = /<body\b[^>]*>/i.exec(page.html);
  const bodyStart = bodyOpen ? bodyOpen.index + bodyOpen[0].length : 0;
  const bodyEnd = bodyOpen ? page.html.lastIndexOf("</body>") : -1;
  const end = bodyEnd >= bodyStart ? bodyEnd : page.html.length;
  const body = page.html.slice(bodyStart, end).replace(/\{([a-zA-Z0-9_-]+)\}/g, (_m, key: string) => {
    const v = record.data[key];
    return v === undefined || v === null ? "" : escapeHtmlText(String(v));
  });
  return { ok: true, html: page.html.slice(0, bodyStart) + sanitizeHTML(body) + page.html.slice(end) };
}
