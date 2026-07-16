/**
 * LayoutAnalyzer Tests
 * Pure heuristic analysis (spacing/alignment/contrast/a11y) — no AI calls;
 * the composer element tree is mocked.
 * @license BSD-3-Clause
 */

import { describe, it, expect } from "vitest";
import { LayoutAnalyzer, type LayoutSuggestion } from "../LayoutAnalyzer";
import type { Composer } from "../../Composer";

interface Node {
  id: string;
  type?: string;
  styles?: Record<string, string>;
  attributes?: Record<string, string>;
  content?: string;
  children?: Node[];
}

interface WrappedNode {
  getId: () => string;
  getType: () => string;
  getStyles: () => Record<string, string>;
  getAttributes: () => Record<string, string>;
  getContent: () => string;
  getChildren: () => WrappedNode[];
}

function wrap(node: Node): WrappedNode {
  return {
    getId: () => node.id,
    getType: () => node.type ?? "container",
    getStyles: () => node.styles ?? {},
    getAttributes: () => node.attributes ?? {},
    getContent: () => node.content ?? "",
    getChildren: () => (node.children ?? []).map(wrap),
  };
}

function makeComposer(root: Node | null): Composer {
  return {
    elements: {
      getActivePage: () => (root ? { root: { id: root.id } } : undefined),
      getElement: (id: string) => (root && id === root.id ? wrap(root) : undefined),
    },
  } as unknown as Composer;
}

function ofType(suggestions: LayoutSuggestion[], type: LayoutSuggestion["type"]) {
  return suggestions.filter((s) => s.type === type);
}

/** Root sized to overlap all children vertically so it contributes no spacing pairs. */
const BIG_ROOT_STYLES = { left: "0", top: "0", width: "1000", height: "5000" };

describe("LayoutAnalyzer.analyze — empty states", () => {
  it("returns a perfect score with no suggestions when there is no active page", () => {
    const result = new LayoutAnalyzer(makeComposer(null)).analyze();

    expect(result.suggestions).toEqual([]);
    expect(result.score).toBe(100);
    expect(result.summary).toEqual({ spacing: 100, alignment: 100, contrast: 100, accessibility: 100 });
  });

  it("returns a perfect score for a clean single container", () => {
    const result = new LayoutAnalyzer(
      makeComposer({ id: "root", styles: BIG_ROOT_STYLES })
    ).analyze();

    expect(result.suggestions).toEqual([]);
    expect(result.score).toBe(100);
  });
});

describe("LayoutAnalyzer — spacing analysis", () => {
  it("warns when more than 3 distinct (4px-rounded) vertical gaps exist", () => {
    // Pairwise vertical gaps: 20, 64, 132, 36, 100, 56 → 6 unique values > 3
    const root: Node = {
      id: "root",
      styles: BIG_ROOT_STYLES,
      children: [
        { id: "a", styles: { left: "100", top: "0", width: "200", height: "10" } },
        { id: "b", styles: { left: "100", top: "30", width: "200", height: "10" } },
        { id: "c", styles: { left: "100", top: "75", width: "200", height: "10" } },
        { id: "d", styles: { left: "100", top: "141", width: "200", height: "10" } },
      ],
    };

    const result = new LayoutAnalyzer(makeComposer(root)).analyze();
    const spacing = ofType(result.suggestions, "spacing");

    expect(spacing).toHaveLength(1);
    expect(spacing[0].severity).toBe("warning");
    expect(spacing[0].title).toBe("Inconsistent spacing detected");
    expect(result.summary.spacing).toBe(90);
    expect(result.score).toBe(98); // round((90 + 100 + 100 + 100) / 4)
  });

  it("stays quiet for a consistent spacing scale", () => {
    const root: Node = {
      id: "root",
      styles: BIG_ROOT_STYLES,
      children: [
        { id: "a", styles: { left: "100", top: "0", width: "200", height: "10" } },
        { id: "b", styles: { left: "100", top: "42", width: "200", height: "10" } },
        { id: "c", styles: { left: "100", top: "84", width: "200", height: "10" } },
      ],
    };

    const result = new LayoutAnalyzer(makeComposer(root)).analyze();

    expect(ofType(result.suggestions, "spacing")).toHaveLength(0);
    expect(result.summary.spacing).toBe(100);
  });
});

describe("LayoutAnalyzer — alignment analysis", () => {
  it.todo(
    "BUG: alignment near-miss detection can never fire — left positions are rounded to multiples of 8 BEFORE grouping, so adjacent group keys always differ by >= 8 and the `diff < 8` near-miss branch is unreachable"
  );

  it("pins current behavior: elements 4px apart horizontally raise NO alignment suggestion", () => {
    const root: Node = {
      id: "root",
      styles: BIG_ROOT_STYLES,
      children: [
        // 4px apart — a classic near-miss the analyzer is meant to flag.
        { id: "a", styles: { left: "10", top: "0", width: "100", height: "10" } },
        { id: "b", styles: { left: "14", top: "0", width: "100", height: "10" } },
      ],
    };

    const result = new LayoutAnalyzer(makeComposer(root)).analyze();

    expect(ofType(result.suggestions, "alignment")).toHaveLength(0);
    expect(result.summary.alignment).toBe(100);
  });
});

describe("LayoutAnalyzer — contrast analysis", () => {
  const textNode = (color: string, backgroundColor: string): Node => ({
    id: "root",
    styles: BIG_ROOT_STYLES,
    children: [{ id: "t1", type: "text", content: "hello", styles: { color, backgroundColor } }],
  });

  it("flags sub-4.5:1 text contrast as a warning", () => {
    // #777 on #fff ≈ 4.48:1 — below AA, above 3:1
    const result = new LayoutAnalyzer(makeComposer(textNode("#777777", "#ffffff"))).analyze();
    const contrast = ofType(result.suggestions, "contrast");

    expect(contrast).toHaveLength(1);
    expect(contrast[0].severity).toBe("warning");
    expect(contrast[0].title).toBe("Low text contrast");
    expect(contrast[0].description).toContain("WCAG AA");
    expect(contrast[0].elementIds).toEqual(["t1"]);
    expect(result.summary.contrast).toBe(90);
  });

  it("escalates sub-3:1 contrast to an error", () => {
    // #aaa on #fff ≈ 2.32:1
    const result = new LayoutAnalyzer(makeComposer(textNode("#aaaaaa", "#ffffff"))).analyze();
    const contrast = ofType(result.suggestions, "contrast");

    expect(contrast).toHaveLength(1);
    expect(contrast[0].severity).toBe("error");
    expect(result.summary.contrast).toBe(80);
  });

  it("accepts high-contrast text (and the black-on-white defaults)", () => {
    const explicit = new LayoutAnalyzer(makeComposer(textNode("#000000", "#ffffff"))).analyze();
    expect(ofType(explicit.suggestions, "contrast")).toHaveLength(0);

    const defaults = new LayoutAnalyzer(
      makeComposer({
        id: "root",
        styles: BIG_ROOT_STYLES,
        children: [{ id: "t1", type: "text", content: "hi" }],
      })
    ).analyze();
    expect(ofType(defaults.suggestions, "contrast")).toHaveLength(0);
    expect(defaults.summary.contrast).toBe(100);
  });

  it("only inspects text-like element types", () => {
    const result = new LayoutAnalyzer(
      makeComposer({
        id: "root",
        styles: BIG_ROOT_STYLES,
        children: [
          {
            id: "b1",
            type: "button",
            content: "Click",
            styles: { color: "#aaaaaa", backgroundColor: "#ffffff" },
          },
        ],
      })
    ).analyze();

    expect(ofType(result.suggestions, "contrast")).toHaveLength(0);
  });

  it.todo(
    "BUG: named CSS colors (e.g. color: 'red') silently skip contrast analysis — getLuminance only parses hex, parseInt('re', 16) is NaN and the NaN ratio fails every comparison"
  );

  it("pins current behavior: named-color text raises no contrast suggestion even when unreadable", () => {
    const result = new LayoutAnalyzer(
      makeComposer(textNode("lightgray", "white"))
    ).analyze();

    expect(ofType(result.suggestions, "contrast")).toHaveLength(0);
  });
});

describe("LayoutAnalyzer — accessibility analysis", () => {
  it("warns on images without alt text", () => {
    const result = new LayoutAnalyzer(
      makeComposer({
        id: "root",
        styles: BIG_ROOT_STYLES,
        children: [{ id: "img1", type: "image" }],
      })
    ).analyze();
    const a11y = ofType(result.suggestions, "accessibility");

    expect(a11y).toHaveLength(1);
    expect(a11y[0].severity).toBe("warning");
    expect(a11y[0].title).toBe("Missing alt text");
    expect(a11y[0].elementIds).toEqual(["img1"]);
    expect(result.summary.accessibility).toBe(90);
  });

  it("accepts images with alt text", () => {
    const result = new LayoutAnalyzer(
      makeComposer({
        id: "root",
        styles: BIG_ROOT_STYLES,
        children: [{ id: "img1", type: "image", attributes: { alt: "A photo" } }],
      })
    ).analyze();

    expect(ofType(result.suggestions, "accessibility")).toHaveLength(0);
  });

  it("errors on empty (or whitespace-only) buttons and links", () => {
    const result = new LayoutAnalyzer(
      makeComposer({
        id: "root",
        styles: BIG_ROOT_STYLES,
        children: [
          { id: "btn1", type: "button", content: "" },
          { id: "lnk1", type: "link", content: "   " },
          { id: "lnk2", type: "link", content: "Read more" },
        ],
      })
    ).analyze();
    const a11y = ofType(result.suggestions, "accessibility");

    expect(a11y).toHaveLength(2);
    expect(a11y.every((s) => s.severity === "error")).toBe(true);
    expect(a11y.map((s) => s.elementIds[0]).sort()).toEqual(["btn1", "lnk1"]);
  });
});

describe("LayoutAnalyzer — scoring", () => {
  it("one accessibility error costs 20 points in its category and averages into the overall score", () => {
    const result = new LayoutAnalyzer(
      makeComposer({
        id: "root",
        styles: BIG_ROOT_STYLES,
        children: [{ id: "btn1", type: "button", content: "" }],
      })
    ).analyze();

    expect(result.summary.accessibility).toBe(80);
    expect(result.summary.spacing).toBe(100);
    expect(result.score).toBe(95); // round((100 + 100 + 100 + 80) / 4)
  });

  it("category scores floor at 0 under heavy penalties", () => {
    const result = new LayoutAnalyzer(
      makeComposer({
        id: "root",
        styles: BIG_ROOT_STYLES,
        children: Array.from({ length: 6 }, (_, i) => ({
          id: `btn${i}`,
          type: "button" as const,
          content: "",
        })),
      })
    ).analyze();

    expect(result.summary.accessibility).toBe(0); // 100 - 6*20, floored
    expect(result.score).toBe(75);
  });
});
