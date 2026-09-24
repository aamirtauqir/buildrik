/**
 * G2-118: component scope (This site / This page, board 6971:77663) and
 * bringing a workspace-library master onto this site (FROM LIBRARY, 4418:99857).
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { EVENTS } from "../../../shared/constants/events";
import type { ComponentDefinition } from "../../../shared/types/components";
import { makeEngine, emitsOf, type FakeComposer } from "../../elements/__tests__/harness";
import type { Composer } from "../../Composer";

const saveComponent = vi.fn().mockResolvedValue(undefined);
vi.mock("../ComponentStorage", () => ({
  saveComponent: (...a: unknown[]) => saveComponent(...a),
  loadComponents: vi.fn().mockResolvedValue([]),
  deleteComponent: vi.fn().mockResolvedValue(undefined),
  isStorageAvailable: () => false,
}));

import { ComponentManager, inPageScope } from "../ComponentManager";

function makeStack() {
  const { composer, manager } = makeEngine();
  const mgr = new ComponentManager(composer as unknown as Composer);
  composer.components = mgr as unknown as FakeComposer["components"];
  const page = manager.createPage("Home");
  return { composer, manager, mgr, page };
}

const def = (over: Partial<ComponentDefinition> = {}): ComponentDefinition => ({
  id: "cmp-shared",
  name: "Price row",
  masterTree: { id: "m", type: "container", children: [] } as never,
  createdAt: 1,
  updatedAt: 1,
  version: 3,
  ...over,
});

beforeEach(() => saveComponent.mockClear());

describe("scope", () => {
  it("a site-scoped master is offered on every page; a page-scoped one only on its page", () => {
    expect(inPageScope(def(), "p1")).toBe(true);
    expect(inPageScope(def({ pageId: null }), undefined)).toBe(true);
    expect(inPageScope(def({ pageId: "p1" }), "p1")).toBe(true);
    expect(inPageScope(def({ pageId: "p1" }), "p2")).toBe(false);
  });

  it("createComponent stores the page scope when asked, and none by default", async () => {
    const { mgr, manager, page } = makeStack();
    const el = manager.createElement("container", {});
    manager.addElement(el, page.root.id);
    const scoped = await mgr.createComponent("Hero", el.getId(), { pageId: page.id });
    const site = await mgr.createComponent("Card", el.getId());
    expect(scoped?.pageId).toBe(page.id);
    expect(site && "pageId" in site).toBe(false);
  });
});

describe("adoptLibraryComponent", () => {
  it("keeps the shared id (that is the link), drops any page scope, saves and announces it", async () => {
    const { mgr, composer } = makeStack();
    const adopted = await mgr.adoptLibraryComponent(def({ pageId: "elsewhere" }));
    expect(adopted.id).toBe("cmp-shared");
    expect(adopted.pageId).toBeNull();
    expect(mgr.getComponent("cmp-shared")).toBe(adopted);
    expect(saveComponent).toHaveBeenCalledTimes(1);
    expect(emitsOf(composer, EVENTS.COMPONENT_CREATED)).toHaveLength(1);
  });

  it("a master already on this site is returned as is — no second save or announcement", async () => {
    const { mgr, composer } = makeStack();
    const first = await mgr.adoptLibraryComponent(def());
    const again = await mgr.adoptLibraryComponent(def({ name: "Renamed elsewhere" }));
    expect(again).toBe(first);
    expect(saveComponent).toHaveBeenCalledTimes(1);
    expect(emitsOf(composer, EVENTS.COMPONENT_CREATED)).toHaveLength(1);
  });
});
