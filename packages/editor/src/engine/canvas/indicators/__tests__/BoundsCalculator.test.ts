// @vitest-environment jsdom
/**
 * BoundsCalculator cache contract tests
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { BoundsCalculator } from "../BoundsCalculator";
import { EVENTS } from "../../../../shared/constants/events";

function createFakeElement(id: string) {
  return {
    getId: () => id,
    getChildren: () => [],
  } as unknown as import("../../../elements/Element").Element;
}

function createFakeComposer(activePageId?: string) {
  const handlers = new Map<string, Set<() => void>>();
  return {
    on: vi.fn((ev: string, fn: () => void) => {
      if (!handlers.has(ev)) handlers.set(ev, new Set());
      handlers.get(ev)!.add(fn);
    }),
    off: vi.fn(),
    _emit: (ev: string) => handlers.get(ev)?.forEach((fn) => fn()),
    elements: {
      getElement: vi.fn((id: string) => createFakeElement(id)),
      getActivePage: vi.fn(() =>
        activePageId
          ? {
              id: activePageId,
              root: { id: activePageId },
            }
          : undefined
      ),
    },
  } as unknown as import("../../../Composer").Composer;
}

function setupDom(elementId: string) {
  const container = document.createElement("div");
  container.setAttribute("data-buildrick-canvas", "");
  const el = document.createElement("div");
  el.setAttribute("data-buildrick-id", elementId);
  container.appendChild(el);
  document.body.appendChild(container);
  return { container, el };
}

function cleanupDom() {
  while (document.body.firstChild) {
    document.body.removeChild(document.body.firstChild);
  }
}

describe("BoundsCalculator", () => {
  beforeEach(() => {
    cleanupDom();
  });

  describe("cache", () => {
    it("returns same reference on second call", () => {
      const composer = createFakeComposer();
      const calc = new BoundsCalculator(composer);
      setupDom("el-1");
      const fakeElement = createFakeElement("el-1");

      const first = calc.getElementBounds(fakeElement);
      const second = calc.getElementBounds(fakeElement);

      expect(first).not.toBeNull();
      expect(second).not.toBeNull();
      expect(first).toBe(second);
    });

    it("invalidateCache(elementId) removes specific entry", () => {
      const composer = createFakeComposer();
      const calc = new BoundsCalculator(composer);
      setupDom("el-1");
      setupDom("el-2");
      const el1 = createFakeElement("el-1");
      const el2 = createFakeElement("el-2");

      const first1 = calc.getElementBounds(el1);
      const first2 = calc.getElementBounds(el2);

      calc.invalidateCache("el-1");

      const second1 = calc.getElementBounds(el1);
      const second2 = calc.getElementBounds(el2);

      expect(second1).not.toBe(first1);
      expect(second2).toBe(first2);
    });

    it("invalidateCache() clears all and increments version", () => {
      const composer = createFakeComposer();
      const calc = new BoundsCalculator(composer);
      setupDom("el-1");
      const el = createFakeElement("el-1");

      const first = calc.getElementBounds(el);
      const v1 = calc.getCacheVersion();

      calc.invalidateCache();

      const second = calc.getElementBounds(el);
      const v2 = calc.getCacheVersion();

      expect(v2).toBe(v1 + 1);
      expect(second).not.toBe(first);
    });
  });
});

/* SnapCalculator and SpacingCalculator each carried their own copy of this
   wiring, on four event names nothing emits, and each had a full test suite
   asserting those names. Eight registrations, zero invalidations — the guides
   measured against wherever an element sat the first time it was measured.
   The behaviour lives here now, on events the engine actually sends. */
describe("BoundsCalculator — cache invalidation", () => {
  const DROPS = [
    EVENTS.ELEMENT_UPDATED,
    EVENTS.ELEMENT_STYLE_UPDATED,
    EVENTS.ELEMENT_DELETED,
    EVENTS.VIEWPORT_ZOOM,
  ];

  it.each(DROPS)("drops cached bounds on %s", (event) => {
    const composer = createFakeComposer("page-1") as unknown as {
      _emit(ev: string): void;
    } & import("../../../Composer").Composer;
    const calc = new BoundsCalculator(composer);
    setupDom("el-1");

    const first = calc.getElementBounds(createFakeElement("el-1"));
    expect(calc.getElementBounds(createFakeElement("el-1"))).toBe(first);

    composer._emit(event);
    expect(calc.getElementBounds(createFakeElement("el-1"))).not.toBe(first);
  });
});
