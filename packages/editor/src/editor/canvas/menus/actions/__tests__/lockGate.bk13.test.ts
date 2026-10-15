/**
 * BK-13: the lock gate on the structural doors that skipped it — paste into a
 * locked element, Ungroup of a locked group, and multi-select align (which
 * also read and wrote base styles on every device).
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import type { Composer } from "@/engine/Composer";
import { createTestComposer, installEngineBrowserStubs, removeEngineBrowserStubs } from "@/engine/__tests__/test-utils/realComposer";
import { AlignmentHandler } from "@/engine/canvas/AlignmentHandler";
import { EVENTS } from "@/shared/constants/events";
import { standaloneActions } from "@/editor/canvas/menus/actions/standaloneActions";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);

let c: Composer;
let root: string;
const add = (type: string, parent = root) => {
  const el = c.elements.createElement(type as never, {} as never);
  c.elements.addElement(el, parent);
  return c.elements.getElement(el.getId())!;
};

beforeEach(() => {
  c = createTestComposer();
  root = c.elements.createPage("Home").root.id;
});

describe("multi-select align (BK-13)", () => {
  it("a locked member anchors but does not move; one locked signal", () => {
    const a = add("container");
    const b = add("container");
    a.setStyles({ position: "absolute", left: "40px", width: "100px" });
    b.setStyles({ position: "absolute", left: "200px", width: "100px" });
    b.setLocked(true);
    const skipped = vi.fn();
    c.on(EVENTS.LOCKED_ELEMENTS_SKIPPED, skipped);
    new AlignmentHandler(c).alignHorizontal([a.getId(), b.getId()], "right");
    expect(a.getStyles().left).toBe("200px");
    expect(b.getStyles().left).toBe("200px");
    expect(skipped).toHaveBeenCalledTimes(1);
  });

  it("aligns at the device on screen — a Tablet align leaves Desktop alone", () => {
    const a = add("container");
    const b = add("container");
    a.setStyles({ position: "absolute", left: "40px", width: "100px" });
    b.setStyles({ position: "absolute", left: "200px", width: "100px" });
    c.setDevice("tablet");
    new AlignmentHandler(c).alignHorizontal([a.getId(), b.getId()], "left");
    expect(b.getStyles().left).toBe("200px");
    expect(c.styles.getBreakpointStyle(b.getId(), "tablet").left).toBe("40px");
  });
});

describe("paste into a locked element (BK-13)", () => {
  it("is refused with one locked signal; nothing lands inside it", () => {
    const box = add("container");
    const text = add("text", box.getId());
    c.selection.select(text);
    c.commands.run("copy");
    box.setLocked(true);
    c.selection.select(box);
    const skipped = vi.fn();
    c.on(EVENTS.LOCKED_ELEMENTS_SKIPPED, skipped);
    const before = box.getChildren().length;
    c.commands.run("paste");
    expect(box.getChildren().length).toBe(before);
    expect(skipped).toHaveBeenCalledTimes(1);
  });
});

describe("Ungroup (BK-13)", () => {
  it("is disabled on a locked group, with a reason, and its handler refuses", () => {
    const group = add("container");
    add("text", group.getId());
    group.setLocked(true);
    const ungroup = standaloneActions.find((a) => a.id === "ungroup-elements")!;
    const ctx = { composer: c, element: group } as never;
    expect(ungroup.isEnabled!(ctx)).toBe(false);
    expect(ungroup.disabledReason!(ctx)).toMatch(/locked/);
    ungroup.handler!(ctx);
    expect(c.elements.getElement(group.getId())).toBeTruthy();
  });
});
