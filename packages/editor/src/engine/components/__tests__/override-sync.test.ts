import { describe, it, expect } from "vitest";
import { applyOverridesToTree } from "../ComponentInstance";
import type { ElementData } from "../../../shared/types";
import type { Patch } from "../../utils/JsonPatch";

/**
 * F1a regression suite — the component override-survival fix.
 *
 * Before the fix, syncInstance re-cloned the master with fresh element IDs and
 * carried instance.overrides via spread but never re-applied them, so every
 * manual customization reverted on master edit. These tests prove the canonical
 * position-path overrides re-apply correctly onto a freshly-cloned tree (new IDs),
 * across all override types, and that orphaned overrides drop loudly (not silently).
 */

// A master shaped like a real instance tree. IDs are intentionally "fresh-clone"
// style (el-*) to prove addressing is by POSITION, never by ID.
function makeMaster(): ElementData {
  return {
    id: "el-new-root",
    type: "container",
    styles: { color: "#000" },
    children: [
      {
        id: "el-new-c0",
        type: "text",
        content: "master text",
        traits: [{ name: "level", type: "select", value: "h2" }],
      },
      {
        id: "el-new-c1",
        type: "container",
        children: [
          { id: "el-new-c10", type: "link", attributes: { href: "/master" } },
        ],
      },
    ],
  } as ElementData;
}

describe("applyOverridesToTree (F1a override survival)", () => {
  it("re-applies a STYLE override on the root (survives re-clone by position)", () => {
    const tree = makeMaster();
    const overrides: Patch = [{ op: "replace", path: "#/style/color", value: "#2D6DFF" }];
    const { applied, dropped } = applyOverridesToTree(tree, overrides);
    expect(applied).toBe(1);
    expect(dropped).toBe(0);
    expect(tree.styles?.color).toBe("#2D6DFF");
  });

  it("re-applies a CONTENT override on a nested child", () => {
    const tree = makeMaster();
    const overrides: Patch = [{ op: "replace", path: "#/children[0]/content/", value: "my text" }];
    applyOverridesToTree(tree, overrides);
    expect(tree.children?.[0].content).toBe("my text");
    // master sibling untouched
    expect(tree.children?.[1].children?.[0].attributes?.href).toBe("/master");
  });

  it("re-applies an ATTRIBUTE override on a deeply nested element", () => {
    const tree = makeMaster();
    const overrides: Patch = [
      { op: "replace", path: "#/children[1].children[0]/attribute/href", value: "/custom" },
    ];
    applyOverridesToTree(tree, overrides);
    expect(tree.children?.[1].children?.[0].attributes?.href).toBe("/custom");
  });

  it("re-applies a TRAIT override by trait name", () => {
    const tree = makeMaster();
    const overrides: Patch = [{ op: "replace", path: "#/children[0]/trait/level", value: "h1" }];
    applyOverridesToTree(tree, overrides);
    expect(tree.children?.[0].traits?.find((t) => t.name === "level")?.value).toBe("h1");
  });

  it("applies multiple mixed-type overrides in one pass", () => {
    const tree = makeMaster();
    const overrides: Patch = [
      { op: "replace", path: "#/style/color", value: "#fff" },
      { op: "replace", path: "#/children[0]/content/", value: "hi" },
      { op: "replace", path: "#/children[1].children[0]/attribute/href", value: "/x" },
    ];
    const { applied, dropped } = applyOverridesToTree(tree, overrides);
    expect(applied).toBe(3);
    expect(dropped).toBe(0);
    expect(tree.styles?.color).toBe("#fff");
    expect(tree.children?.[0].content).toBe("hi");
    expect(tree.children?.[1].children?.[0].attributes?.href).toBe("/x");
  });

  it("DROPS an orphaned override (master element removed) loudly, never silently", () => {
    const tree = makeMaster();
    // children[5] does not exist — simulates a master that deleted an element
    const overrides: Patch = [
      { op: "replace", path: "#/children[5]/content/", value: "gone" },
      { op: "replace", path: "#/style/color", value: "#abc" },
    ];
    const { applied, dropped } = applyOverridesToTree(tree, overrides);
    expect(dropped).toBe(1);
    expect(applied).toBe(1);
    expect(tree.styles?.color).toBe("#abc"); // the valid one still landed
  });

  it("drops a malformed / non-canonical path instead of throwing", () => {
    const tree = makeMaster();
    const overrides: Patch = [
      { op: "replace", path: "/elements/el-old-id/styles/color", value: "x" }, // legacy Scheme-B
    ];
    const { applied, dropped } = applyOverridesToTree(tree, overrides);
    expect(applied).toBe(0);
    expect(dropped).toBe(1);
  });
});
