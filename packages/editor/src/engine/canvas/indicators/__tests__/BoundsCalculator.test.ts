// @vitest-environment jsdom
/**
 * BoundsCalculator cache contract tests
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { BoundsCalculator } from "../BoundsCalculator";

function createFakeElement(id: string) {
  return {
    getId: () => id,
    getChildren: () => [],
  } as import("../../../elements/Element").Element;
}

function createFakeComposer(activePageId?: string) {
  return {
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
