/**
 * html/diffing — diffHTML structural comparison.
 * Uses tight HTML (no inter-tag whitespace) so the DOMParser node lists
 * are predictable.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { diffHTML } from "../diffing";

describe("diffHTML", () => {
  it("returns no diffs for identical markup", () => {
    expect(diffHTML("<div>a</div>", "<div>a</div>")).toEqual([]);
  });

  it("reports an added top-level node", () => {
    const diffs = diffHTML("<div>a</div>", "<div>a</div><p>b</p>");
    expect(diffs).toHaveLength(1);
    expect(diffs[0]).toMatchObject({ type: "add", path: "[1]", newValue: "<p>" });
  });

  it("reports a removed top-level node", () => {
    const diffs = diffHTML("<div>a</div><p>b</p>", "<div>a</div>");
    expect(diffs).toHaveLength(1);
    expect(diffs[0]).toMatchObject({ type: "remove", path: "[1]", oldValue: "<p>" });
  });

  it("reports a tag change", () => {
    const diffs = diffHTML("<div>x</div>", "<section>x</section>");
    expect(diffs).toContainEqual(
      expect.objectContaining({ type: "change", path: "[0].tag", oldValue: "div", newValue: "section" })
    );
  });

  it("reports a text-content change in a child text node", () => {
    const diffs = diffHTML("<span>a</span>", "<span>b</span>");
    expect(diffs).toContainEqual(
      expect.objectContaining({
        type: "change",
        path: "[0].children[0].content",
        oldValue: "a",
        newValue: "b",
      })
    );
  });

  it("reports an attribute change", () => {
    const diffs = diffHTML('<div id="a"></div>', '<div id="b"></div>');
    expect(diffs).toContainEqual(
      expect.objectContaining({ type: "change", path: "[0].attrs.id", oldValue: "a", newValue: "b" })
    );
  });

  it("classifies a newly-added attribute as add", () => {
    const diffs = diffHTML("<div></div>", '<div id="x"></div>');
    expect(diffs).toContainEqual(
      expect.objectContaining({ type: "add", path: "[0].attrs.id", newValue: "x" })
    );
  });

  it("classifies a dropped attribute as remove", () => {
    const diffs = diffHTML('<div id="x"></div>', "<div></div>");
    expect(diffs).toContainEqual(
      expect.objectContaining({ type: "remove", path: "[0].attrs.id", oldValue: "x" })
    );
  });

  it("reports a node-type change (element → text)", () => {
    const diffs = diffHTML("<div></div>", "text");
    expect(diffs).toContainEqual(
      expect.objectContaining({ type: "change", path: "[0].type", oldValue: "element", newValue: "text" })
    );
  });

  it("stringifies a comment node when it is added", () => {
    const diffs = diffHTML("<div></div>", "<div></div><!--c-->");
    expect(diffs).toContainEqual(
      expect.objectContaining({ type: "add", path: "[1]", newValue: "<!--c-->" })
    );
  });

  it("stringifies a text node when it is added", () => {
    const diffs = diffHTML("<div></div>", "<div></div>hello");
    expect(diffs).toContainEqual(
      expect.objectContaining({ type: "add", path: "[1]", newValue: "hello" })
    );
  });
});
