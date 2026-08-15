// @vitest-environment jsdom
/**
 * CanvasFooterToolbar — overlay toggles and the help button. (The undo/redo/
 * device edit group is covered separately in
 * CanvasFooterToolbar.editgroup.test.tsx.)
 *
 * The zoom controls that used to be pinned here now live in StudioFooter —
 * board 817:4723 puts them in the footer's bottom-right corner — so their
 * tests moved to StudioFooter.zoom.test.tsx with them.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CanvasFooterToolbar } from "../CanvasFooterToolbar";

const ALL_OFF = {
  guides: false,
  spacing: false,
  grid: false,
  rulers: false,
  badges: false,
  xray: false,
};

function renderToolbar(props: Partial<React.ComponentProps<typeof CanvasFooterToolbar>> = {}) {
  const onOverlayChange = vi.fn();
  const onZoomChange = vi.fn();
  render(
    <CanvasFooterToolbar
      overlays={ALL_OFF}
      zoom={100}
      onOverlayChange={onOverlayChange}
      onZoomChange={onZoomChange}
      {...props}
    />
  );
  return { onOverlayChange, onZoomChange };
}

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

describe("CanvasFooterToolbar — overlay toggles", () => {
  it("renders all six overlay toggle buttons", () => {
    renderToolbar();
    for (const name of ["Snap Guides", "Spacing", "Grid", "Rulers", "Badges", "X-Ray"]) {
      expect(screen.getByRole("button", { name })).toBeTruthy();
    }
  });

  it("reflects active overlay state via aria-pressed", () => {
    renderToolbar({ overlays: { ...ALL_OFF, grid: true } });
    expect(screen.getByRole("button", { name: "Grid" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "Spacing" }).getAttribute("aria-pressed")).toBe(
      "false"
    );
  });

  it("toggles an off overlay ON (negates current value)", () => {
    const { onOverlayChange } = renderToolbar();
    fireEvent.click(screen.getByRole("button", { name: "Grid" }));
    expect(onOverlayChange).toHaveBeenCalledWith("grid", true);
  });

  it("toggles an on overlay OFF (negates current value)", () => {
    const { onOverlayChange } = renderToolbar({ overlays: { ...ALL_OFF, xray: true } });
    fireEvent.click(screen.getByRole("button", { name: "X-Ray" }));
    expect(onOverlayChange).toHaveBeenCalledWith("xray", false);
  });

  /* Board 199:205 draws these as words. They were icon-only for a while
     because the bar overflowed under the inspector; the label IS the control
     now, so a regression back to glyphs shows up here rather than in a
     screenshot nobody re-takes. */
  it("prints each toggle's name in the bar, not just in its tooltip", () => {
    renderToolbar();
    for (const name of ["Snap Guides", "Spacing", "Grid", "Rulers", "Badges", "X-Ray"]) {
      expect(screen.getByRole("button", { name }).textContent).toBe(name);
    }
  });

  /* Board 817:4649 prints ⌘R against Rulers. The chord was the one on that
     board never bound — it is the browser's reload. Only the PLAIN chord is
     taken; ⌘⇧R must still reach the browser. */
  it("⌘R toggles rulers, and ⌘⇧R is left to the browser", () => {
    const { onOverlayChange } = renderToolbar();
    fireEvent.keyDown(window, { key: "r", metaKey: true });
    expect(onOverlayChange).toHaveBeenCalledWith("rulers", true);

    onOverlayChange.mockClear();
    fireEvent.keyDown(window, { key: "r", metaKey: true, shiftKey: true });
    expect(onOverlayChange).not.toHaveBeenCalled();
  });
});

describe("CanvasFooterToolbar — help button", () => {
  it("renders the help button and fires onHelpClick when wired", () => {
    const onHelpClick = vi.fn();
    renderToolbar({ onHelpClick });
    const help = screen.getByRole("button", { name: /keyboard shortcuts/i });
    fireEvent.click(help);
    expect(onHelpClick).toHaveBeenCalledTimes(1);
  });

  it("omits the help button when onHelpClick is not provided", () => {
    renderToolbar();
    expect(screen.queryByRole("button", { name: /keyboard shortcuts/i })).toBeNull();
  });
});
