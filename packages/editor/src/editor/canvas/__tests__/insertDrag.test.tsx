/**
 * Board 4418:100890 — the Add drag's landing, named from real layers.
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { Composer } from "@/engine";
import { EVENTS } from "@/shared/constants/events";
import { describeInsertTarget, useInsertDrag, announceInsertDrag, announceInsertTarget } from "../insertDrag";

type Node = { id: string; type: string; name?: string; kids: Node[]; parent: Node | null };
const mk = (id: string, type: string, name?: string): Node => ({ id, type, name, kids: [], parent: null });
const add = (p: Node, c: Node) => { c.parent = p; p.kids.push(c); return c; };
const wrap = (n: Node | null): unknown =>
  n && {
    getId: () => n.id,
    getType: () => n.type,
    getParent: () => wrap(n.parent),
    getChildren: () => n.kids.map(wrap),
    getCustomData: (k: string) => (k === "layerName" ? n.name : undefined),
  };

function makeComposer() {
  const root = mk("root", "container");
  const hero = add(root, mk("hero", "section", "Hero"));
  const content = add(hero, mk("content", "container", "Content"));
  add(content, mk("h", "heading", "Heading"));
  const sub = add(content, mk("sub", "text", "Subtitle"));
  const all: Record<string, Node> = { root, hero, content, sub };
  const handlers = new Map<string, Set<(p: unknown) => void>>();
  const composer = {
    elements: { getElement: (id: string) => wrap(all[id] ?? null), getActivePage: () => ({ name: "Home" }) },
    on: (e: string, h: (p: unknown) => void) => { if (!handlers.has(e)) handlers.set(e, new Set()); handlers.get(e)!.add(h); },
    off: (e: string, h: (p: unknown) => void) => handlers.get(e)?.delete(h),
    emit: (e: string, p: unknown) => handlers.get(e)?.forEach((h) => h(p)),
  } as unknown as Composer;
  return composer;
}

describe("describeInsertTarget", () => {
  it("inside a container: its path, its name, after its last child", () => {
    expect(describeInsertTarget(makeComposer(), "content", "inside")).toEqual({ path: "Home › Hero › Content", into: "Content", after: "Subtitle" });
  });
  it("after an element: its parent receives it, after that element", () => {
    expect(describeInsertTarget(makeComposer(), "sub", "after")).toEqual({ path: "Home › Hero › Content", into: "Content", after: "Subtitle" });
  });
  it("before the first child: after nothing", () => {
    const c = makeComposer();
    expect(describeInsertTarget(c, "sub", "before")?.after).toBe("Heading");
  });
});

describe("useInsertDrag", () => {
  it("follows the drawer's label and the canvas's target; ending the drag clears both", () => {
    const composer = makeComposer();
    const { result } = renderHook(() => useInsertDrag(composer));
    act(() => announceInsertDrag(composer, "Heading"));
    act(() => announceInsertTarget(composer, { path: "Home › Hero", into: "Hero", after: null }));
    expect(result.current).toEqual({ label: "Heading", target: { path: "Home › Hero", into: "Hero", after: null } });
    act(() => composer.emit(EVENTS.UI_INSERT_DRAG, { label: null }));
    expect(result.current).toEqual({ label: null, target: null });
  });
});
