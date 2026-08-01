// @vitest-environment jsdom
/**
 * CanvasFooterToolbar — edit + viewport group.
 *
 * Guards the Figma-contract §2 move: Undo/Redo + the device/breakpoint switcher
 * left the topbar and now live on this canvas toolbar. Also the anti-orphan
 * guard for the toolbar itself — before F1, StudioPanels swallowed onZoomChange/
 * onOverlayChange, so the toolbar never rendered in the studio. These specs pin
 * that the toolbar renders its controls when wired, and hides the edit group
 * cleanly when it is not (so partial wiring can't render an empty divider).
 */

import * as React from "react";
import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
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

describe("CanvasFooterToolbar — edit + viewport group", () => {
  it("renders Undo/Redo + device switcher when wired (controls left the topbar)", () => {
    render(
      <CanvasFooterToolbar
        overlays={overlays}
        zoom={100}
        onOverlayChange={vi.fn()}
        onZoomChange={vi.fn()}
        device="desktop"
        onDeviceChange={vi.fn()}
        canUndo
        canRedo
        onUndo={vi.fn()}
        onRedo={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "Undo" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Redo" })).toBeTruthy();
    // BreakpointSwitcher renders a role="group" labelled "Device breakpoint"
    expect(screen.getByRole("group", { name: "Device breakpoint" })).toBeTruthy();
  });

  it("Undo/Redo fire their callbacks; disabled state respects canUndo/canRedo", () => {
    const onUndo = vi.fn();
    const onRedo = vi.fn();
    render(
      <CanvasFooterToolbar
        overlays={overlays}
        zoom={100}
        onOverlayChange={vi.fn()}
        onZoomChange={vi.fn()}
        canUndo={false}
        canRedo
        onUndo={onUndo}
        onRedo={onRedo}
      />,
    );
    const undo = screen.getByRole("button", { name: "Undo" }) as HTMLButtonElement;
    const redo = screen.getByRole("button", { name: "Redo" }) as HTMLButtonElement;
    expect(undo.disabled).toBe(true); // canUndo=false
    expect(redo.disabled).toBe(false);
    fireEvent.click(redo);
    expect(onRedo).toHaveBeenCalledTimes(1);
  });

  it("hides the edit group entirely when no edit controls are wired", () => {
    render(
      <CanvasFooterToolbar
        overlays={overlays}
        zoom={100}
        onOverlayChange={vi.fn()}
        onZoomChange={vi.fn()}
      />,
    );
    expect(screen.queryByRole("button", { name: "Undo" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Redo" })).toBeNull();
    expect(screen.queryByRole("group", { name: "Device breakpoint" })).toBeNull();
    // overlay controls still render — the toolbar itself is intact
    expect(screen.getByRole("button", { name: "Snap Guides" })).toBeTruthy();
  });
});
