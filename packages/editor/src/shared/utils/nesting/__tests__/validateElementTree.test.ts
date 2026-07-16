/**
 * validateElementTree tests — error/warning/info codes, statistics,
 * depth limits, cache behavior, and the isValidNesting fast path.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import type { ElementType } from "../../../types";
import {
  validateElementTree,
  isValidNesting,
  getValidChildren,
  getValidDropTargets,
  clearNestingCaches,
} from "../validator";

type TreeNode = {
  type: ElementType;
  children?: TreeNode[];
  id?: string;
};

/** Build a chain of nested containers `depth` levels deep. */
function nestedContainers(depth: number): TreeNode {
  let node: TreeNode = { type: "container" };
  for (let i = 1; i < depth; i++) {
    node = { type: "container", children: [node] };
  }
  return node;
}

const codes = (issues: { code: string }[]) => issues.map((i) => i.code);

describe("validateElementTree — happy path", () => {
  it("accepts a small valid tree and reports statistics", () => {
    const result = validateElementTree({
      type: "section",
      id: "root",
      children: [
        { type: "heading", id: "h" },
        { type: "container", id: "c", children: [{ type: "text", id: "t" }] },
      ],
    });

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.elementCount).toBe(4);
    expect(result.statistics.elementTypeCounts).toEqual({
      section: 1,
      heading: 1,
      container: 1,
      text: 1,
    });
    expect(result.statistics.headingLevels).toEqual([2]); // heading defaults to level 2
    expect(result.depth).toBe(2);
  });
});

describe("validateElementTree — error codes", () => {
  it("INVALID_NESTING for a nested form", () => {
    const result = validateElementTree({
      type: "form",
      children: [{ type: "form" }],
    });
    expect(result.valid).toBe(false);
    expect(codes(result.errors)).toContain("INVALID_NESTING");
  });

  it("INVALID_NESTING when the root itself violates the given parentType", () => {
    const result = validateElementTree({ type: "section" }, "text");
    expect(codes(result.errors)).toContain("INVALID_NESTING");
    expect(result.errors[0].parentType).toBe("text");
  });

  it("VOID_WITH_CHILDREN when a leaf element has children", () => {
    const result = validateElementTree({
      type: "image",
      children: [{ type: "text" }],
    } as TreeNode);
    expect(codes(result.errors)).toContain("VOID_WITH_CHILDREN");
    // children of a void element are not descended into
    expect(result.elementCount).toBe(1);
  });

  it("NESTED_INTERACTIVE for a button anywhere under a link", () => {
    const result = validateElementTree({
      type: "link",
      children: [{ type: "text", children: [{ type: "button" }] }],
    });
    expect(codes(result.errors)).toContain("NESTED_INTERACTIVE");
    expect(result.statistics.interactiveCount).toBe(2);
  });

  it("MAX_DEPTH_EXCEEDED truncates validation at options.maxDepth", () => {
    const result = validateElementTree(nestedContainers(5), undefined, 0, [], [], {
      maxDepth: 2,
    });
    expect(result.valid).toBe(false);
    expect(codes(result.errors)).toContain("MAX_DEPTH_EXCEEDED");
  });
});

describe("validateElementTree — warnings and info", () => {
  it("DEEP_NESTING warning past the recommended depth (15)", () => {
    const result = validateElementTree(nestedContainers(18));
    expect(result.valid).toBe(true); // warning, not error
    expect(codes(result.warnings)).toContain("DEEP_NESTING");
  });

  it("TOO_MANY_CHILDREN warning past 500 children", () => {
    const children: TreeNode[] = Array.from({ length: 501 }, () => ({ type: "text" as ElementType }));
    const result = validateElementTree({ type: "container", children });
    expect(codes(result.warnings)).toContain("TOO_MANY_CHILDREN");
    expect(result.valid).toBe(true);
  });

  it("NESTED_LANDMARK warning for a landmark inside another landmark", () => {
    const result = validateElementTree({
      type: "header",
      children: [{ type: "nav" }],
    });
    expect(codes(result.warnings)).toContain("NESTED_LANDMARK");
    expect(result.statistics.landmarkCount).toBe(2);
  });

  it("UNIQUE_LANDMARK info for shouldBeUnique elements (header/footer)", () => {
    const result = validateElementTree({ type: "header" });
    expect(codes(result.info)).toContain("UNIQUE_LANDMARK");
  });

  it("checkAccessibility: false suppresses a11y issues", () => {
    const result = validateElementTree(
      { type: "header", children: [{ type: "nav" }] },
      undefined,
      0,
      [],
      [],
      { checkAccessibility: false }
    );
    expect(codes(result.warnings)).not.toContain("NESTED_LANDMARK");
    expect(codes(result.info)).not.toContain("UNIQUE_LANDMARK");
  });

  it("counts empty containers in statistics", () => {
    const result = validateElementTree({
      type: "container",
      children: [{ type: "container" }, { type: "text" }],
    });
    expect(result.statistics.emptyContainers).toBe(1);
  });
});

describe("validateElementTree — strictMode", () => {
  it("flags heading > container only in strict mode", () => {
    const tree: TreeNode = { type: "heading", children: [{ type: "container" }] };

    expect(validateElementTree(tree).valid).toBe(true);
    const strict = validateElementTree(tree, undefined, 0, [], [], { strictMode: true });
    expect(codes(strict.errors)).toContain("INVALID_NESTING");
  });
});

// BUG (audit): validateAccessibility does `ELEMENT_RULES[element.type]` with
// no null guard, then dereferences `rule.isLandmark`. An unknown element type
// (e.g. stale project JSON after a type rename) makes validateElementTree
// THROW a TypeError instead of reporting a validation error. Pin the fix with:
//   expect(() => validateElementTree({ type: "bogus" as ElementType })).not.toThrow()
it.todo("BUG: validateAccessibility throws TypeError on unknown element type (no null guard on ELEMENT_RULES lookup)");

describe("isValidNesting — fast path", () => {
  it("accepts a valid tree and rejects a bad root/parent pair", () => {
    expect(isValidNesting({ type: "text" }, "container")).toBe(true);
    expect(isValidNesting({ type: "section" }, "text")).toBe(false);
  });

  it("rejects children under a void element and recurses into subtrees", () => {
    expect(isValidNesting({ type: "image", children: [{ type: "text" }] } as TreeNode)).toBe(false);
    expect(
      isValidNesting({
        type: "container",
        children: [{ type: "form", children: [{ type: "form" }] }],
      })
    ).toBe(false);
  });
});

describe("valid children/targets caches", () => {
  it("getValidChildren returns [] for leaf types and a cached array otherwise", () => {
    expect(getValidChildren("image")).toEqual([]);

    const first = getValidChildren("container");
    expect(first.length).toBeGreaterThan(0);
    expect(getValidChildren("container")).toBe(first); // cache hit → same ref

    clearNestingCaches();
    const fresh = getValidChildren("container");
    expect(fresh).not.toBe(first); // cache cleared → recomputed
    expect(fresh).toEqual(first); // ...with identical content
  });

  it("getValidDropTargets lists parents that accept the type", () => {
    const targets = getValidDropTargets("heading");
    expect(targets).toContain("container");
    expect(targets).toContain("section");
    expect(targets).not.toContain("image");
  });
});
