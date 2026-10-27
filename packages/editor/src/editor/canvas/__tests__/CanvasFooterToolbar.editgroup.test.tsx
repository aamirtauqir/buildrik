// @vitest-environment jsdom
/**
 * CanvasFooterToolbar — no edit group.
 *
 * Undo/Redo sat on this bar from the Figma-contract §2 move until design-2l9
 * Task 1.2 put the editor's one undo in the topbar. Also the anti-orphan guard
 * for the toolbar itself — before F1, StudioPanels swallowed onZoomChange/
 * onOverlayChange, so the toolbar never rendered in the studio.
 */

import * as React from "react";
import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import { CanvasFooterToolbar } from "../CanvasFooterToolbar";

const overlays = {
  guides: true,
  spacing: false,
  grid: false,
  rulers: false,
  badges: false,
  xray: false,
};

beforeAll(() => {
  if (typeof globalThis.window !== "undefined" && !globalThis.window.matchMedia) {
    Object.defineProperty(globalThis.window, "matchMedia", {
      writable: true,
      value: vi.fn((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  }
});

describe("CanvasFooterToolbar", () => {
  /* design-2l9 Task 1.2 (owner decision "one undo"): Undo/Redo live only in
     the topbar's History group. The footer used to carry the pair. */
  it("renders no undo/redo controls", () => {
    render(
      <CanvasFooterToolbar
        overlays={overlays}
        zoom={100}
        onOverlayChange={vi.fn()}
        onZoomChange={vi.fn()}
        device="desktop"
        onDeviceChange={vi.fn()}
      />,
    );
    expect(screen.queryByRole("button", { name: /undo/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /redo/i })).toBeNull();
    // Board 5936:44788: breakpoints moved into View ▸ Breakpoint — no W/D/T/M here.
    expect(screen.queryByRole("group", { name: "Device breakpoint" })).toBeNull();
    // the View menu still renders — the toolbar itself is intact
    expect(screen.getByRole("button", { name: "View" })).toBeTruthy();
  });
});
