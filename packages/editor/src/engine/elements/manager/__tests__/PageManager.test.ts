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
