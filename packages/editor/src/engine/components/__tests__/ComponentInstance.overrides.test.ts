/**
 * S-1: overrides come from the stored project, and
 * applyOverridesToTree is the one place both sync paths write them into a
 * tree that is then pasted and rendered. Unsafe ones never land.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import type { ElementData } from "../../../shared/types";
import { applyOverridesToTree } from "../ComponentInstance";

const tree = (): ElementData =>
  ({
    id: "m",
    type: "container",
    tagName: "div",
    children: [
      { id: "t", type: "text", tagName: "p", content: "Hi" },
      { id: "l", type: "link", tagName: "a", attributes: { href: "/ok" } },
    ],
  }) as ElementData;

describe("applyOverridesToTree", () => {
  it("sanitizes content and refuses unsafe attributes, counting them as dropped", () => {
    const t = tree();
    const res = applyOverridesToTree(t, [
      { op: "replace", path: "#/children[0]/content/content", value: '<img src=x onerror="alert(1)">Owned' },
      { op: "replace", path: "#/children[1]/attribute/href", value: "javascript:alert(1)" },
      { op: "replace", path: "#/children[1]/attribute/x onerror=y", value: "1" },
      { op: "replace", path: "#/children[1]/attribute/title", value: "kept" },
      { op: "replace", path: "#/children[1]/attribute/rel", value: 42 },
    ]);
    expect(t.children?.[0].content).toContain("Owned");
    expect(t.children?.[0].content).not.toMatch(/onerror/i);
    expect(t.children?.[1].attributes).toEqual({ href: "/ok", title: "kept" });
    expect(res).toMatchObject({ applied: 2, dropped: 3 });
    expect(res.kept.map((o) => o.path)).toEqual(["#/children[0]/content/content", "#/children[1]/attribute/title"]);
  });
});
