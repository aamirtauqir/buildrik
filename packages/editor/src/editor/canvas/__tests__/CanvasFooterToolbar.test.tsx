// @vitest-environment jsdom
/**
 * CanvasFooterToolbar — the View menu and the help button. (The undo/redo/
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

describe("CanvasFooterToolbar — the View menu (board 5930:44801)", () => {
  const openMenu = () => fireEvent.click(screen.getByTestId("canvas-view-menu-trigger"));

  it("replaces the six words with one View trigger; the rows live in the menu", () => {
    renderToolbar();
    for (const name of ["Snap guides", "Spacing", "Grid", "Rulers", "Badges", "X-Ray"]) {
      expect(screen.queryByRole("button", { name })).toBeNull();
    }
    expect(screen.queryByRole("menu")).toBeNull();
    openMenu();
    const rows = screen.getAllByRole("menuitemcheckbox").map((r) => r.textContent?.replace(/⌘.*$/, "").trim());
    expect(rows).toEqual(["Snap guides", "Spacing", "Grid", "Rulers", "Badges", "X-Ray"]);
  });

  it("reflects active overlay state as a checked row, and counts it on the trigger", () => {
    renderToolbar({ overlays: { ...ALL_OFF, grid: true } });
    expect(screen.getByTestId("canvas-view-menu-trigger").textContent).toContain("View · 1");
    openMenu();
    expect(screen.getByTestId("canvas-view-grid").getAttribute("aria-checked")).toBe("true");
    expect(screen.getByTestId("canvas-view-spacing").getAttribute("aria-checked")).toBe("false");
  });

  it("a row toggles its overlay (negates the current value) and closes the menu", () => {
    const { onOverlayChange } = renderToolbar();
    openMenu();
    fireEvent.click(screen.getByTestId("canvas-view-grid"));
    expect(onOverlayChange).toHaveBeenCalledWith("grid", true);
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("toggles an on overlay OFF", () => {
    const { onOverlayChange } = renderToolbar({ overlays: { ...ALL_OFF, xray: true } });
    openMenu();
    fireEvent.click(screen.getByTestId("canvas-view-xray"));
    expect(onOverlayChange).toHaveBeenCalledWith("xray", false);
  });

  it("prints each row's chord, so the menu is where the chords are documented", () => {
    renderToolbar();
    openMenu();
    expect(screen.getByTestId("canvas-view-rulers").textContent).toContain("⌘R");
    expect(screen.getByTestId("canvas-view-xray").textContent).toContain("⌘⇧X");
  });

  /* Board 817:4649 prints ⌘R against Rulers. The chord was the one on that
     board never bound — it is the browser's reload. Only the PLAIN chord is
     taken; ⌘⇧R must still reach the browser. The chords survive the move
     into a menu (CV-85). */
  it("⌘R toggles rulers with the menu closed, and ⌘⇧R is left to the browser", () => {
    const { onOverlayChange } = renderToolbar();
    fireEvent.keyDown(window, { key: "r", metaKey: true });
    expect(onOverlayChange).toHaveBeenCalledWith("rulers", true);

    onOverlayChange.mockClear();
    fireEvent.keyDown(window, { key: "r", metaKey: true, shiftKey: true });
    expect(onOverlayChange).not.toHaveBeenCalled();
  });

  it("no Inspector toggle in the bar — it is a ⌘K row and the inspector's ✕ now", () => {
    renderToolbar();
    expect(screen.queryByRole("button", { name: "Inspector" })).toBeNull();
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

/* Board 5930:44801 ends the View menu with "Breakpoint · Desktop ▸" and
   "Zoom · 100% ▸"; they open 5930:44781 (Desktop · Tablet 768px · Mobile
   375px) and 7048:78112 (Fit to screen · 50% · 75% · 100% · 150% · 200%). */
describe("CanvasFooterToolbar — View › Breakpoint / Zoom (5930:44801)", () => {
  it("shows the current breakpoint and zoom as submenu rows", () => {
    renderToolbar({ device: "desktop", onDeviceChange: vi.fn(), zoom: 75 });
    fireEvent.click(screen.getByTestId("canvas-view-menu-trigger"));
    expect(screen.getByTestId("canvas-view-breakpoint")).toHaveTextContent(/Breakpoint.*Desktop ▸/);
    expect(screen.getByTestId("canvas-view-zoom")).toHaveTextContent(/Zoom.*75% ▸/);
  });

  it("Breakpoint ▸ lists the devices and picking one switches and closes", () => {
    const onDeviceChange = vi.fn();
    renderToolbar({ device: "desktop", onDeviceChange });
    fireEvent.click(screen.getByTestId("canvas-view-menu-trigger"));
    fireEvent.click(screen.getByTestId("canvas-view-breakpoint"));
    expect(screen.getByRole("menuitemradio", { name: /Tablet/ })).toHaveTextContent("768px");
    fireEvent.click(screen.getByRole("menuitemradio", { name: /Mobile/ }));
    expect(onDeviceChange).toHaveBeenCalledWith("mobile");
    expect(screen.queryByTestId("canvas-view-menu")).toBeNull();
  });

  it("Zoom ▸ offers Fit and the presets", () => {
    const onFitToScreen = vi.fn();
    const { onZoomChange } = renderToolbar({ onFitToScreen });
    fireEvent.click(screen.getByTestId("canvas-view-menu-trigger"));
    fireEvent.click(screen.getByTestId("canvas-view-zoom"));
    const labels = screen.getAllByRole("menuitemradio").map((e) => (e.textContent ?? "").replace("✓", ""));
    expect(labels).toEqual(["Fit to screen", "50%", "75%", "100%", "150%", "200%"]);
    fireEvent.click(screen.getByRole("menuitemradio", { name: "150%" }));
    expect(onZoomChange).toHaveBeenCalledWith(150);
  });
});
