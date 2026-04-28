// @vitest-environment jsdom
/**
 * SnapCalculator event subscription tests
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { SnapCalculator } from "../SnapCalculator";
import { BoundsCalculator } from "../BoundsCalculator";

function createFakeComposer() {
  const handlers = new Map<string, (() => void)[]>();
  return {
    elements: {
      getElement: vi.fn(),
      getActivePage: vi.fn(() => undefined),
    },
    on: vi.fn((event: string, cb: () => void) => {
      if (!handlers.has(event)) handlers.set(event, []);
      handlers.get(event)!.push(cb);
    }),
    _emit(event: string) {
      handlers.get(event)?.forEach((cb) => cb());
    },
  } as unknown as import("../../../Composer").Composer & { _emit(event: string): void };
}

function createFakeBoundsCalculator() {
  return {
    getElementBounds: vi.fn(() => null),
    collectElementBounds: vi.fn(() => []),
    invalidateCache: vi.fn(),
  } as unknown as BoundsCalculator;
}

describe("SnapCalculator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("subscribes to composer events on construction", () => {
    const composer = createFakeComposer();
    const boundsCalculator = createFakeBoundsCalculator();

    new SnapCalculator(composer as unknown as import("../../../Composer").Composer, boundsCalculator);

    expect(composer.on).toHaveBeenCalledWith("element:style-changed", expect.any(Function));
    expect(composer.on).toHaveBeenCalledWith("element:children-changed", expect.any(Function));
    expect(composer.on).toHaveBeenCalledWith("canvas:scrolled", expect.any(Function));
    expect(composer.on).toHaveBeenCalledWith("viewport:resized", expect.any(Function));
  });

  it("calls boundsCalculator.invalidateCache() on element:style-changed", () => {
    const composer = createFakeComposer();
    const boundsCalculator = createFakeBoundsCalculator();

    new SnapCalculator(composer as unknown as import("../../../Composer").Composer, boundsCalculator);

    expect(boundsCalculator.invalidateCache).not.toHaveBeenCalled();
    composer._emit("element:style-changed");
    expect(boundsCalculator.invalidateCache).toHaveBeenCalledTimes(1);
  });

  it("calls boundsCalculator.invalidateCache() on canvas:scrolled", () => {
    const composer = createFakeComposer();
    const boundsCalculator = createFakeBoundsCalculator();

    new SnapCalculator(composer as unknown as import("../../../Composer").Composer, boundsCalculator);

    expect(boundsCalculator.invalidateCache).not.toHaveBeenCalled();
    composer._emit("canvas:scrolled");
    expect(boundsCalculator.invalidateCache).toHaveBeenCalledTimes(1);
  });

  it("calls boundsCalculator.invalidateCache() on viewport:resized", () => {
    const composer = createFakeComposer();
    const boundsCalculator = createFakeBoundsCalculator();

    new SnapCalculator(composer as unknown as import("../../../Composer").Composer, boundsCalculator);

    composer._emit("viewport:resized");
    expect(boundsCalculator.invalidateCache).toHaveBeenCalledTimes(1);
  });

  it("calls boundsCalculator.invalidateCache() on element:children-changed", () => {
    const composer = createFakeComposer();
    const boundsCalculator = createFakeBoundsCalculator();

    new SnapCalculator(composer as unknown as import("../../../Composer").Composer, boundsCalculator);

    composer._emit("element:children-changed");
    expect(boundsCalculator.invalidateCache).toHaveBeenCalledTimes(1);
  });
});
