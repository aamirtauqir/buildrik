/**
 * locateComment — REGRESSION guard (C2, decision #39).
 *
 * The retired ReviewBar's "Next ›" was the only thing in the shell that
 * switched page AND selected a comment's anchor. Its assert
 * (`ReviewBar.test.tsx` "switches page and selects the anchor") is ported
 * here against the helper both the Review panel's Locate › and its banner
 * walk now call — the behaviour B3 depends on must not go with the bar.
 *
 * @license BSD-3-Clause
 */
import { describe, expect, it, vi } from "vitest";
import { locateComment } from "../locate";
import type { Composer } from "@/engine";

function makeComposer(activePageId = "page-9") {
  const el = { id: "el-1" };
  const composer = {
    elements: {
      getActivePage: () => ({ id: activePageId }),
      setActivePage: vi.fn(),
      getElement: (id: string) => (id === "el-1" ? el : undefined),
    },
    selection: { select: vi.fn() },
  };
  return { composer: composer as unknown as Composer, el, api: composer };
}

describe("locateComment", () => {
  it("resolves a stored pin selector to its element — the shape real comments carry", () => {
    const { composer, api, el } = makeComposer("page-1");
    const outcome = locateComment(composer, { pageId: "page-1", targetSelector: '[data-buildrick-id="el-1"]' });
    expect(api.selection.select).toHaveBeenCalledWith(el);
    expect(outcome).toBe("located");
  });

  it("switches page and selects the anchor (ported from ReviewBar.test.tsx:140)", () => {
    const { composer, api, el } = makeComposer("page-9");
    const outcome = locateComment(composer, { pageId: "page-1", targetSelector: "el-1" });
    expect(api.elements.setActivePage).toHaveBeenCalledWith("page-1");
    expect(api.selection.select).toHaveBeenCalledWith(el);
    expect(outcome).toBe("located");
  });

  it("switches the page BEFORE selecting — the order is the contract (#27)", () => {
    const { composer, api } = makeComposer("page-9");
    const calls: string[] = [];
    api.elements.setActivePage.mockImplementation(() => calls.push("page"));
    api.selection.select.mockImplementation(() => calls.push("select"));
    locateComment(composer, { pageId: "page-1", targetSelector: "el-1" });
    expect(calls).toEqual(["page", "select"]);
  });

  it("does not switch when the comment is already on the current page", () => {
    const { composer, api } = makeComposer("page-1");
    locateComment(composer, { pageId: "page-1", targetSelector: "el-1" });
    expect(api.elements.setActivePage).not.toHaveBeenCalled();
    expect(api.selection.select).toHaveBeenCalled();
  });

  it("selects nothing for a comment whose anchor was deleted, and says so", () => {
    const { composer, api } = makeComposer("page-9");
    const outcome = locateComment(composer, { pageId: null, targetSelector: "gone" });
    expect(api.selection.select).not.toHaveBeenCalled();
    expect(api.elements.setActivePage).not.toHaveBeenCalled();
    expect(outcome).toBe("gone");
  });

  it("scrolls the selected anchor into view once the page has rendered", () => {
    vi.useFakeTimers();
    const node = document.createElement("div");
    node.setAttribute("data-buildrick-id", "el-1");
    node.scrollIntoView = vi.fn();
    document.body.appendChild(node);
    const { composer } = makeComposer("page-9");
    locateComment(composer, { pageId: "page-1", targetSelector: "el-1" });
    vi.advanceTimersByTime(100);
    expect(node.scrollIntoView).toHaveBeenCalledWith({ block: "center" });
    node.remove();
    vi.useRealTimers();
  });

  it("an unpinned comment moves the page and selects nothing", () => {
    const { composer, api } = makeComposer("page-9");
    const outcome = locateComment(composer, { pageId: "page-1", targetSelector: null });
    expect(api.elements.setActivePage).toHaveBeenCalledWith("page-1");
    expect(api.selection.select).not.toHaveBeenCalled();
    expect(outcome).toBe("page-only");
  });
});
