/**
 * Page Manager
 *
 * Owns page CRUD and keeps three data sources in sync on every mutation:
 *   1. ctx.pages     — Map<id, PageData>      (live page records)
 *   2. composer.router — URL path ↔ pageId    (consumed by export, runtime routing)
 *   3. emit PROJECT_CHANGED with a typed payload (history, sync, UI listeners)
 *
 * Phase 1 additions:
 * - Real duplicatePage (deep clone with fresh IDs, smart copy-suffix naming).
 * - PageRouter wired on create/update-slug/delete (previously instantiated but
 *   never populated, so `PageItem.route` was always undefined).
 * - slugHistory: append-only log of prior slugs for 90-day redirect export.
 * - slugManuallySet: tracks whether the current slug was user-entered or
 *   auto-derived, so rename doesn't clobber custom slugs.
 * - updatedAt: refreshed on every mutation for UI + dashboard sync.
 * - reorderPage: re-index `pages` Map by a desired order (splice + rebuild).
 *
 * @module engine/elements/manager/PageManager
 * @license BSD-3-Clause
 */

import { EVENTS } from "../../../shared/constants";
import type { PageData, SlugChange } from "../../../shared/types";
import { generateId, slugify } from "../../../shared/utils/helpers";
import type { ElementManagerContext } from "./types";

/** Max slug-history entries kept per page. Oldest evicts. */
const SLUG_HISTORY_CAP = 100;

/**
 * Manages page operations within the element manager.
 *
 *   ┌───────────────────────────┐
 *   │ createPage / duplicatePage│──► router.register(slug, id)
 *   │                           │──► pages.set(id, page)
 *   │                           │──► emit PROJECT_CHANGED
 *   ├───────────────────────────┤
 *   │ updatePage (slug change)  │──► slugHistory.push(oldSlug)
 *   │                           │──► router.unregister(old) + register(new)
 *   │                           │──► updatedAt = now
 *   ├───────────────────────────┤
 *   │ deletePage                │──► router.unregister(slug)
 *   │                           │──► cleanup element tree
 *   │                           │──► pages.delete(id)
 *   └───────────────────────────┘
 */
export class PageManager {
  private ctx: ElementManagerContext;

  constructor(context: ElementManagerContext) {
    this.ctx = context;
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────

  /**
   * Create a new page. Fresh slug is auto-derived from name; caller can override
   * via `options.slug`, which flips `slugManuallySet` to true.
   */
  createPage(name: string, options?: Partial<PageData>): PageData {
    const now = new Date().toISOString();
    const autoSlug = slugify(name);
    const slugProvided = typeof options?.slug === "string" && options.slug.length > 0;

    const page: PageData = {
      id: generateId("page"),
      name,
      slug: slugProvided ? options!.slug : autoSlug,
      root: {
        id: generateId("root"),
        type: "container",
        tagName: "div",
        classes: ["buildrick-page-root"],
        children: [],
      },
      updatedAt: now,
      slugManuallySet: slugProvided,
      slugHistory: [],
      ...options,
    };

    this.ctx.pages.set(page.id, page);
    this.ctx.buildElementTree(page.root);
    this.registerRoute(page);

    if (!this.ctx.getActivePageId()) {
      this.ctx.setActivePageId(page.id);
    }

    this.ctx.composer.emit(EVENTS.PROJECT_CHANGED, { type: "page:created", page });
    return page;
  }

  /** Get page by ID */
  getPage(id: string): PageData | undefined {
    return this.ctx.pages.get(id);
  }

  /** Get all pages in current insertion order (which is `pagesOrder` at runtime). */
  getAllPages(): PageData[] {
    return Array.from(this.ctx.pages.values());
  }

  /** Get active page */
  getActivePage(): PageData | undefined {
    const activePageId = this.ctx.getActivePageId();
    return activePageId ? this.ctx.pages.get(activePageId) : undefined;
  }

  /**
   * Update page metadata. Slug changes are tracked in slugHistory and trigger
   * router re-registration. `updatedAt` is refreshed on every call that
   * actually mutates.
   */
  updatePage(
    id: string,
    data: Partial<Pick<PageData, "name" | "slug" | "settings" | "slugManuallySet" | "meta">>
  ): void {
    const page = this.ctx.pages.get(id);
    if (!page) return;

    let mutated = false;

    if (typeof data.name === "string" && data.name.trim() && data.name !== page.name) {
      page.name = data.name.trim();
      mutated = true;
    }

    if (typeof data.slug === "string" && data.slug.trim() && data.slug !== page.slug) {
      const oldSlug = page.slug;
      const newSlug = data.slug.trim();
      // Record the prior slug for redirect generation.
      if (oldSlug) {
        const history: SlugChange[] = page.slugHistory ?? [];
        history.push({ slug: oldSlug, changedAt: new Date().toISOString() });
        // Cap length; drop oldest first.
        if (history.length > SLUG_HISTORY_CAP) {
          history.splice(0, history.length - SLUG_HISTORY_CAP);
        }
        page.slugHistory = history;
      }
      page.slug = newSlug;
      // Any explicit slug update from the caller is treated as user-entered.
      if (data.slugManuallySet === undefined) page.slugManuallySet = true;
      this.reregisterRoute(oldSlug, page);
      mutated = true;
    }

    if (typeof data.slugManuallySet === "boolean" && data.slugManuallySet !== page.slugManuallySet) {
      page.slugManuallySet = data.slugManuallySet;
      mutated = true;
    }

    if (data.settings !== undefined) {
      page.settings = { ...page.settings, ...data.settings };
      mutated = true;
    }

    if (data.meta !== undefined) {
      // Phase -1: meta is forward-compat JSON. Merge top-level keys so
      // appliedTemplates updates don't clobber other meta keys (and vice versa).
      page.meta = { ...page.meta, ...data.meta };
      mutated = true;
    }

    if (mutated) {
      page.updatedAt = new Date().toISOString();
      this.ctx.pages.set(id, page);
      this.ctx.composer.emit(EVENTS.PROJECT_CHANGED, { type: "page:updated", page });
    }
  }

  /**
   * Phase -1: record a template apply on the active page's meta.appliedTemplates
   * stack. Called by TemplatesTab apply path. Persists via Page.meta JSONB.
   *
   * Latest apply lands at the END of the array. Bounded at 25 entries (cheapest
   * cap; templates apply rarely enough that 25 is decades of edits).
   */
  recordAppliedTemplate(pageId: string, entry: { templateId: string; version?: string; appliedAt?: string }): void {
    const page = this.ctx.pages.get(pageId);
    if (!page) return;
    const stack = (page.meta?.appliedTemplates ?? []).slice();
    stack.push({
      templateId: entry.templateId,
      version: entry.version,
      appliedAt: entry.appliedAt ?? new Date().toISOString(),
    });
    if (stack.length > 25) stack.splice(0, stack.length - 25);
    this.updatePage(pageId, { meta: { appliedTemplates: stack } });
    this.ctx.composer.emit(EVENTS.TEMPLATE_APPLIED, {
      templateId: entry.templateId,
      pageId,
      version: entry.version,
    });
  }

  /**
   * Phase S9: remove the most recent application of templateId from this
   * page's meta stack and emit TEMPLATE_REMOVED. Used by detach / replace-
   * across flows. No-op if the template was not applied.
   */
  removeAppliedTemplate(pageId: string, templateId: string): void {
    const page = this.ctx.pages.get(pageId);
    if (!page) return;
    const stack = (page.meta?.appliedTemplates ?? []).slice();
    let found = false;
    for (let i = stack.length - 1; i >= 0; i--) {
      if (stack[i].templateId === templateId) {
        stack.splice(i, 1);
        found = true;
        break;
      }
    }
    if (!found) return;
    this.updatePage(pageId, { meta: { appliedTemplates: stack } });
    this.ctx.composer.emit(EVENTS.TEMPLATE_REMOVED, { templateId, pageId });
  }

  /** Set active page */
  setActivePage(id: string): void {
    if (this.ctx.pages.has(id)) {
      this.ctx.setActivePageId(id);
      this.ctx.composer.emit(EVENTS.PROJECT_CHANGED, {
        type: "page:activated",
        page: this.ctx.pages.get(id),
      });
    }
  }

  /** Mark a page as home (single home) */
  setHomePage(id: string): void {
    if (!this.ctx.pages.has(id)) return;

    this.ctx.pages.forEach((page, pageId) => {
      page.isHome = pageId === id;
      this.ctx.pages.set(pageId, page);
    });

    const page = this.ctx.pages.get(id);
    if (page) {
      this.ctx.composer.emit(EVENTS.PROJECT_CHANGED, { type: "page:home", page });
    }
  }

  /** Delete a page. Returns false if the page didn't exist. */
  deletePage(id: string): boolean {
    const page = this.ctx.pages.get(id);
    if (!page) return false;

    // Unregister route BEFORE element cleanup so resolve() returns null immediately.
    this.unregisterRoute(page);

    // Clean up every element owned by this page to prevent memory leaks.
    const rootElement = this.ctx.elements.get(page.root.id);
    if (rootElement) {
      const descendants = this.ctx.getAllDescendants(rootElement);
      descendants.forEach((el) => this.ctx.elements.delete(el.getId()));
      this.ctx.elements.delete(rootElement.getId());
    }

    this.ctx.pages.delete(id);

    if (this.ctx.getActivePageId() === id) {
      const remaining = Array.from(this.ctx.pages.keys());
      this.ctx.setActivePageId(remaining.length > 0 ? remaining[0] : null);
    }

    this.ctx.composer.emit(EVENTS.PROJECT_CHANGED, { type: "page:deleted", page });
    return true;
  }

  /**
   * Duplicate a page — real deep clone (fixes CRITICAL gap C1 from prior audit).
   *
   * Previously `usePages.duplicatePage` called `createPage` with only a slug,
   * which produced an empty page with a "Copy" name — a feature-theater bug.
   * This implementation:
   * - Deep-clones the element tree (fresh IDs) using ctx.cloneElementData.
   * - Deep-copies settings + seo to avoid shared reference bugs.
   * - Picks a non-colliding slug via `${slug}-copy`, `${slug}-copy-2`, ...
   * - Picks a non-colliding name via `${name} Copy`, `${name} Copy 2`, ...
   * - Resets slugManuallySet to false (auto-derived from copy name).
   * - Always isHome=false (only the source keeps Home status).
   */
  duplicatePage(sourceId: string): PageData | null {
    const source = this.ctx.pages.get(sourceId);
    if (!source) return null;

    const clonedRoot = this.ctx.cloneElementData(source.root);
    const name = uniqueCopyName(source.name, this.existingNames());
    const slug = uniqueCopySlug(source.slug ?? slugify(source.name), this.existingSlugs());
    const now = new Date().toISOString();

    const page: PageData = {
      id: generateId("page"),
      name,
      slug,
      isHome: false,
      root: clonedRoot,
      settings: deepCopySettings(source.settings),
      styles: source.styles ? [...source.styles] : undefined,
      updatedAt: now,
      slugManuallySet: false,
      slugHistory: [],
    };

    this.ctx.pages.set(page.id, page);
    this.ctx.buildElementTree(page.root);
    this.registerRoute(page);

    this.ctx.composer.emit(EVENTS.PROJECT_CHANGED, { type: "page:created", page });
    return page;
  }

  /**
   * Reorder pages. `afterId === null` prepends.
   * Rebuilds the Map preserving every page, inserting `pageId` at the new position.
   */
  reorderPage(pageId: string, afterId: string | null): boolean {
    if (!this.ctx.pages.has(pageId)) return false;
    if (afterId !== null && !this.ctx.pages.has(afterId)) return false;

    const ids = Array.from(this.ctx.pages.keys()).filter((id) => id !== pageId);
    const insertIndex = afterId === null ? 0 : ids.indexOf(afterId) + 1;
    ids.splice(insertIndex, 0, pageId);

    // Rebuild the Map in the new order. Map insertion order is stable.
    const snapshot = new Map(this.ctx.pages);
    this.ctx.pages.clear();
    for (const id of ids) {
      const page = snapshot.get(id);
      if (page) this.ctx.pages.set(id, page);
    }

    const page = this.ctx.pages.get(pageId);
    this.ctx.composer.emit(EVENTS.PROJECT_CHANGED, { type: "page:reordered", page });
    return true;
  }

  /**
   * Import a page record. Normalizes new Phase 1 fields so legacy exports load
   * cleanly: missing `updatedAt`, `slugManuallySet`, `slugHistory` get defaults.
   */
  importPage(pageData: PageData): void {
    const normalized: PageData = {
      ...pageData,
      updatedAt: pageData.updatedAt ?? new Date().toISOString(),
      slugManuallySet: pageData.slugManuallySet ?? false,
      slugHistory: pageData.slugHistory ?? [],
    };
    this.ctx.pages.set(normalized.id, normalized);
    this.ctx.buildElementTree(normalized.root);
    this.registerRoute(normalized);

    if (!this.ctx.getActivePageId()) {
      this.ctx.setActivePageId(normalized.id);
    }
  }

  /**
   * Export all pages. The live Element instances are the single source of
   * truth for element data, so we reconstruct root from the current hierarchy
   * and merge in the persisted page metadata (slugHistory, updatedAt, flags).
   */
  exportPages(): PageData[] {
    const pages: PageData[] = [];

    this.ctx.pages.forEach((page) => {
      const rootElement = this.ctx.elements.get(page.root.id);
      const rootData = rootElement ? rootElement.toJSON() : page.root;
      pages.push({ ...page, root: rootData });
    });

    return pages;
  }

  /** Clear all pages and elements. Also clears the router. */
  clear(): void {
    this.ctx.pages.clear();
    this.ctx.elements.clear();
    this.ctx.setActivePageId(null);
    const router = this.getRouter();
    router?.clear?.();
  }

  // ── Router wiring ─────────────────────────────────────────────────────────

  private registerRoute(page: PageData): void {
    const router = this.getRouter();
    if (!router) return;
    const path = page.slug ? `/${page.slug}` : `/${page.id}`;
    router.register(path, page.id);
  }

  private unregisterRoute(page: PageData): void {
    const router = this.getRouter();
    if (!router) return;
    const path = page.slug ? `/${page.slug}` : `/${page.id}`;
    router.unregister(path);
  }

  private reregisterRoute(oldSlug: string | undefined, page: PageData): void {
    const router = this.getRouter();
    if (!router) return;
    if (oldSlug) router.unregister(`/${oldSlug}`);
    this.registerRoute(page);
  }

  private getRouter(): {
    register: (path: string, pageId: string) => void;
    unregister: (path: string) => void;
    clear?: () => void;
  } | null {
    // Composer.router is public; guarded because some test contexts may not wire it.
    const router = (this.ctx.composer as unknown as { router?: unknown }).router;
    if (!router || typeof (router as { register?: unknown }).register !== "function") return null;
    return router as {
      register: (path: string, pageId: string) => void;
      unregister: (path: string) => void;
      clear?: () => void;
    };
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private existingNames(): Set<string> {
    return new Set(Array.from(this.ctx.pages.values()).map((p) => p.name));
  }

  private existingSlugs(): Set<string> {
    const set = new Set<string>();
    this.ctx.pages.forEach((p) => {
      if (p.slug) set.add(p.slug);
    });
    return set;
  }
}

// ── Module-local utilities (pure, testable) ─────────────────────────────────

/** "About" → "About Copy" → "About Copy 2" → "About Copy 3" ... */
function uniqueCopyName(baseName: string, taken: Set<string>): string {
  const first = `${baseName} Copy`;
  if (!taken.has(first)) return first;
  let n = 2;
  while (taken.has(`${baseName} Copy ${n}`)) n++;
  return `${baseName} Copy ${n}`;
}

/** "about" → "about-copy" → "about-copy-2" → ... */
function uniqueCopySlug(baseSlug: string, taken: Set<string>): string {
  const first = `${baseSlug}-copy`;
  if (!taken.has(first)) return first;
  let n = 2;
  while (taken.has(`${baseSlug}-copy-${n}`)) n++;
  return `${baseSlug}-copy-${n}`;
}

/**
 * Deep-copy PageSettings to sever shared references between source and duplicate.
 * JSON round-trip is safe here — settings only contain strings, booleans,
 * numbers, and nested plain objects (no Dates, Maps, or functions).
 */
function deepCopySettings(settings: PageData["settings"]): PageData["settings"] {
  if (!settings) return undefined;
  return JSON.parse(JSON.stringify(settings));
}
