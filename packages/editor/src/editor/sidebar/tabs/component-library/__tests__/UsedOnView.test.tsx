/**
 * 2L9 217:42647 (B6-K21): where a master is used — one row per top-level
 * section that holds instances, each with an exact Locate.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import * as React from "react";
import type { Composer } from "@/engine";
import type { ComponentDefinition } from "@/shared/types/components";
import { UsedOnView, placeLabel, usedOnPlaces } from "../UsedOnView";

type Node = { id: string; parent: Node | null; children: Node[]; name?: string; type?: string };
const node = (id: string, parent: Node | null, name?: string): Node => {
  const n: Node = { id, parent, children: [], name, type: "section" };
  parent?.children.push(n);
  return n;
};
const wrap = (n: Node | null): unknown =>
  n && {
    getId: () => n.id,
    getParent: () => wrap(n.parent),
    getChildren: () => n.children.map(wrap),
    getType: () => n.type,
    getCustomData: (k: string) => (k === "layerName" ? n.name : undefined),
  };

function makeComposer() {
  const home = node("r-home", null);
  node("s-nav", home, "Nav");
  const hero = node("s-hero", home, "Hero");
  const blog = node("r-blog", null);
  const post = node("s-post", blog, "Post header");
  const els: Record<string, Node> = {
    e1: node("e1", hero),
    e2: node("e2", post),
    e3: node("e3", post),
  };
  const all: Record<string, Node> = { ...els, "s-hero": hero, "s-post": post, "r-home": home, "r-blog": blog };
  const setActivePage = vi.fn();
  const select = vi.fn();
  const composer = {
    selection: { select },
    elements: {
      getAllPages: () => [
        { id: "home", name: "Home", root: { id: "r-home" } },
        { id: "blog", name: "Blog post", root: { id: "r-blog" } },
      ],
      getElement: (id: string) => wrap(all[id] ?? null),
      getActivePage: () => ({ id: "home" }),
      setActivePage,
    },
    components: { getInstancesOfComponent: () => [{ elementId: "e1" }, { elementId: "e2" }, { elementId: "e3" }] },
  } as unknown as Composer;
  return { composer, setActivePage, select };
}

const component = { id: "c1", name: "Hero card" } as ComponentDefinition;

describe("UsedOnView — 2L9 217:42647 (B6-K21)", () => {
  it("groups instances by top-level section: Section N · name, or name (N instances)", () => {
    const { composer } = makeComposer();
    expect(usedOnPlaces(composer, "c1").map((p) => [p.page.name, placeLabel(p), p.count])).toEqual([
      ["Home", "Section 2 · Hero", 1],
      ["Blog post", "Post header (2 instances)", 2],
    ]);
  });

  it("titles the view, lists each place and Locate selects that instance on its page", () => {
    const { composer, setActivePage, select } = makeComposer();
    const onBack = vi.fn();
    render(<UsedOnView component={component} composer={composer} onBack={onBack} />);
    expect(screen.getByTestId("comp-usedon-title").textContent).toBe("Hero card is used in 3 places on 2 pages");
    const rows = screen.getAllByText("Locate ›");
    expect(rows).toHaveLength(2);
    fireEvent.click(rows[1]);
    expect(setActivePage).toHaveBeenCalledWith("blog");
    expect((select.mock.calls[0][0] as { getId: () => string }).getId()).toBe("e2");
    fireEvent.click(screen.getByTestId("comp-usedon-back"));
    expect(onBack).toHaveBeenCalled();
    expect(screen.getByTestId("comp-usedon-back").textContent).toBe("‹ Back to Hero card");
  });
});
