// @vitest-environment jsdom
/**
 * design-2l9 B-12 — Detach is one step on the document history.
 *
 * Board 241:19230 (IC06) applies Detach directly and offers "{name} detached ·
 * Undo". So ⌘Z right after a detach must give the instance back: the element's
 * `componentInstance` data AND the instance map entry (instance count, sync,
 * overrides), not just the element tree.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { Composer } from "@/engine/Composer";
import { createTestComposer, installEngineBrowserStubs, removeEngineBrowserStubs } from "@/engine/__tests__/test-utils/realComposer";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);

async function instance(): Promise<{ c: Composer; id: string; componentId: string }> {
  const c = createTestComposer();
  const root = c.elements.createPage("Home").root.id;
  const banner = c.elements.createElement("container" as never, {} as never);
  c.elements.addElement(banner, root);
  const comp = (await c.components.createComponent("Reservation banner", banner.getId()))!;
  const id = (await c.components.instantiateComponent(comp.id, root))!;
  c.elements.getElement(id)!.setStyle("padding-top", "32px");
  c.history.flushPending();
  return { c, id, componentId: comp.id };
}

const linked = (c: Composer, id: string) => Boolean(c.elements.getElement(id)?.getData().data?.componentInstance);

describe("detachInstance › history (B-12)", () => {
  it("records the detach as one undo step at once", async () => {
    const { c, id } = await instance();
    const before = c.history.getUndoCount();
    expect(await c.components.detachInstance(id)).toBe(true);
    expect(c.history.getUndoCount()).toBe(before + 1);
    expect(c.history.getHistoryStack()[0].label).toBe("Detach instance");
    expect(c.components.getInstance(id)).toBeUndefined();
    expect(linked(c, id)).toBe(false);
  });

  it("⌘Z restores the instance map entry and the element's componentInstance, with its overrides", async () => {
    const { c, id, componentId } = await instance();
    const overrides = c.components.getInstance(id)!.overrides.length;
    await c.components.detachInstance(id);

    expect(c.history.undo()).toBe(true);

    const back = c.components.getInstance(id);
    expect(back?.componentId).toBe(componentId);
    expect(back?.isDetached).toBe(false);
    expect(back?.overrides.length).toBe(overrides);
    expect(linked(c, id)).toBe(true);
    expect(c.components.getInstancesOfComponent(componentId).map((i) => i.elementId)).toContain(id);

    expect(c.history.redo()).toBe(true);
    expect(c.components.getInstance(id)).toBeUndefined();
    expect(linked(c, id)).toBe(false);
  });

  it("an edit just before the detach stays its own step", async () => {
    const { c, id } = await instance();
    c.elements.getElement(id)!.setStyle("padding-bottom", "40px");
    await c.components.detachInstance(id);
    c.history.undo();
    expect(c.components.getInstance(id)).toBeDefined();
    expect(c.elements.getElement(id)!.getStyles()["padding-bottom"]).toBe("40px");
  });

  it("refused under an edit lock: still linked, nothing recorded", async () => {
    const { c, id } = await instance();
    const before = c.history.getUndoCount();
    c.setEditLock("view", true);
    expect(await c.components.detachInstance(id)).toBe(false);
    c.setEditLock("view", false);
    c.history.flushPending();
    expect(c.history.getUndoCount()).toBe(before);
    expect(c.components.getInstance(id)).toBeDefined();
  });
});
