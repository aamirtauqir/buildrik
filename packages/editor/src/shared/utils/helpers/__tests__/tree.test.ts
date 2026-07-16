/**
 * helpers/tree — getChildren / forEachDescendant / getAllDescendants over a
 * duck-typed TreeNode (objects exposing getChildren()).
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { getChildren, forEachDescendant, getAllDescendants } from "../tree";

class Node {
  private kids: Node[] = [];
  constructor(public id: string) {}
  add(child: Node): Node {
    this.kids.push(child);
    return this;
  }
  getChildren(): Node[] {
    return this.kids;
  }
}

/** root → [a → [a1], b] */
function build(): Node {
  const root = new Node("root");
  const a = new Node("a");
  a.add(new Node("a1"));
  root.add(a).add(new Node("b"));
  return root;
}

describe("getChildren", () => {
  it("returns the children array", () => {
    expect(getChildren(build()).map((c) => c.id)).toEqual(["a", "b"]);
  });

  it("returns [] when getChildren is absent", () => {
    const leaf = { id: "x" } as unknown as Node;
    expect(getChildren(leaf)).toEqual([]);
  });
});

describe("forEachDescendant", () => {
  it("visits every descendant depth-first with correct depth", () => {
    const visited: Array<[string, number]> = [];
    forEachDescendant(build(), (child, depth) => visited.push([child.id, depth]));
    expect(visited).toEqual([
      ["a", 0],
      ["a1", 1],
      ["b", 0],
    ]);
  });

  it("does nothing for a childless root", () => {
    const spy: string[] = [];
    forEachDescendant(new Node("solo"), (c) => spy.push(c.id));
    expect(spy).toEqual([]);
  });
});

describe("getAllDescendants", () => {
  it("flattens all descendants (excluding the root)", () => {
    expect(getAllDescendants(build()).map((n) => n.id)).toEqual(["a", "a1", "b"]);
  });
});
