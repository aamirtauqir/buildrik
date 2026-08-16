/**
 * collectUsageByPage — the number behind "Used in N places" (board 146:2) and
 * the used-in screen (146:68).
 *
 * It used to walk `composer.elements.getAllPages()`, and its own docstring
 * promised that was fine because it "needs no live element instances". That
 * was the bug: `getAllPages()` returns `Array.from(ctx.pages.values())` — the
 * STORED PageData — while `PageManager.exportPages()` rebuilds each root from
 * the live Elements and states in its comment that those are "the single
 * source of truth for element data".
 *
 * The consequence was not cosmetic. The used-in screen prints "Deleting this
 * file won't change anything on your site." beside that count, so a stale zero
 * is a false all-clear over an asset sitting on live elements.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { collectUsageByPage } from "../../data/mediaUtils";

const el = (id: string, type: string, name?: string) => ({
  getId: () => id,
  getType: () => type,
  getAttribute: (n: string) => (n === "data-name" ? name : undefined),
});

const composerWith = (byPage: Map<string, unknown[]>, pages: { id: string; name?: string }[]) => ({
  mediaOps: { getUsagesByPage: vi.fn(() => byPage) },
  elements: { getAllPages: () => pages },
});

describe("collectUsageByPage", () => {
  it("reads the live hierarchy through the command layer", () => {
    const byPage = new Map<string, unknown[]>([["p1", [el("e1", "image"), el("e2", "image")]]]);
    const composer = composerWith(byPage, [{ id: "p1", name: "Home" }]);

    const out = collectUsageByPage(composer, "blob:asset");

    expect(composer.mediaOps.getUsagesByPage).toHaveBeenCalledWith("blob:asset");
    expect(out).toHaveLength(1);
    expect(out[0].pageId).toBe("p1");
    expect(out[0].pageName).toBe("Home");
    expect(out[0].hits.map((h) => h.elementId)).toEqual(["e1", "e2"]);
  });

  it("prefers data-name for the label and falls back to the element type", () => {
    const byPage = new Map<string, unknown[]>([["p1", [el("e1", "image", "Hero shot"), el("e2", "image")]]]);
    const out = collectUsageByPage(composerWith(byPage, [{ id: "p1", name: "Home" }]), "s");

    expect(out[0].hits[0].label).toBe("Hero shot");
    expect(out[0].hits[0].crumb).toBe("Home › Hero shot");
    expect(out[0].hits[1].label).toBe("image");
  });

  it("returns nothing for an empty src without asking the command layer", () => {
    const composer = composerWith(new Map(), []);
    expect(collectUsageByPage(composer, "")).toEqual([]);
    expect(composer.mediaOps.getUsagesByPage).not.toHaveBeenCalled();
  });

  it("reports an unused asset as unused", () => {
    // The "safe to delete" case. It has to be reachable, and it has to be true.
    const out = collectUsageByPage(composerWith(new Map(), [{ id: "p1", name: "Home" }]), "s");
    expect(out).toEqual([]);
  });

  it("falls back to the page id when a page has no name", () => {
    const byPage = new Map<string, unknown[]>([["p9", [el("e1", "image")]]]);
    const out = collectUsageByPage(composerWith(byPage, [{ id: "p9" }]), "s");
    expect(out[0].pageName).toBe("p9");
    expect(out[0].hits[0].crumb).toBe("p9 › image");
  });
});
