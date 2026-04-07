import { describe, it, expect } from "vitest";
import type { LayerItem } from "../types";
import {
  flattenTree,
  findById,
  getAncestors,
  countDescendants,
  getDisplayName,
} from "./layerUtils";

const makeNode = (id: string, children: LayerItem[] = [], depth = 0): LayerItem => ({
  id,
  type: "container",
  tagName: "div",
  depth,
  children,
});

const tree: LayerItem[] = [
  makeNode(
    "root",
    [
      makeNode("section1", [makeNode("col1", [makeNode("btn1", [], 3)], 2)], 1),
      makeNode("section2", [], 1),
    ],
    0
  ),
];

describe("flattenTree", () => {
  it("returns all nodes in depth-first order", () => {
    const flat = flattenTree(tree);
    expect(flat.map((n) => n.id)).toEqual(["root", "section1", "col1", "btn1", "section2"]);
  });

  it("returns empty array for empty input", () => {
    expect(flattenTree([])).toEqual([]);
  });
});

describe("findById", () => {
  it("finds a deeply nested node", () => {
    expect(findById(tree, "btn1")?.id).toBe("btn1");
  });

  it("returns null when not found", () => {
    expect(findById(tree, "nonexistent")).toBeNull();
  });

  it("finds root node", () => {
    expect(findById(tree, "root")?.id).toBe("root");
  });
});

describe("getAncestors", () => {
  it("returns ancestors of a deeply nested node (excluding self)", () => {
    const ancestors = getAncestors(tree, "btn1");
    expect(ancestors.map((n) => n.id)).toEqual(["root", "section1", "col1"]);
  });

  it("returns empty array for root node", () => {
    expect(getAncestors(tree, "root")).toEqual([]);
  });

  it("returns empty array when node not found", () => {
    expect(getAncestors(tree, "ghost")).toEqual([]);
  });
});

describe("countDescendants", () => {
  it("counts all descendants recursively", () => {
    const root = findById(tree, "root")!;
    expect(countDescendants(root)).toBe(4); // section1, col1, btn1, section2
  });

  it("returns 0 for leaf node", () => {
    const leaf = findById(tree, "btn1")!;
    expect(countDescendants(leaf)).toBe(0);
  });
});

describe("getDisplayName", () => {
  it("returns custom name when available", () => {
    const names = new Map([["btn1", "Hero Button"]]);
    expect(getDisplayName("btn1", "button", names)).toBe("Hero Button");
  });

  it("returns capitalized type when no custom name", () => {
    expect(getDisplayName("btn1", "button", new Map())).toBe("Button");
  });

  it("handles unknown type gracefully", () => {
    const result = getDisplayName("x", "custom-widget", new Map());
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });
});
