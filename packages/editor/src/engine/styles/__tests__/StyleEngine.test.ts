/**
 * StyleEngine RAF batching tests
 *
 * @module engine/styles/__tests__/StyleEngine
 * @license BSD-3-Clause
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { StyleEngine } from "../StyleEngine";

function makeComposer() {
  return {
    emit: vi.fn(),
    markDirty: vi.fn(),
    elements: {
      getElement: vi.fn(),
    },
  } as unknown as ConstructorParameters<typeof StyleEngine>[0];
}

describe("StyleEngine RAF batching", () => {
  let engine: StyleEngine;
  let composer: ReturnType<typeof makeComposer>;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["requestAnimationFrame"] });
    composer = makeComposer();
    engine = new StyleEngine(composer);
  });

  afterEach(() => {
    engine.destroy();
    vi.useRealTimers();
  });

  it("batches 3 setProperty calls into a single toCSS() rebuild after RAF", () => {
    const toCSSSpy = vi.spyOn(engine, "toCSS");

    engine.setProperty('[data-buildrick-id="el-1"]', "color", "red");
    engine.setProperty('[data-buildrick-id="el-1"]', "font-size", "16px");
    engine.setProperty('[data-buildrick-id="el-1"]', "margin", "10px");

    // Before RAF, toCSS should not have been called
    expect(toCSSSpy).not.toHaveBeenCalled();

    // Trigger all pending RAF callbacks
    vi.runAllTimers();

    // After RAF, toCSS should have been called exactly once
    expect(toCSSSpy).toHaveBeenCalledTimes(1);
  });

  it("flush() synchronously applies pending update", () => {
    const toCSSSpy = vi.spyOn(engine, "toCSS");

    engine.setProperty('[data-buildrick-id="el-1"]', "color", "red");

    // Before flush, toCSS should not have been called
    expect(toCSSSpy).not.toHaveBeenCalled();

    // Flush synchronously
    engine.flush();

    // toCSS should have been called once
    expect(toCSSSpy).toHaveBeenCalledTimes(1);

    // The style element should contain the CSS
    const styleEl = (engine as unknown as Record<string, unknown>)[
      "styleElement"
    ] as HTMLStyleElement;
    expect(styleEl.textContent).toContain("color: red");
  });

  it("does not call toCSS() for reads via getStyles()", () => {
    const toCSSSpy = vi.spyOn(engine, "toCSS");

    engine.setProperty('[data-buildrick-id="el-1"]', "color", "red");
    const styles = engine.getStyles("el-1");

    expect(styles).toBeDefined();
    expect(toCSSSpy).not.toHaveBeenCalled();
  });
});
