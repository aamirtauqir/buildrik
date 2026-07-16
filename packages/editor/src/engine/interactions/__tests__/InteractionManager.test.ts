/**
 * InteractionManager.test.ts — CRUD on Element.data.data.interactions,
 * runtime start/stop delegation, toggle/duplicate/reorder, query helpers,
 * and the interaction:* event contract.
 *
 * @license BSD-3-Clause
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { EVENTS } from "../../../shared/constants/events";
import { InteractionManager } from "../InteractionManager";
import { InteractionRuntime } from "../InteractionRuntime";
import { DEFAULT_ANIMATION_CONFIG, type Interaction } from "../types";
import type { Composer } from "../../Composer";

vi.mock("../InteractionRuntime", () => ({
  // Regular function (not arrow) so `new InteractionRuntime()` works; the
  // returned object becomes the instance.
  InteractionRuntime: vi.fn(function InteractionRuntimeMock() {
    return { start: vi.fn(), stop: vi.fn() };
  }),
}));

interface StoredData {
  data?: { interactions?: Interaction[] };
}

function makeMockElement(interactions?: Interaction[]) {
  const data: StoredData = interactions ? { data: { interactions } } : {};
  return { data, getData: () => data };
}

function makeMockComposer() {
  return {
    emit: vi.fn(),
    markDirty: vi.fn(),
    elements: { getElement: vi.fn((_id: string) => null as unknown) },
  };
}

function makeInteraction(overrides: Partial<Interaction> = {}): Interaction {
  return {
    id: `int-fixture-${Math.random().toString(36).slice(2, 7)}`,
    trigger: "click",
    animation: { ...DEFAULT_ANIMATION_CONFIG },
    enabled: true,
    ...overrides,
  };
}

describe("InteractionManager", () => {
  let composer: ReturnType<typeof makeMockComposer>;
  let manager: InteractionManager;
  let element: ReturnType<typeof makeMockElement>;

  function wireElement(el: ReturnType<typeof makeMockElement>) {
    composer.elements.getElement.mockImplementation((id: string) =>
      id === "el-1" ? el : null,
    );
  }

  beforeEach(() => {
    vi.clearAllMocks();
    composer = makeMockComposer();
    manager = new InteractionManager(composer as unknown as Composer);
    element = makeMockElement();
    wireElement(element);
  });

  describe("runtime control", () => {
    it("is inactive until startRuntime()", () => {
      expect(manager.isRuntimeActive()).toBe(false);
    });

    it("startRuntime() creates one runtime, starts it with the root, and emits", () => {
      const root = document.createElement("div");
      manager.startRuntime(root);

      expect(InteractionRuntime).toHaveBeenCalledTimes(1);
      const instance = vi.mocked(InteractionRuntime).mock.results[0].value;
      expect(instance.start).toHaveBeenCalledWith(root);
      expect(composer.emit).toHaveBeenCalledWith(EVENTS.INTERACTIONS_RUNTIME_STARTED);
      expect(manager.isRuntimeActive()).toBe(true);
    });

    it("startRuntime() twice reuses the same runtime instance", () => {
      manager.startRuntime();
      manager.startRuntime();

      expect(InteractionRuntime).toHaveBeenCalledTimes(1);
      const instance = vi.mocked(InteractionRuntime).mock.results[0].value;
      expect(instance.start).toHaveBeenCalledTimes(2);
    });

    it("stopRuntime() stops the runtime and emits", () => {
      manager.startRuntime();
      manager.stopRuntime();

      const instance = vi.mocked(InteractionRuntime).mock.results[0].value;
      expect(instance.stop).toHaveBeenCalledTimes(1);
      expect(composer.emit).toHaveBeenCalledWith(EVENTS.INTERACTIONS_RUNTIME_STOPPED);
    });

    it("stopRuntime() before any start is safe and still emits", () => {
      expect(() => manager.stopRuntime()).not.toThrow();
      expect(composer.emit).toHaveBeenCalledWith(EVENTS.INTERACTIONS_RUNTIME_STOPPED);
    });
  });

  describe("getInteractions / getInteraction", () => {
    it("returns [] for an unknown element", () => {
      expect(manager.getInteractions("nope")).toEqual([]);
    });

    it("returns [] when the element has no interactions data", () => {
      expect(manager.getInteractions("el-1")).toEqual([]);
    });

    it("returns stored interactions", () => {
      const stored = [makeInteraction(), makeInteraction()];
      wireElement(makeMockElement(stored));
      expect(manager.getInteractions("el-1")).toEqual(stored);
    });

    it("getInteraction finds by id and returns null for misses", () => {
      const stored = makeInteraction({ id: "int-x" });
      wireElement(makeMockElement([stored]));

      expect(manager.getInteraction("el-1", "int-x")).toEqual(stored);
      expect(manager.getInteraction("el-1", "int-y")).toBeNull();
    });
  });

  describe("addInteraction", () => {
    it("creates an enabled interaction with defaults merged and persists it", () => {
      const created = manager.addInteraction("el-1", "hover", { duration: 900 }, "Fade hero");

      expect(created).not.toBeNull();
      expect(created!.id).toMatch(/^int-/);
      expect(created!.trigger).toBe("hover");
      expect(created!.enabled).toBe(true);
      expect(created!.name).toBe("Fade hero");
      expect(created!.animation).toEqual({ ...DEFAULT_ANIMATION_CONFIG, duration: 900 });

      expect(manager.getInteractions("el-1")).toEqual([created]);
      expect(composer.markDirty).toHaveBeenCalled();
      expect(composer.emit).toHaveBeenCalledWith(EVENTS.INTERACTION_ADDED, {
        elementId: "el-1",
        interaction: created,
      });
    });

    it("appends to existing interactions", () => {
      const existing = makeInteraction();
      wireElement(makeMockElement([existing]));

      const created = manager.addInteraction("el-1", "click");
      expect(manager.getInteractions("el-1")).toEqual([existing, created]);
    });

    it("returns null and emits nothing for an unknown element", () => {
      expect(manager.addInteraction("nope", "click")).toBeNull();
      expect(composer.emit).not.toHaveBeenCalled();
      expect(composer.markDirty).not.toHaveBeenCalled();
    });
  });

  describe("updateInteraction", () => {
    it("merges updates, persists, and emits with the previous interaction", () => {
      const original = makeInteraction({ id: "int-u", trigger: "click" });
      wireElement(makeMockElement([original]));

      const updated = manager.updateInteraction("el-1", "int-u", {
        trigger: "hover",
        name: "renamed",
      });

      expect(updated).toMatchObject({ id: "int-u", trigger: "hover", name: "renamed" });
      expect(manager.getInteraction("el-1", "int-u")).toEqual(updated);
      expect(composer.markDirty).toHaveBeenCalled();
      expect(composer.emit).toHaveBeenCalledWith(EVENTS.INTERACTION_UPDATED, {
        elementId: "el-1",
        interaction: updated,
        previousInteraction: expect.objectContaining({ id: "int-u", trigger: "click" }),
      });
    });

    it("returns null for unknown element or unknown interaction", () => {
      expect(manager.updateInteraction("nope", "int-u", {})).toBeNull();

      wireElement(makeMockElement([makeInteraction({ id: "int-u" })]));
      expect(manager.updateInteraction("el-1", "int-missing", {})).toBeNull();
      expect(composer.emit).not.toHaveBeenCalled();
    });
  });

  describe("removeInteraction / clearInteractions", () => {
    it("removes by id, persists, and emits the removed interaction", () => {
      const keep = makeInteraction({ id: "int-keep" });
      const drop = makeInteraction({ id: "int-drop" });
      wireElement(makeMockElement([keep, drop]));

      expect(manager.removeInteraction("el-1", "int-drop")).toBe(true);
      expect(manager.getInteractions("el-1")).toEqual([keep]);
      expect(composer.emit).toHaveBeenCalledWith(EVENTS.INTERACTION_REMOVED, {
        elementId: "el-1",
        interaction: drop,
      });
    });

    it("returns false for unknown element or unknown id", () => {
      expect(manager.removeInteraction("nope", "int-x")).toBe(false);

      wireElement(makeMockElement([makeInteraction({ id: "int-a" })]));
      expect(manager.removeInteraction("el-1", "int-x")).toBe(false);
      expect(composer.emit).not.toHaveBeenCalled();
    });

    it("clearInteractions empties the list and emits", () => {
      wireElement(makeMockElement([makeInteraction(), makeInteraction()]));

      manager.clearInteractions("el-1");
      expect(manager.getInteractions("el-1")).toEqual([]);
      expect(composer.emit).toHaveBeenCalledWith(EVENTS.INTERACTIONS_CLEARED, {
        elementId: "el-1",
      });
    });

    it("clearInteractions is a silent no-op when already empty", () => {
      manager.clearInteractions("el-1");
      expect(composer.emit).not.toHaveBeenCalled();
      expect(composer.markDirty).not.toHaveBeenCalled();
    });
  });

  describe("toggleInteraction", () => {
    it("flips enabled and emits both UPDATED and TOGGLED", () => {
      wireElement(makeMockElement([makeInteraction({ id: "int-t", enabled: true })]));

      expect(manager.toggleInteraction("el-1", "int-t")).toBe(true);
      expect(manager.getInteraction("el-1", "int-t")!.enabled).toBe(false);
      expect(composer.emit).toHaveBeenCalledWith(
        EVENTS.INTERACTION_UPDATED,
        expect.objectContaining({ elementId: "el-1" }),
      );
      expect(composer.emit).toHaveBeenCalledWith(EVENTS.INTERACTION_TOGGLED, {
        elementId: "el-1",
        interaction: expect.objectContaining({ id: "int-t", enabled: false }),
        enabled: false,
      });

      // Toggle back on.
      expect(manager.toggleInteraction("el-1", "int-t")).toBe(true);
      expect(manager.getInteraction("el-1", "int-t")!.enabled).toBe(true);
    });

    it("returns false for a missing interaction", () => {
      expect(manager.toggleInteraction("el-1", "int-missing")).toBe(false);
      expect(composer.emit).not.toHaveBeenCalled();
    });
  });

  describe("duplicateInteraction", () => {
    it("clones trigger + animation with a new id and '(copy)' name", () => {
      const original = makeInteraction({
        id: "int-orig",
        trigger: "hover",
        name: "Hero fade",
        animation: { ...DEFAULT_ANIMATION_CONFIG, duration: 750 },
      });
      wireElement(makeMockElement([original]));

      const copy = manager.duplicateInteraction("el-1", "int-orig");

      expect(copy).not.toBeNull();
      expect(copy!.id).not.toBe("int-orig");
      expect(copy!.trigger).toBe("hover");
      expect(copy!.name).toBe("Hero fade (copy)");
      expect(copy!.animation).toEqual(original.animation);
      expect(manager.getInteractionCount("el-1")).toBe(2);
      expect(composer.emit).toHaveBeenCalledWith(
        EVENTS.INTERACTION_ADDED,
        expect.objectContaining({ elementId: "el-1" }),
      );
    });

    it("leaves the name undefined when the original is unnamed", () => {
      wireElement(makeMockElement([makeInteraction({ id: "int-anon", name: undefined })]));
      const copy = manager.duplicateInteraction("el-1", "int-anon");
      expect(copy!.name).toBeUndefined();
    });

    it("returns null for a missing interaction", () => {
      expect(manager.duplicateInteraction("el-1", "int-missing")).toBeNull();
    });
  });

  describe("query helpers", () => {
    beforeEach(() => {
      wireElement(
        makeMockElement([
          makeInteraction({ id: "int-1", trigger: "click", enabled: true }),
          makeInteraction({ id: "int-2", trigger: "hover", enabled: false }),
          makeInteraction({ id: "int-3", trigger: "click", enabled: true }),
        ]),
      );
    });

    it("hasInteractions reflects presence", () => {
      expect(manager.hasInteractions("el-1")).toBe(true);
      expect(manager.hasInteractions("nope")).toBe(false);
    });

    it("getInteractionsByTrigger filters by trigger type", () => {
      const clicks = manager.getInteractionsByTrigger("el-1", "click");
      expect(clicks.map((i) => i.id)).toEqual(["int-1", "int-3"]);
      expect(manager.getInteractionsByTrigger("el-1", "focus")).toEqual([]);
    });

    it("getEnabledInteractions filters out disabled ones", () => {
      expect(manager.getEnabledInteractions("el-1").map((i) => i.id)).toEqual([
        "int-1",
        "int-3",
      ]);
    });

    it("getInteractionCount counts all, enabled or not", () => {
      expect(manager.getInteractionCount("el-1")).toBe(3);
      expect(manager.getInteractionCount("nope")).toBe(0);
    });
  });

  describe("reorderInteraction", () => {
    beforeEach(() => {
      wireElement(
        makeMockElement([
          makeInteraction({ id: "int-a" }),
          makeInteraction({ id: "int-b" }),
          makeInteraction({ id: "int-c" }),
        ]),
      );
    });

    function ids() {
      return manager.getInteractions("el-1").map((i) => i.id);
    }

    it("moves an interaction to the requested index and emits", () => {
      expect(manager.reorderInteraction("el-1", "int-a", 2)).toBe(true);
      expect(ids()).toEqual(["int-b", "int-c", "int-a"]);
      expect(composer.emit).toHaveBeenCalledWith(EVENTS.INTERACTIONS_REORDERED, {
        elementId: "el-1",
        interactions: expect.any(Array),
      });
      expect(composer.markDirty).toHaveBeenCalled();
    });

    it("clamps an out-of-range index to the end", () => {
      expect(manager.reorderInteraction("el-1", "int-a", 99)).toBe(true);
      expect(ids()).toEqual(["int-b", "int-c", "int-a"]);
    });

    it("clamps a negative index to the front", () => {
      expect(manager.reorderInteraction("el-1", "int-c", -5)).toBe(true);
      expect(ids()).toEqual(["int-c", "int-a", "int-b"]);
    });

    it("returns false for unknown element or unknown id", () => {
      expect(manager.reorderInteraction("nope", "int-a", 0)).toBe(false);
      expect(manager.reorderInteraction("el-1", "int-missing", 0)).toBe(false);
      expect(composer.emit).not.toHaveBeenCalledWith(
        EVENTS.INTERACTIONS_REORDERED,
        expect.anything(),
      );
    });
  });
});
