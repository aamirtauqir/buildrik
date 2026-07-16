/**
 * nesting/operations — move/paste validation, error messages, auto-fix
 * suggestions, and tree restructuring (reparent/wrap/unwrap).
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import type { ElementType } from "../../../types";
import {
  canMoveElement,
  validateBulkMove,
  validatePaste,
  getNestingErrorMessage,
  getSuggestedFix,
  getAutoFixSuggestions,
  reparentElement,
  wrapElement,
  unwrapElement,
} from "../operations";

type Node = { id?: string; type: ElementType; children?: Node[] };

describe("canMoveElement", () => {
  it("allows a valid move", () => {
    expect(canMoveElement("text", "container").allowed).toBe(true);
  });

  it("rejects an invalid move and offers suggestions", () => {
    const r = canMoveElement("section", "text");
    expect(r.allowed).toBe(false);
    expect(r.reason).toBeTruthy();
    expect(Array.isArray(r.suggestions)).toBe(true);
  });

  it("rejects a move that would invalidate an existing child", () => {
    // moving a 'text' whose child 'section' can't live inside 'text'
    const r = canMoveElement("text", "container", [{ type: "section" }]);
    expect(r.allowed).toBe(false);
    expect(r.wouldCauseIssues?.[0]).toMatch(/section/);
  });

  it("respects strictMode", () => {
    // heading > container passes loose nesting but fails strict HTML5 rules
    expect(canMoveElement("container", "heading").allowed).toBe(true);
    expect(canMoveElement("container", "heading", undefined, { strictMode: true }).allowed).toBe(
      false
    );
  });
});

describe("validateBulkMove", () => {
  it("collects invalid elements", () => {
    const r = validateBulkMove([{ type: "text" }, { type: "section" }], "text");
    expect(r.valid).toBe(false);
    expect(r.invalidElements.map((e) => e.element)).toContain("section");
  });

  it("is valid when every element fits", () => {
    const r = validateBulkMove([{ type: "text" }, { type: "heading" }], "container");
    expect(r.valid).toBe(true);
    expect(r.invalidElements).toEqual([]);
  });
});

describe("validatePaste", () => {
  it("counts valid elements and reports errors for the rest", () => {
    const r = validatePaste([{ type: "text" }, { type: "section" }], "text");
    expect(r.validElements).toBe(1);
    expect(r.valid).toBe(false);
    expect(r.errors[0]).toMatch(/Cannot paste section into text/);
  });

  it("is valid when all elements paste cleanly", () => {
    const r = validatePaste([{ type: "text" }, { type: "heading" }], "container");
    expect(r.valid).toBe(true);
    expect(r.validElements).toBe(2);
  });
});

describe("getNestingErrorMessage", () => {
  it("reports void parents", () => {
    expect(getNestingErrorMessage("text", "image")).toMatch(/void element/);
  });

  it("reports an HTML-forbidden pairing", () => {
    expect(getNestingErrorMessage("section", "text")).toMatch(/HTML restriction/);
  });

  it("falls back to a generic category message", () => {
    expect(getNestingErrorMessage("grid", "text")).toBe("grid cannot be nested inside text");
  });
});

describe("getSuggestedFix", () => {
  it("suggests valid parents when some exist", () => {
    expect(getSuggestedFix("heading", "text")).toMatch(/Try placing heading inside/);
  });
});

describe("getAutoFixSuggestions", () => {
  it("returns no suggestions for a fully valid tree", () => {
    const tree: Node = { type: "container", id: "r", children: [{ type: "text", id: "t" }] };
    expect(getAutoFixSuggestions(tree)).toEqual([]);
  });

  it("suggests wrap + move for a forbidden child that a container could hold", () => {
    // footer is forbidden directly inside header, but both nest inside container
    const suggestions = getAutoFixSuggestions({ type: "footer", id: "f" }, "header");
    const types = suggestions.map((s) => s.type);
    expect(types).toContain("wrap");
    expect(types).toContain("move");
  });

  it("recurses into children to collect nested suggestions", () => {
    const tree: Node = {
      type: "header",
      id: "h",
      children: [{ type: "footer", id: "f" }],
    };
    const suggestions = getAutoFixSuggestions(tree);
    expect(suggestions.some((s) => s.elementId === "f")).toBe(true);
  });
});

describe("reparentElement", () => {
  const build = (): Node => ({
    id: "root",
    type: "container",
    children: [
      { id: "a", type: "text" },
      { id: "b", type: "container", children: [] },
    ],
  });

  it("moves an element under a new valid parent", () => {
    const r = reparentElement(build(), "a", "b");
    expect(r.success).toBe(true);
    // 'a' now lives under 'b'
    const b = r.tree.children!.find((c) => c.id === "b");
    expect(b!.children!.some((c) => c.id === "a")).toBe(true);
    // ...and no longer directly under root
    expect(r.tree.children!.some((c) => c.id === "a")).toBe(false);
  });

  it("errors when the element is missing", () => {
    const r = reparentElement(build(), "zzz", "b");
    expect(r.success).toBe(false);
    expect(r.error).toBe("Element not found");
  });

  it("errors when the new parent is missing", () => {
    const r = reparentElement(build(), "a", "zzz");
    expect(r.success).toBe(false);
    expect(r.error).toBe("New parent not found");
  });

  it("errors on an invalid move", () => {
    const tree: Node = {
      id: "root",
      type: "container",
      children: [
        { id: "a", type: "text" },
        { id: "img", type: "image" },
      ],
    };
    const r = reparentElement(tree, "a", "img");
    expect(r.success).toBe(false);
    expect(r.error).toBeTruthy();
  });

  it("honors an explicit insertion index", () => {
    const tree: Node = {
      id: "root",
      type: "container",
      children: [
        { id: "a", type: "text" },
        { id: "box", type: "container", children: [{ id: "x", type: "text" }] },
      ],
    };
    const r = reparentElement(tree, "a", "box", 0);
    const box = r.tree.children!.find((c) => c.id === "box");
    expect(box!.children!.map((c) => c.id)).toEqual(["a", "x"]);
  });
});

describe("wrapElement", () => {
  const build = (): Node => ({
    id: "root",
    type: "container",
    children: [{ id: "a", type: "text" }],
  });

  it("wraps an element in a new container", () => {
    const r = wrapElement(build(), "a", "container", "w1");
    expect(r.success).toBe(true);
    expect(r.wrapperId).toBe("w1");
    const wrapper = r.tree.children!.find((c) => c.id === "w1");
    expect(wrapper!.type).toBe("container");
    expect(wrapper!.children!.map((c) => c.id)).toEqual(["a"]);
  });

  it("errors when the element is missing", () => {
    expect(wrapElement(build(), "zzz", "container").error).toBe("Element not found");
  });

  it("errors when wrapping the root", () => {
    expect(wrapElement(build(), "root", "container").error).toBe("Cannot wrap root element");
  });

  it("errors when the element cannot live inside the wrapper", () => {
    // image is void: text cannot be nested inside it
    const r = wrapElement(build(), "a", "image");
    expect(r.success).toBe(false);
    expect(r.error).toMatch(/Cannot place text in image/);
  });
});

describe("unwrapElement", () => {
  const build = (): Node => ({
    id: "root",
    type: "container",
    children: [
      {
        id: "w",
        type: "container",
        children: [
          { id: "c1", type: "text" },
          { id: "c2", type: "text" },
        ],
      },
    ],
  });

  it("lifts a wrapper's children into its parent", () => {
    const r = unwrapElement(build(), "w");
    expect(r.success).toBe(true);
    expect(r.tree.children!.map((c) => c.id)).toEqual(["c1", "c2"]);
    expect(r.tree.children!.some((c) => c.id === "w")).toBe(false);
  });

  it("errors when the wrapper is missing", () => {
    expect(unwrapElement(build(), "zzz").error).toBe("Wrapper not found");
  });

  it("errors when the wrapper has no children", () => {
    const tree: Node = {
      id: "root",
      type: "container",
      children: [{ id: "w", type: "container", children: [] }],
    };
    expect(unwrapElement(tree, "w").error).toBe("Wrapper has no children");
  });

  it("errors when unwrapping the root", () => {
    const tree: Node = { id: "root", type: "container", children: [{ id: "x", type: "text" }] };
    expect(unwrapElement(tree, "root").error).toBe("Cannot unwrap root element");
  });
});
