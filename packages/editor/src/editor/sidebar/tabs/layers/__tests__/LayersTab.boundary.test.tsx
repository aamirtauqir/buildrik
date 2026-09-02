// @vitest-environment jsdom
/**
 * The count footer must not outlive the tree it counts.
 *
 * Board 781:4217 draws the load-error state with no count. The footer is the
 * error boundary's SIBLING, so it survived the failure and went on reporting
 * the last good total — "66 layers" underneath "Couldn't load the layer tree."
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeAll, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";

let shouldThrow = true;
vi.mock("@/editor/panels/layers/index", () => ({
  LayersPanel: () => {
    if (shouldThrow) throw new Error("tree read failed");
    const React = require("react");
    return React.createElement("div", { "data-testid": "layers-panel-mock" });
  },
}));
vi.mock("@/editor/canvas/hooks/useComposerSelection", () => ({
  useComposerSelection: () => ({ selectedElement: null, selectedId: null }),
}));

import { LayersTab } from "../LayersTab";
import type { Composer } from "@/engine/Composer";

/* `isProjectLoading` is part of the real Composer contract (Composer.ts:862)
   and LayersTab now reads it through useProjectLoading — the skeleton has to
   know the payload is still in flight, because `composer` is non-null from the
   first render and on its own says nothing. The `as unknown as Composer` cast
   hid the gap until then; a stub that answers `false` is the "loaded" case
   these tests are actually about. */
const stubComposer = () =>
  ({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    isProjectLoading: vi.fn(() => false),
  } as unknown as Composer);

beforeAll(() => {
  Object.defineProperty(globalThis.window, "matchMedia", {
    writable: true,
    value: vi.fn((q: string) => ({
      matches: false, media: q, onchange: null,
      addListener: vi.fn(), removeListener: vi.fn(),
      addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
    })),
  });
});

afterEach(() => { cleanup(); shouldThrow = true; });

describe("LayersTab — the count and the tree fail together (board 781:4217)", () => {
  it("drops the count when the tree throws, and brings it back on retry", () => {
    // React logs the caught error; the boundary is the point of the test.
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    const { container } = render(<LayersTab composer={stubComposer()} />);

    expect(screen.getByTestId("layers-load-error")).toBeTruthy();
    expect(container.querySelector(".bdc-lcount")).toBeNull();

    shouldThrow = false;
    fireEvent.click(screen.getByTestId("layers-load-retry"));

    expect(screen.getByTestId("layers-panel-mock")).toBeTruthy();
    expect(container.querySelector(".bdc-lcount")).toBeTruthy();
    err.mockRestore();
  });
});
