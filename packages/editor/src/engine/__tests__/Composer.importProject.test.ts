/**
 * Composer.importProject — selection-clear regression (CAN-006).
 *
 * importProject is called by HistoryManager on undo/redo and by manual loads.
 * It destroys the element store via elements.clear(), which orphans any
 * Element instance currently held by SelectionManager. Without selection
 * being cleared first, the inspector keeps rendering stale data from the
 * destroyed element. This test pins the call ordering.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi } from "vitest";
import { Composer } from "../Composer";

function makeFakeThis() {
  const calls: string[] = [];

  return {
    calls,
    instance: {
      emit: vi.fn(),
      selection: {
        clear: vi.fn(() => calls.push("selection.clear")),
      },
      elements: {
        clear: vi.fn(() => calls.push("elements.clear")),
        importPage: vi.fn(),
      },
      styles: {
        clear: vi.fn(() => calls.push("styles.clear")),
        importStyles: vi.fn(),
      },
      projectSettings: {},
      projectMetadata: {},
      state: { dirty: true },
      applyProjectSettings: vi.fn(),
    },
  };
}

describe("Composer.importProject — CAN-006 regression", () => {
  it("clears selection BEFORE clearing elements", () => {
    const fake = makeFakeThis();
    Composer.prototype.importProject.call(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fake.instance as any,
      { pages: [], styles: {}, settings: {}, metadata: {} } as never
    );

    expect(fake.instance.selection.clear).toHaveBeenCalledTimes(1);
    expect(fake.instance.elements.clear).toHaveBeenCalledTimes(1);

    // Ordering matters: selection refs become orphans the moment elements.clear runs.
    const selectionIndex = fake.calls.indexOf("selection.clear");
    const elementsIndex = fake.calls.indexOf("elements.clear");
    expect(selectionIndex).toBeGreaterThanOrEqual(0);
    expect(elementsIndex).toBeGreaterThan(selectionIndex);
  });

  it("does not throw when selection is undefined (early init path)", () => {
    const fake = makeFakeThis();
    // Simulate Composer mid-construction where selection may not be wired yet.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (fake.instance as any).selection = undefined;

    expect(() =>
      Composer.prototype.importProject.call(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        fake.instance as any,
        { pages: [], styles: {}, settings: {}, metadata: {} } as never
      )
    ).not.toThrow();

    expect(fake.instance.elements.clear).toHaveBeenCalledTimes(1);
  });
});
