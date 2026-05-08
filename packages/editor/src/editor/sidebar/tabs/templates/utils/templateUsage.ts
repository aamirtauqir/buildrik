/**
 * templateUsage — pure aggregator over composer.elements.getAllPages()
 *
 * Reads page.meta.appliedTemplates (Phase -1) and produces a map keyed by
 * templateId, valued by an array of (pageId, pageName, appliedAt, version).
 * First occurrence per (page, template) wins so the row count == page count.
 *
 * Pure function; no caching here. The hook layer
 * (useTemplateUsageMap) memoizes across event-driven rebuilds.
 *
 * Lives in editor/sidebar/tabs/templates/utils/ — NOT on TemplateManager —
 * because TemplateManager is soft-deprecated 2026-05-07. Aggregation is a
 * consumer concern; the engine just owns the per-page meta source-of-truth.
 *
 * @license BSD-3-Clause
 */
import type { Composer } from "../../../../../engine/Composer";

export interface TemplateUsageEntry {
  pageId: string;
  pageName: string;
  appliedAt: string;
  version?: string;
}

export type TemplateUsageMap = ReadonlyMap<string, ReadonlyArray<TemplateUsageEntry>>;

export function getTemplateUsageMap(composer: Composer | null): TemplateUsageMap {
  const map = new Map<string, TemplateUsageEntry[]>();
  if (!composer) return map;

  const pages = composer.elements.getAllPages?.() ?? [];
  for (const page of pages) {
    const stack = page.meta?.appliedTemplates ?? [];
    if (stack.length === 0) continue;

    const seenOnPage = new Set<string>();
    for (const entry of stack) {
      if (seenOnPage.has(entry.templateId)) continue;
      seenOnPage.add(entry.templateId);
      const list = map.get(entry.templateId) ?? [];
      list.push({
        pageId: page.id,
        pageName: page.name ?? "(untitled)",
        appliedAt: entry.appliedAt,
        version: entry.version,
      });
      map.set(entry.templateId, list);
    }
  }
  return map;
}
