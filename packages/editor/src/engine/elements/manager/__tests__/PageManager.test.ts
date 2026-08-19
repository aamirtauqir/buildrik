// @vitest-environment jsdom
/**
 * PageManager — Phase 1 behavior contracts.
 *
 * Covers the correctness fixes from the prior audit:
 *   A1  real duplicatePage (deep clone with fresh IDs, smart copy-suffix naming)
 *   A3  PageRouter wired on create/update/delete
 *   A6  slugHistory recorded on slug change
 *   merged: updatedAt populated, slugManuallySet rules
 *
 * Uses a minimal harness that simulates the ElementManagerContext so we
 * don't need to bootstrap the full Composer. This keeps the tests fast
 * and focused on PageManager's observable behavior.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { PageManager } from "../PageManager";
import type { ElementManagerContext } from "../types";
import type { ElementData, PageData } from "../../../../shared/types";
import { EVENTS } from "../../../../shared/constants/events";

// ── Harness ────────────────────────────────────────────────────────────────

function makeHarness() {
  const pages = new Map<string, PageData>();
  const elements = new Map<string, { getId: () => string; toJSON: () => ElementData }>();
  let activeId: string | null = null;

  const routes = new Map<string, string>();
  const reverseRoutes = new Map<string, string>();

  const composer = {
    emit: vi.fn(),
    router: {
      register: (path: string, pageId: string) => {
        routes.set(path, pageId);
        reverseRoutes.set(pageId, path);
      },
      unregister: (path: string) => {
        const id = routes.get(path);
        if (id) {
          routes.delete(path);
          reverseRoutes.delete(id);
        }
      },
      resolve: (path: string) => routes.get(path) ?? null,
      getPath: (id: string) => reverseRoutes.get(id) ?? null,
      clear: () => {
        routes.clear();
        reverseRoutes.clear();
      },
    },
  };

  const ctx: ElementManagerContext = {
    composer: composer as never,
    elements: elements as never,
    pages,
    getActivePageId: () => activeId,
    setActivePageId: (id) => {
      activeId = id;
    },
    buildElementTree: (data: ElementData) => {
      // Minimal: register a stub Element per ID so cleanup paths exercise.
      const el = {
        getId: () => data.id,
        toJSON: () => data,
        getDescendants: () => [],
      };
      elements.set(data.id, el as never);
      return el as never;
    },
    cloneElementData: (data) => {
      // Mirror the real implementation: fresh IDs recursively.
      let counter = 0;
      const freshId = (prefix: string) => `${prefix}-clone-${++counter}`;
      const clone = (d: ElementData): ElementData => ({
        ...d,
        id: freshId(d.type === "container" ? "root" : "el"),
        children: d.children?.map(clone),
      });
      return clone(data);
    },
    getAllDescendants: () => [],
  };

  return { pm: new PageManager(ctx), ctx, composer, routes };
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("PageManager.createPage", () => {
  it("registers route on PageRouter (fixes A3)", () => {
    const { pm, routes } = makeHarness();
    pm.createPage("About");
    expect(routes.get("/about")).toBeDefined();
    expect(routes.size).toBe(1);
  });

  it("auto-derives slug when not provided, marks slugManuallySet=false", () => {
    const { pm } = makeHarness();
    const page = pm.createPage("About Us");
    expect(page.slug).toBe("about-us");
    expect(page.slugManuallySet).toBe(false);
  });

  it("honors explicit slug and marks slugManuallySet=true", () => {
    const { pm } = makeHarness();
    const page = pm.createPage("About Us", { slug: "team" });
    expect(page.slug).toBe("team");
    expect(page.slugManuallySet).toBe(true);
  });

  it("populates updatedAt as ISO8601", () => {
    const { pm } = makeHarness();
    const page = pm.createPage("About");
    expect(page.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

describe("PageManager.updatePage", () => {
  it("records old slug in slugHistory on slug change (A6)", () => {
    const { pm, ctx } = makeHarness();
    pm.createPage("About"); // slug = "about"
    const about = Array.from(ctx.pages.values())[0];

    pm.updatePage(about.id, { slug: "team" });

    const updated = ctx.pages.get(about.id)!;
    expect(updated.slug).toBe("team");
    expect(updated.slugHistory).toHaveLength(1);
    expect(updated.slugHistory![0].slug).toBe("about");
    expect(updated.slugHistory![0].changedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("re-registers route on slug change (A3): old slug 404s, new slug resolves", () => {
    const { pm, ctx, composer } = makeHarness();
    pm.createPage("About");
    const about = Array.from(ctx.pages.values())[0];

    pm.updatePage(about.id, { slug: "team" });

    expect(composer.router.resolve("/about")).toBeNull();
    expect(composer.router.resolve("/team")).toBe(about.id);
  });

  it("bumps updatedAt on any mutation", async () => {
    const { pm, ctx } = makeHarness();
    pm.createPage("About");
    const about = Array.from(ctx.pages.values())[0];
    const before = about.updatedAt!;

    // Ensure the clock has ticked at least 1ms so ISO strings differ.
    await new Promise((r) => setTimeout(r, 5));
    pm.updatePage(about.id, { name: "About Us" });

    const after = ctx.pages.get(about.id)!.updatedAt!;
    expect(after > before).toBe(true);
  });

  it("sets slugManuallySet=true when user provides a new slug", () => {
    const { pm, ctx } = makeHarness();
    pm.createPage("About"); // slugManuallySet=false
    const about = Array.from(ctx.pages.values())[0];

    pm.updatePage(about.id, { slug: "team" });

    expect(ctx.pages.get(about.id)!.slugManuallySet).toBe(true);
  });

  it("caps slugHistory at 100 entries, evicting oldest", () => {
    const { pm, ctx } = makeHarness();
    const p = pm.createPage("Home");
    // Hammer 105 slug changes.
    for (let i = 0; i < 105; i++) {
      pm.updatePage(p.id, { slug: `slug-${i}` });
    }
    const history = ctx.pages.get(p.id)!.slugHistory!;
    expect(history.length).toBe(100);
    // Oldest entries should have been evicted; slug-0 should be gone.
    expect(history[0].slug).not.toBe("home");
    expect(history[history.length - 1].slug).toBe("slug-103");
  });
});

/* The feature theater came back, and this harness could not see it. The page
   map's `root` carries the root's IDENTITY; the working tree lives in the
   element registry — which is why `exportPages()` re-resolves through
   `ctx.elements.get(page.root.id).toJSON()`. `duplicatePage` cloned the
   snapshot, so duplicating a page that was not the open one produced an EMPTY
   copy. Reproduced in the app: a 2-block Pricing page duplicated to "Pricing
   Copy" with zero children.

   Every existing test here passes because the harness's `buildElementTree`
   registers a stub whose `toJSON()` returns the very object it was built from
   — snapshot and registry are the same object, so they cannot disagree. This
   one makes them disagree, the way the running editor does. */
describe("PageManager.duplicatePage — clones the registered tree, not the page-map snapshot", () => {
  it("copies the children the element registry holds when the snapshot is hollow", () => {
    const { pm, ctx } = makeHarness();
    const hollowRoot = { id: "r-pricing", type: "container", children: [] } as unknown as ElementData;
    ctx.pages.set("p-pricing", {
      id: "p-pricing",
      name: "Pricing",
      slug: "/pricing",
      isHome: false,
      root: hollowRoot,
    } as never);
    // The registry knows what is actually on that page.
    (ctx.elements as unknown as Map<string, unknown>).set("r-pricing", {
      getId: () => "r-pricing",
      getDescendants: () => [],
      toJSON: () => ({
        id: "r-pricing",
        type: "container",
        children: [
          { id: "h-1", type: "heading", content: "PRICING PAGE", children: [] },
          { id: "p-1", type: "paragraph", content: "from $9", children: [] },
        ],
      }),
    });

    const copy = pm.duplicatePage("p-pricing");
    expect(copy).not.toBeNull();
    expect(copy!.root.children).toHaveLength(2);
    expect(copy!.root.children!.map((c) => c.content)).toEqual(["PRICING PAGE", "from $9"]);
    // fresh ids, not the source's
    expect(copy!.root.id).not.toBe("r-pricing");
    expect(copy!.root.children!.map((c) => c.id)).not.toContain("h-1");
  });

  it("falls back to the snapshot when the registry has nothing for that root", () => {
    const { pm, ctx } = makeHarness();
    ctx.pages.set("p-orphan", {
      id: "p-orphan",
      name: "Orphan",
      slug: "/orphan",
      isHome: false,
      root: { id: "r-orphan", type: "container", children: [{ id: "x", type: "heading", content: "FROM SNAPSHOT", children: [] }] },
    } as never);
    const copy = pm.duplicatePage("p-orphan");
    expect(copy!.root.children).toHaveLength(1);
    expect(copy!.root.children![0].content).toBe("FROM SNAPSHOT");
  });
});

describe("PageManager.duplicatePage (A1 — fixes feature-theater bug)", () => {
  it("returns null if source page does not exist", () => {
    const { pm } = makeHarness();
    expect(pm.duplicatePage("nonexistent")).toBeNull();
  });

  it("clones with fresh IDs — source and copy have different root IDs", () => {
    const { pm } = makeHarness();
    const source = pm.createPage("About");
    const copy = pm.duplicatePage(source.id);

    expect(copy).not.toBeNull();
    expect(copy!.id).not.toBe(source.id);
    expect(copy!.root.id).not.toBe(source.root.id);
  });

  it("uses smart copy-suffix naming: 'About' → 'About Copy'", () => {
    const { pm } = makeHarness();
    const source = pm.createPage("About");
    const copy = pm.duplicatePage(source.id);
    expect(copy!.name).toBe("About Copy");
  });

  it("bumps copy-suffix when 'X Copy' exists: 'About Copy' → 'About Copy 2'", () => {
    const { pm } = makeHarness();
    const source = pm.createPage("About");
    pm.duplicatePage(source.id); // creates "About Copy"
    const second = pm.duplicatePage(source.id); // should be "About Copy 2"
    expect(second!.name).toBe("About Copy 2");
  });

  it("uses non-colliding slug: 'about' → 'about-copy' → 'about-copy-2'", () => {
    const { pm } = makeHarness();
    const source = pm.createPage("About");
    const copy1 = pm.duplicatePage(source.id);
    const copy2 = pm.duplicatePage(source.id);
    expect(copy1!.slug).toBe("about-copy");
    expect(copy2!.slug).toBe("about-copy-2");
  });

  it("registers the copy's route on the router (A3)", () => {
    const { pm, composer } = makeHarness();
    const source = pm.createPage("About");
    const copy = pm.duplicatePage(source.id);
    expect(composer.router.resolve("/about-copy")).toBe(copy!.id);
  });

  it("copy is NEVER the homepage, even if source was", () => {
    const { pm } = makeHarness();
    const source = pm.createPage("Home");
    pm.setHomePage(source.id);
    const copy = pm.duplicatePage(source.id);
    expect(copy!.isHome).toBe(false);
  });

  it("copy's slugManuallySet is false (auto-derived from copy name)", () => {
    const { pm } = makeHarness();
    const source = pm.createPage("About", { slug: "team" }); // custom slug on source
    const copy = pm.duplicatePage(source.id);
    expect(copy!.slugManuallySet).toBe(false);
  });

  it("deep-copies settings so mutating source.seo does NOT affect copy", () => {
    const { pm, ctx } = makeHarness();
    const source = pm.createPage("About");
    pm.updatePage(source.id, { settings: { seo: { metaTitle: "Original title" } } });
    const copy = pm.duplicatePage(source.id)!;

    // Mutate the SOURCE's settings.
    pm.updatePage(source.id, { settings: { seo: { metaTitle: "Changed!" } } });

    const copyNow = ctx.pages.get(copy.id)!;
    expect(copyNow.settings?.seo?.metaTitle).toBe("Original title");
  });
});

describe("PageManager.deletePage", () => {
  it("unregisters route on delete (A3)", () => {
    const { pm, ctx, composer } = makeHarness();
    pm.createPage("About");
    pm.createPage("Contact");
    const about = Array.from(ctx.pages.values()).find((p) => p.slug === "about")!;

    pm.deletePage(about.id);

    expect(composer.router.resolve("/about")).toBeNull();
  });

  it("returns false for non-existent page (A8 error handling: non-throwing)", () => {
    const { pm } = makeHarness();
    expect(pm.deletePage("nonexistent")).toBe(false);
  });
});

describe("PageManager.reorderPage", () => {
  it("moves a page after a target ID", () => {
    const { pm, ctx } = makeHarness();
    const a = pm.createPage("A");
    const b = pm.createPage("B");
    const c = pm.createPage("C");

    // Move C to be right after A → order: A, C, B.
    pm.reorderPage(c.id, a.id);

    const order = Array.from(ctx.pages.keys());
    expect(order).toEqual([a.id, c.id, b.id]);
  });

  it("afterId=null prepends the page", () => {
    const { pm, ctx } = makeHarness();
    const a = pm.createPage("A");
    const b = pm.createPage("B");

    pm.reorderPage(b.id, null);

    const order = Array.from(ctx.pages.keys());
    expect(order).toEqual([b.id, a.id]);
  });

  it("returns false for invalid pageId", () => {
    const { pm } = makeHarness();
    pm.createPage("A");
    expect(pm.reorderPage("nonexistent", null)).toBe(false);
  });
});

describe("PageManager.importPage — legacy normalization", () => {
  it("fills defaults for missing Phase 1 fields", () => {
    const { pm, ctx } = makeHarness();
    const legacy: PageData = {
      id: "legacy-1",
      name: "Legacy",
      slug: "legacy",
      root: { id: "r1", type: "container", children: [] },
      // No updatedAt, no slugManuallySet, no slugHistory.
    };
    pm.importPage(legacy);
    const imported = ctx.pages.get("legacy-1")!;
    expect(imported.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(imported.slugManuallySet).toBe(false);
    expect(imported.slugHistory).toEqual([]);
  });
});

describe("PageManager.recordAppliedTemplate (S9 — emits TEMPLATE_APPLIED)", () => {
  it("appends to meta.appliedTemplates and emits TEMPLATE_APPLIED", () => {
    const { pm, ctx, composer } = makeHarness();
    const page = pm.createPage("Home");
    composer.emit.mockClear();

    pm.recordAppliedTemplate(page.id, { templateId: "hero-1", version: "1.0.0" });

    const stored = ctx.pages.get(page.id)!.meta?.appliedTemplates ?? [];
    expect(stored).toHaveLength(1);
    expect(stored[0].templateId).toBe("hero-1");
    expect(stored[0].version).toBe("1.0.0");
    expect(stored[0].appliedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);

    const templateEmits = composer.emit.mock.calls.filter(
      (c) => c[0] === EVENTS.TEMPLATE_APPLIED
    );
    expect(templateEmits).toHaveLength(1);
    expect(templateEmits[0][1]).toEqual({
      templateId: "hero-1",
      pageId: page.id,
      version: "1.0.0",
    });
  });

  it("caps the appliedTemplates stack at 25 entries", () => {
    const { pm, ctx } = makeHarness();
    const page = pm.createPage("Home");
    for (let i = 0; i < 30; i++) {
      pm.recordAppliedTemplate(page.id, { templateId: `tpl-${i}` });
    }
    const stored = ctx.pages.get(page.id)!.meta?.appliedTemplates ?? [];
    expect(stored).toHaveLength(25);
    expect(stored[0].templateId).toBe("tpl-5");
    expect(stored[24].templateId).toBe("tpl-29");
  });
});

describe("PageManager.removeAppliedTemplate (S9 — emits TEMPLATE_REMOVED)", () => {
  it("removes the most recent matching template + emits TEMPLATE_REMOVED", () => {
    const { pm, ctx, composer } = makeHarness();
    const page = pm.createPage("Home");
    pm.recordAppliedTemplate(page.id, { templateId: "tpl-a" });
    pm.recordAppliedTemplate(page.id, { templateId: "tpl-b" });
    pm.recordAppliedTemplate(page.id, { templateId: "tpl-a" });
    composer.emit.mockClear();

    pm.removeAppliedTemplate(page.id, "tpl-a");

    const stored = ctx.pages.get(page.id)!.meta?.appliedTemplates ?? [];
    // Most-recent tpl-a removed; first tpl-a + tpl-b remain.
    expect(stored.map((s) => s.templateId)).toEqual(["tpl-a", "tpl-b"]);

    const removedEmits = composer.emit.mock.calls.filter(
      (c) => c[0] === EVENTS.TEMPLATE_REMOVED
    );
    expect(removedEmits).toHaveLength(1);
    expect(removedEmits[0][1]).toEqual({ templateId: "tpl-a", pageId: page.id });
  });

  it("is a no-op when the template was not applied", () => {
    const { pm, composer } = makeHarness();
    const page = pm.createPage("Home");
    composer.emit.mockClear();

    pm.removeAppliedTemplate(page.id, "never-applied");

    const removedEmits = composer.emit.mock.calls.filter(
      (c) => c[0] === EVENTS.TEMPLATE_REMOVED
    );
    expect(removedEmits).toHaveLength(0);
  });
});
