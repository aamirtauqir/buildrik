/**
 * PageManager — remaining branches not covered by PageManager.test.ts.
 *
 * That suite covers create/update slug flows, duplicatePage, delete-route
 * unregistration, reorder happy paths, importPage normalization, and the
 * applied-template stack. This one covers: setActivePage/setHomePage,
 * active-page reassignment on delete, element-registry cleanup on delete,
 * exportPages live-tree merging, clear(), update no-op branches, meta
 * merging, and reorder/second-page edge cases.
 *
 * Same minimal-context harness style as PageManager.test.ts (stub elements
 * with toJSON/getDescendants) so PageManager's observable behavior is
 * exercised without a full Composer.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { PageManager } from "../PageManager";
import type { ElementManagerContext } from "../types";
import type { ElementData, PageData } from "../../../../shared/types";
import { EVENTS } from "../../../../shared/constants/events";

interface StubElement {
  getId: () => string;
  toJSON: () => ElementData;
  getDescendants: () => StubElement[];
}

function makeHarness() {
  const pages = new Map<string, PageData>();
  const elements = new Map<string, StubElement>();
  let activeId: string | null = null;

  const routes = new Map<string, string>();
  const composer = {
    emit: vi.fn(),
    router: {
      register: (path: string, pageId: string) => routes.set(path, pageId),
      unregister: (path: string) => routes.delete(path),
      resolve: (path: string) => routes.get(path) ?? null,
      clear: () => routes.clear(),
    },
  };

  // Registers the root AND its (data-declared) children so delete-cleanup
  // paths exercise the descendant sweep.
  const registerTree = (data: ElementData): StubElement => {
    const childStubs = (data.children ?? []).map((c) => registerTree(c));
    const el: StubElement = {
      getId: () => data.id,
      toJSON: () => ({ ...data, content: `live:${data.id}` }),
      getDescendants: () => childStubs.flatMap((c) => [c, ...c.getDescendants()]),
    };
    elements.set(data.id, el);
    return el;
  };

  const ctx: ElementManagerContext = {
    composer: composer as never,
    elements: elements as never,
    pages,
    getActivePageId: () => activeId,
    setActivePageId: (id) => {
      activeId = id;
    },
    buildElementTree: (data: ElementData) => registerTree(data) as never,
    cloneElementData: (data) => {
      let n = 0;
      const clone = (d: ElementData): ElementData => ({
        ...d,
        id: `clone-${++n}`,
        children: d.children?.map(clone),
      });
      return clone(data);
    },
    getAllDescendants: (element) =>
      (element as unknown as StubElement).getDescendants() as never,
  };

  return {
    pm: new PageManager(ctx),
    ctx,
    composer,
    routes,
    elements,
    getActiveId: () => activeId,
  };
}

function emitsOf(composer: { emit: ReturnType<typeof vi.fn> }, type: string) {
  return composer.emit.mock.calls.filter(
    (c) => c[0] === EVENTS.PROJECT_CHANGED && (c[1] as { type: string }).type === type
  );
}

describe("PageManager.setActivePage", () => {
  it("activates a known page and emits page:activated", () => {
    const { pm, composer, getActiveId } = makeHarness();
    const a = pm.createPage("A");
    const b = pm.createPage("B");
    expect(getActiveId()).toBe(a.id); // first page auto-activates

    pm.setActivePage(b.id);

    expect(getActiveId()).toBe(b.id);
    expect(emitsOf(composer, "page:activated")).toHaveLength(1);
  });

  it("ignores an unknown page id", () => {
    const { pm, composer, getActiveId } = makeHarness();
    const a = pm.createPage("A");
    composer.emit.mockClear();

    pm.setActivePage("ghost");

    expect(getActiveId()).toBe(a.id);
    expect(emitsOf(composer, "page:activated")).toHaveLength(0);
  });

  it("createPage does NOT steal the active page once one exists", () => {
    const { pm, getActiveId } = makeHarness();
    const a = pm.createPage("A");
    pm.createPage("B");
    expect(getActiveId()).toBe(a.id);
  });
});

describe("PageManager.setHomePage", () => {
  it("marks exactly one page as home, flipping the previous one off", () => {
    const { pm, ctx, composer } = makeHarness();
    const a = pm.createPage("A");
    const b = pm.createPage("B");

    pm.setHomePage(a.id);
    expect(ctx.pages.get(a.id)!.isHome).toBe(true);
    expect(ctx.pages.get(b.id)!.isHome).toBe(false);

    pm.setHomePage(b.id);
    expect(ctx.pages.get(a.id)!.isHome).toBe(false);
    expect(ctx.pages.get(b.id)!.isHome).toBe(true);
    expect(emitsOf(composer, "page:home")).toHaveLength(2);
  });

  it("is a no-op for an unknown id", () => {
    const { pm, ctx, composer } = makeHarness();
    const a = pm.createPage("A");
    pm.setHomePage(a.id);
    composer.emit.mockClear();

    pm.setHomePage("ghost");

    expect(ctx.pages.get(a.id)!.isHome).toBe(true);
    expect(emitsOf(composer, "page:home")).toHaveLength(0);
  });
});

describe("PageManager.getActivePage / getAllPages", () => {
  it("getActivePage is undefined before any page exists", () => {
    const { pm } = makeHarness();
    expect(pm.getActivePage()).toBeUndefined();
  });

  it("getAllPages preserves insertion order", () => {
    const { pm } = makeHarness();
    const a = pm.createPage("A");
    const b = pm.createPage("B");
    expect(pm.getAllPages().map((p) => p.id)).toEqual([a.id, b.id]);
  });
});

describe("PageManager.updatePage — no-op branches", () => {
  it("unknown id: silent no-op", () => {
    const { pm, composer } = makeHarness();
    composer.emit.mockClear();
    pm.updatePage("ghost", { name: "X" });
    expect(emitsOf(composer, "page:updated")).toHaveLength(0);
  });

  it("no actual change → no page:updated, updatedAt untouched", () => {
    const { pm, ctx, composer } = makeHarness();
    const p = pm.createPage("Home");
    const before = ctx.pages.get(p.id)!.updatedAt;
    composer.emit.mockClear();

    pm.updatePage(p.id, { name: "Home" }); // same name
    pm.updatePage(p.id, { slug: "" }); // empty slug ignored
    pm.updatePage(p.id, {}); // nothing at all

    expect(emitsOf(composer, "page:updated")).toHaveLength(0);
    expect(ctx.pages.get(p.id)!.updatedAt).toBe(before);
  });

  it("explicit slugManuallySet=false is honored on a slug change", () => {
    const { pm, ctx } = makeHarness();
    const p = pm.createPage("Home");

    pm.updatePage(p.id, { slug: "auto-derived", slugManuallySet: false });

    const page = ctx.pages.get(p.id)!;
    expect(page.slug).toBe("auto-derived");
    expect(page.slugManuallySet).toBe(false);
  });

  it("meta updates merge top-level keys instead of clobbering", () => {
    const { pm, ctx } = makeHarness();
    const p = pm.createPage("Home");

    pm.updatePage(p.id, { meta: { appliedTemplates: [{ templateId: "t1", appliedAt: "2026-01-01T00:00:00.000Z" }] } });
    pm.updatePage(p.id, { meta: { custom: "kept" } as never });

    const meta = ctx.pages.get(p.id)!.meta as Record<string, unknown>;
    expect(meta.custom).toBe("kept");
    expect(meta.appliedTemplates).toEqual([{ templateId: "t1", appliedAt: "2026-01-01T00:00:00.000Z" }]);
  });
});

describe("PageManager.deletePage — active reassignment + registry cleanup", () => {
  it("reassigns the active page to the first remaining page", () => {
    const { pm, getActiveId } = makeHarness();
    const a = pm.createPage("A"); // active
    const b = pm.createPage("B");
    pm.createPage("C");

    pm.deletePage(a.id);
    expect(getActiveId()).toBe(b.id);
  });

  it("keeps the current active page when a non-active page is deleted", () => {
    const { pm, getActiveId } = makeHarness();
    const a = pm.createPage("A");
    const b = pm.createPage("B");
    pm.deletePage(b.id);
    expect(getActiveId()).toBe(a.id);
  });

  // KNOWN (pinned, not re-filed): the engine allows deleting the last page —
  // active becomes null and the project has zero pages.
  it("pins: deleting the last page leaves active=null and zero pages", () => {
    const { pm, getActiveId } = makeHarness();
    const only = pm.createPage("Only");
    expect(pm.deletePage(only.id)).toBe(true);
    expect(getActiveId()).toBeNull();
    expect(pm.getAllPages()).toEqual([]);
  });

  it("sweeps the page's root AND descendants out of the element registry", () => {
    const { pm, ctx, elements } = makeHarness();
    const p = pm.createPage("Home");
    // Rebuild the page's tree with a child so the descendant sweep has work.
    const rootData = ctx.pages.get(p.id)!.root;
    rootData.children = [{ id: "child-1", type: "text", children: [] }];
    ctx.buildElementTree(rootData);
    expect(elements.has("child-1")).toBe(true);

    pm.deletePage(p.id);

    expect(elements.has(rootData.id)).toBe(false);
    expect(elements.has("child-1")).toBe(false);
  });
});

describe("PageManager.reorderPage — invalid afterId", () => {
  it("returns false when afterId is unknown, order untouched", () => {
    const { pm } = makeHarness();
    const a = pm.createPage("A");
    const b = pm.createPage("B");
    expect(pm.reorderPage(b.id, "ghost")).toBe(false);
    expect(pm.getAllPages().map((p) => p.id)).toEqual([a.id, b.id]);
  });
});

describe("PageManager.exportPages", () => {
  it("exports the LIVE element tree via toJSON when the root is registered", () => {
    const { pm } = makeHarness();
    pm.createPage("Home");
    const [page] = pm.exportPages();
    // Harness stubs toJSON with a live-marker so the merge source is provable.
    expect(page.root.content).toBe(`live:${page.root.id}`);
  });

  it("falls back to the stored page.root when the element is missing", () => {
    const { pm, ctx, elements } = makeHarness();
    const p = pm.createPage("Home");
    elements.delete(ctx.pages.get(p.id)!.root.id);

    const [page] = pm.exportPages();
    expect(page.root.content).toBeUndefined();
    expect(page.root.id).toBe(ctx.pages.get(p.id)!.root.id);
  });

  it("keeps page metadata (slugHistory, flags) alongside the merged root", () => {
    const { pm } = makeHarness();
    const p = pm.createPage("Home");
    pm.updatePage(p.id, { slug: "landing" });

    const [page] = pm.exportPages();
    expect(page.slug).toBe("landing");
    expect(page.slugHistory).toHaveLength(1);
    expect(page.slugManuallySet).toBe(true);
  });
});

describe("PageManager.clear", () => {
  it("clears pages, elements, active id, and the router", () => {
    const { pm, routes, elements, getActiveId } = makeHarness();
    pm.createPage("A");
    pm.createPage("B");
    expect(routes.size).toBe(2);
    expect(elements.size).toBeGreaterThan(0);

    pm.clear();

    expect(pm.getAllPages()).toEqual([]);
    expect(elements.size).toBe(0);
    expect(getActiveId()).toBeNull();
    expect(routes.size).toBe(0);
  });
});

describe("PageManager.duplicatePage — style array isolation", () => {
  it("copies the styles array so source mutations don't leak into the copy", () => {
    const { pm, ctx } = makeHarness();
    const src = pm.createPage("Home");
    ctx.pages.get(src.id)!.styles = ["s1"] as never;

    const copy = pm.duplicatePage(src.id)!;
    (ctx.pages.get(src.id)!.styles as unknown as string[]).push("s2");

    expect(copy.styles).toEqual(["s1"]);
    expect(copy.slugHistory).toEqual([]);
  });
});
