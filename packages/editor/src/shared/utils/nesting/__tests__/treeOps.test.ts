/**
 * nesting/treeOps — traversal, ancestry, clone/map/filter/flatten, analysis.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import type { ElementType } from "../../../types";
import {
  findElementById,
  findElement,
  findAllElements,
  getAncestryPath,
  getParentElement,
  getSiblings,
  getElementDepth,
  findCommonAncestor,
  cloneTree,
  mapTree,
  filterTree,
  flattenTree,
  countElements,
  analyzeTree,
} from "../treeOps";

type Node = { id?: string; type: ElementType; children?: Node[]; level?: number };

/**
 *   root(section)
 *   ├─ a(container)
 *   │  ├─ a1(text)
 *   │  └─ a2(heading)
 *   └─ b(nav)
 */
const tree = (): Node => ({
  id: "root",
  type: "section",
  children: [
    {
      id: "a",
      type: "container",
      children: [
        { id: "a1", type: "text" },
        { id: "a2", type: "heading", level: 3 },
      ],
    },
    { id: "b", type: "nav" },
  ],
});

describe("findElementById / findElement / findAllElements", () => {
  it("finds a nested element by id", () => {
    expect(findElementById(tree(), "a2")?.type).toBe("heading");
  });

  it("returns null when the id is absent", () => {
    expect(findElementById(tree(), "zzz")).toBeNull();
  });

  it("finds the first element matching a predicate", () => {
    expect(findElement(tree(), (e) => e.type === "text")?.id).toBe("a1");
  });

  it("returns null when no element matches the predicate", () => {
    expect(findElement(tree(), (e) => e.type === "button")).toBeNull();
  });

  it("collects every element matching a predicate", () => {
    const containers = findAllElements(tree(), (e) => e.type === "container");
    expect(containers.map((c) => c.id)).toEqual(["a"]);
    const all = findAllElements(tree(), () => true);
    expect(all).toHaveLength(5);
  });
});

describe("ancestry helpers", () => {
  it("getAncestryPath returns root→target chain", () => {
    expect(getAncestryPath(tree(), "a1")?.map((n) => n.id)).toEqual(["root", "a", "a1"]);
  });

  it("getAncestryPath returns null for a missing target", () => {
    expect(getAncestryPath(tree(), "zzz")).toBeNull();
  });

  it("getParentElement returns the immediate parent", () => {
    expect(getParentElement(tree(), "a1")?.id).toBe("a");
  });

  it("getParentElement returns null for the root", () => {
    expect(getParentElement(tree(), "root")).toBeNull();
  });

  it("getSiblings excludes the target itself", () => {
    expect(getSiblings(tree(), "a1").map((n) => n.id)).toEqual(["a2"]);
  });

  it("getSiblings returns [] for the root", () => {
    expect(getSiblings(tree(), "root")).toEqual([]);
  });

  it("getElementDepth counts edges from the root", () => {
    expect(getElementDepth(tree(), "root")).toBe(0);
    expect(getElementDepth(tree(), "a")).toBe(1);
    expect(getElementDepth(tree(), "a1")).toBe(2);
    expect(getElementDepth(tree(), "zzz")).toBe(-1);
  });

  it("findCommonAncestor returns the deepest shared node", () => {
    expect(findCommonAncestor(tree(), "a1", "a2")?.id).toBe("a");
    expect(findCommonAncestor(tree(), "a1", "b")?.id).toBe("root");
  });

  it("findCommonAncestor returns null when either id is missing", () => {
    expect(findCommonAncestor(tree(), "a1", "zzz")).toBeNull();
  });
});

describe("cloneTree", () => {
  it("deep-clones, leaving the original untouched", () => {
    const original = tree();
    const clone = cloneTree(original);
    clone.children![0].children![0].type = "button";
    expect(original.children![0].children![0].type).toBe("text");
  });

  it("re-ids every node when an id generator is supplied", () => {
    let n = 0;
    const clone = cloneTree(tree(), () => `new-${n++}`);
    const ids = flattenTree(clone).map((f) => f.element.id);
    expect(ids.every((id) => id?.startsWith("new-"))).toBe(true);
  });
});

describe("mapTree / filterTree / flattenTree / countElements", () => {
  it("mapTree transforms each node and tracks depth", () => {
    type Mapped = { type: ElementType; depth: number; children?: Mapped[] };
    const mapped = mapTree<Node, Mapped>(
      tree(),
      (el, depth) => ({ type: el.type, depth })
    );
    expect(mapped.depth).toBe(0);
    expect(mapped.children![0].depth).toBe(1);
  });

  it("filterTree drops non-matching subtrees but keeps a matching root", () => {
    // keep everything except the 'nav' node
    const filtered = filterTree(tree(), (e) => e.type !== "nav");
    expect(filtered).not.toBeNull();
    expect(filtered!.children!.map((c) => c.id)).toEqual(["a"]);
  });

  it("filterTree returns null when the root itself fails the predicate", () => {
    expect(filterTree(tree(), (e) => e.type === "button")).toBeNull();
  });

  it("flattenTree yields every node with its depth", () => {
    const flat = flattenTree(tree());
    expect(flat).toHaveLength(5);
    expect(flat.find((f) => f.element.id === "a1")?.depth).toBe(2);
  });

  it("countElements counts all, or only matches with a predicate", () => {
    expect(countElements(tree())).toBe(5);
    expect(countElements(tree(), (e) => e.type === "container")).toBe(1);
  });
});

describe("analyzeTree", () => {
  it("produces type/category counts, landmarks, headings and recommendations", () => {
    const analysis = analyzeTree(tree());
    expect(analysis.totalElements).toBe(5);
    expect(analysis.maxDepth).toBe(2);
    expect(analysis.elementTypeCounts.container).toBe(1);
    expect(analysis.landmarkElements).toContain("section");
    expect(analysis.landmarkElements).toContain("nav");
    expect(analysis.headingElements).toHaveLength(1);
    // an empty 'nav' container counts toward emptyContainers recommendation
    expect(Array.isArray(analysis.recommendations)).toBe(true);
  });

  it("recommends adding a nav landmark when none exists", () => {
    const noNav: Node = { id: "r", type: "container", children: [{ id: "t", type: "text" }] };
    const analysis = analyzeTree(noNav);
    expect(analysis.recommendations.some((r) => /navigation landmark/i.test(r))).toBe(true);
  });

  it("flags multiple header landmarks", () => {
    const twoHeaders: Node = {
      id: "r",
      type: "container",
      children: [
        { id: "h1", type: "header" },
        { id: "h2", type: "header" },
        { id: "n", type: "nav" },
      ],
    };
    const analysis = analyzeTree(twoHeaders);
    expect(analysis.recommendations.some((r) => /header/i.test(r))).toBe(true);
  });
});
