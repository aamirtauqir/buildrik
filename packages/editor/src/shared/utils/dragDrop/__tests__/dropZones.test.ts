/**
 * dragDrop dropZones — registry registration/lookup + drop validation.
 * jsdom-backed: findZone uses getBoundingClientRect (stubbed per element).
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { createDropZoneRegistry } from "../dropZones";
import type { DragData } from "../types";

function stubRect(el: HTMLElement, x: number, y: number, w: number, h: number): void {
  el.getBoundingClientRect = () =>
    ({
      x,
      y,
      left: x,
      top: y,
      width: w,
      height: h,
      right: x + w,
      bottom: y + h,
      toJSON: () => ({}),
    }) as DOMRect;
}

const elementDrag = (elementType: string): DragData =>
  ({
    type: "element",
    sessionId: "s",
    startTime: 0,
    startPosition: { x: 0, y: 0 },
    elementId: "e1",
    elementType,
  }) as unknown as DragData;

const blockDrag = (blockType: string): DragData =>
  ({
    type: "block",
    sessionId: "s",
    startTime: 0,
    startPosition: { x: 0, y: 0 },
    block: { type: blockType },
  }) as unknown as DragData;

describe("createDropZoneRegistry register/unregister", () => {
  it("stores zones by id and removes them", () => {
    const reg = createDropZoneRegistry();
    const el = document.createElement("div");
    reg.register({ id: "z1", element: el });
    expect(reg.zones.has("z1")).toBe(true);
    reg.unregister("z1");
    expect(reg.zones.has("z1")).toBe(false);
  });
});

describe("findZone", () => {
  it("returns the zone whose element contains the point", () => {
    const reg = createDropZoneRegistry();
    const el = document.createElement("div");
    stubRect(el, 0, 0, 100, 100);
    reg.register({ id: "z1", element: el });
    expect(reg.findZone({ x: 50, y: 50 })?.id).toBe("z1");
  });

  it("returns null when the point is outside every zone", () => {
    const reg = createDropZoneRegistry();
    const el = document.createElement("div");
    stubRect(el, 0, 0, 10, 10);
    reg.register({ id: "z1", element: el });
    expect(reg.findZone({ x: 500, y: 500 })).toBeNull();
  });

  it("prefers higher-priority zones when they overlap", () => {
    const reg = createDropZoneRegistry();
    const low = document.createElement("div");
    const high = document.createElement("div");
    stubRect(low, 0, 0, 100, 100);
    stubRect(high, 0, 0, 100, 100);
    reg.register({ id: "low", element: low, priority: 1 });
    reg.register({ id: "high", element: high, priority: 10 });
    expect(reg.findZone({ x: 50, y: 50 })?.id).toBe("high");
  });

  it("skips inactive zones", () => {
    const reg = createDropZoneRegistry();
    const el = document.createElement("div");
    stubRect(el, 0, 0, 100, 100);
    reg.register({ id: "z1", element: el, active: false });
    expect(reg.findZone({ x: 50, y: 50 })).toBeNull();
  });

  it("resolves string selectors against the document", () => {
    const reg = createDropZoneRegistry();
    const el = document.createElement("div");
    el.id = "target-zone";
    stubRect(el, 0, 0, 100, 100);
    document.body.appendChild(el);
    reg.register({ id: "z1", element: "#target-zone" });
    expect(reg.findZone({ x: 20, y: 20 })?.id).toBe("z1");
    document.body.removeChild(el);
  });

  it("skips zones whose selector matches nothing", () => {
    const reg = createDropZoneRegistry();
    reg.register({ id: "ghost", element: "#does-not-exist" });
    expect(reg.findZone({ x: 0, y: 0 })).toBeNull();
  });
});

describe("validateDrop", () => {
  it("delegates to a custom validate function when present", () => {
    const reg = createDropZoneRegistry();
    const el = document.createElement("div");
    const zone = { id: "z", element: el, validate: () => false };
    expect(reg.validateDrop(zone, elementDrag("container"))).toBe(false);
  });

  it("rejects element types not in the accepts list", () => {
    const reg = createDropZoneRegistry();
    const el = document.createElement("div");
    const zone = { id: "z", element: el, accepts: ["image"] as never };
    expect(reg.validateDrop(zone, elementDrag("container"))).toBe(false);
  });

  it("accepts element types present in the accepts list", () => {
    const reg = createDropZoneRegistry();
    const el = document.createElement("div");
    const zone = { id: "z", element: el, accepts: ["container"] as never };
    expect(reg.validateDrop(zone, elementDrag("container"))).toBe(true);
  });

  it("rejects element types present in the rejects list", () => {
    const reg = createDropZoneRegistry();
    const el = document.createElement("div");
    const zone = { id: "z", element: el, rejects: ["container"] as never };
    expect(reg.validateDrop(zone, elementDrag("container"))).toBe(false);
  });

  it("reads the block type for block drags", () => {
    const reg = createDropZoneRegistry();
    const el = document.createElement("div");
    const zone = { id: "z", element: el, accepts: ["button"] as never };
    expect(reg.validateDrop(zone, blockDrag("container"))).toBe(false);
    expect(reg.validateDrop(zone, blockDrag("button"))).toBe(true);
  });

  it("passes non-element/non-block drags through unconstrained", () => {
    const reg = createDropZoneRegistry();
    const el = document.createElement("div");
    const zone = { id: "z", element: el, accepts: ["image"] as never };
    const external = { type: "external", sessionId: "s" } as unknown as DragData;
    expect(reg.validateDrop(zone, external)).toBe(true);
  });
});
