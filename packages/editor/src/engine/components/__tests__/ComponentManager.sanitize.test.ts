/**
 * S-1 (review fix 1): component masters reach the canvas without passing
 * importProject — adopted from the workspace library (shared, and rows written
 * before the server sanitized them) or loaded from local storage — and their
 * rich-text `content` is emitted raw by toHTML. Masters are sanitized where
 * they enter the ComponentManager, the same boundary importProject has.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import type { ComponentDefinition } from "../../../shared/types/components";
import { makeEngine, emitsOf, type FakeComposer } from "../../elements/__tests__/harness";
import { EVENTS } from "../../../shared/constants/events";
import type { Composer } from "../../Composer";

const stored: ComponentDefinition[] = [];
vi.mock("../ComponentStorage", () => ({
  saveComponent: vi.fn().mockResolvedValue(undefined),
  loadComponents: vi.fn(async () => stored),
  deleteComponent: vi.fn().mockResolvedValue(undefined),
  isStorageAvailable: () => true,
}));

import { ComponentManager } from "../ComponentManager";

const hostile = (id: string): ComponentDefinition => ({
  id,
  name: "Card",
  masterTree: {
    id: "m",
    type: "container",
    tagName: "div",
    children: [
      { id: "t", type: "text", tagName: "p", content: '<img src=x onerror="alert(1)">Hi', children: [] },
      { id: "f", type: "container", tagName: "iframe", attributes: { srcdoc: "<script>x</script>" }, children: [] },
    ],
  } as never,
  createdAt: 1,
  updatedAt: 1,
  version: 1,
});

function makeStack() {
  const { composer, manager } = makeEngine();
  const mgr = new ComponentManager(composer as unknown as Composer);
  composer.components = mgr as unknown as FakeComposer["components"];
  const page = manager.createPage("Home");
  return { composer, manager, mgr, page };
}

async function placedHtml(mgr: ComponentManager, manager: ReturnType<typeof makeEngine>["manager"], rootId: string, id: string) {
  await mgr.instantiateComponent(id, rootId);
  return manager.toHTML();
}

describe("component masters are sanitized on the way in", () => {
  it("a master adopted from the library renders no handler, srcdoc or iframe when placed", async () => {
    const { manager, mgr, page } = makeStack();
    await mgr.adoptLibraryComponent(hostile("lib-1"));
    const html = await placedHtml(mgr, manager, page.root.id, "lib-1");
    expect(html).toContain("Hi");
    expect(html).not.toMatch(/onerror|srcdoc|<iframe/i);
  });

  it("a master loaded from local storage renders no handler when placed", async () => {
    stored.splice(0, stored.length, hostile("local-1"));
    const { manager, mgr, page } = makeStack();
    await vi.waitFor(() => expect(mgr.getComponent("local-1")).toBeDefined());
    const html = await placedHtml(mgr, manager, page.root.id, "local-1");
    expect(html).toContain("Hi");
    expect(html).not.toMatch(/onerror|srcdoc|<iframe/i);
  });
});

describe("a malformed master does not break the library (S-1 review round 2)", () => {
  const malformed = (id: string, masterTree: unknown): ComponentDefinition =>
    ({ ...hostile(id), masterTree }) as unknown as ComponentDefinition;

  it("skips rows without a usable master tree and still loads and announces the good ones", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const nestedBad = hostile("nested-bad");
    (nestedBad.masterTree.children as unknown[]).push({ id: "x", type: "container", children: "oops", attributes: "nope" });
    stored.splice(
      0,
      stored.length,
      malformed("null-tree", null),
      malformed("array-tree", []),
      malformed("string-children", { id: "m", type: "container", children: "oops" }),
      nestedBad,
      hostile("good")
    );
    const { composer, mgr } = makeStack();
    await vi.waitFor(() => expect(emitsOf(composer, EVENTS.COMPONENT_LIST_UPDATED)).toHaveLength(1));
    expect(mgr.getAllComponents().map((c) => c.id).sort()).toEqual(["good", "nested-bad"]);
    expect(warn).toHaveBeenCalledTimes(3);
    warn.mockRestore();
  });

  it("refuses to adopt a library master without a usable tree", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    stored.splice(0, stored.length);
    const { mgr } = makeStack();
    await expect(mgr.adoptLibraryComponent(malformed("lib-bad", null))).rejects.toThrow();
    expect(mgr.getComponent("lib-bad")).toBeUndefined();
    warn.mockRestore();
  });
});
