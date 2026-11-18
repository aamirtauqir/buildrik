// @vitest-environment jsdom
/**
 * CanvasFooterToolbar — the View menu and the help button. (The undo/redo/
 * device edit group is covered separately in
 * CanvasFooterToolbar.editgroup.test.tsx.)
 *
 * The zoom menu ("100% ▾") and the selection readout live here again (the
 * status footer that briefly held them is gone).
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
  outlines: false,
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

/* design-2l9 board 145:64586 (Canvas view). Re-baseline: canvas View menu —
   was 5930:44801's six check rows + Breakpoint ▸ / Zoom ▸. */
describe("CanvasFooterToolbar — the View menu (board 145:64586)", () => {
  const openMenu = () => fireEvent.click(screen.getByTestId("canvas-view-menu-trigger"));

  it("the board's rows first — Grid · n px ›, Rulers, Snap guides — then the code's overlays under a rule", () => {
    renderToolbar({ gridSize: 7, onGridSizeChange: vi.fn() });
    expect(screen.queryByRole("menu")).toBeNull();
    openMenu();
    expect(screen.getByText("Canvas view")).toBeTruthy();
    const rows = screen.getAllByRole("menuitemcheckbox").map((r) => r.textContent?.replace(/([⌘⇧⌥].*|›|✓)$/, "").trim());
    /* "Show hidden elements" (176:19089) is on by default, so it carries its ✓. */
    expect(rows).toEqual(["Grid · 7 px", "Rulers and guides", "Snap guides", "Show outlines", "Show hidden elements", "Spacing", "Badges", "X-Ray"]);
    expect(screen.queryByTestId("canvas-view-breakpoint")).toBeNull();
    expect(screen.queryByTestId("canvas-view-zoom")).toBeNull();
  });

  it("the trigger reads View, plain; an active overlay is a checked row", () => {
    renderToolbar({ overlays: { ...ALL_OFF, rulers: true } });
    expect(screen.getByTestId("canvas-view-menu-trigger").textContent).toBe("View");
    openMenu();
    expect(screen.getByTestId("canvas-view-rulers").getAttribute("aria-checked")).toBe("true");
    expect(screen.getByTestId("canvas-view-spacing").getAttribute("aria-checked")).toBe("false");
  });

  it("a row toggles its overlay (negates the current value) and closes the menu", () => {
    const { onOverlayChange } = renderToolbar({ overlays: { ...ALL_OFF, xray: true } });
    openMenu();
    fireEvent.click(screen.getByTestId("canvas-view-xray"));
    expect(onOverlayChange).toHaveBeenCalledWith("xray", false);
    expect(screen.queryByRole("menu")).toBeNull();
  });

  /* A-12: "Show outlines" — element outlines without X-Ray's wireframe — is a
     board row (145:64586), toggled like the others. */
  it("Show outlines toggles the outlines preference", () => {
    const { onOverlayChange } = renderToolbar();
    openMenu();
    expect(screen.getByTestId("canvas-view-outlines").getAttribute("aria-checked")).toBe("false");
    fireEvent.click(screen.getByTestId("canvas-view-outlines"));
    expect(onOverlayChange).toHaveBeenCalledWith("outlines", true);
  });

  it("prints each row's chord", () => {
    renderToolbar();
    openMenu();
    expect(screen.getByTestId("canvas-view-rulers").textContent).toContain("⇧R");
    expect(screen.getByTestId("canvas-view-badges").textContent).toContain("⌥B");
    expect(screen.getByTestId("canvas-view-xray").textContent).toContain("⌥X");
  });

  /* SC-12 / BD-39 (2): ⌘R reloads the page, ⌘B is Bold and ⌘⇧X strikethrough
     in Text scope, so the overlays moved to ⇧R / ⌥B / ⌥X and the old chords
     go back to the browser. ⌥ and ⇧ change `key` on macOS (⌥B types "∫",
     ⌥X "≈"), so the physical key decides. */
  it("⇧R / ⌥B / ⌥X toggle rulers, badges and X-Ray with the menu closed", () => {
    const { onOverlayChange } = renderToolbar();
    fireEvent.keyDown(window, { key: "R", code: "KeyR", shiftKey: true });
    fireEvent.keyDown(window, { key: "∫", code: "KeyB", altKey: true });
    fireEvent.keyDown(window, { key: "≈", code: "KeyX", altKey: true });
    expect(onOverlayChange.mock.calls).toEqual([
      ["rulers", true],
      ["badges", true],
      ["xray", true],
    ]);
  });

  it("leaves ⌘R, ⌘B and ⌘⇧X to the browser", () => {
    const { onOverlayChange } = renderToolbar();
    const events = [
      { key: "r", code: "KeyR", metaKey: true },
      { key: "r", code: "KeyR", metaKey: true, shiftKey: true },
      { key: "b", code: "KeyB", metaKey: true },
      { key: "b", code: "KeyB", ctrlKey: true },
      { key: "x", code: "KeyX", metaKey: true, shiftKey: true },
    ];
    for (const init of events) expect(fireEvent.keyDown(window, init)).toBe(true);
    expect(onOverlayChange).not.toHaveBeenCalled();
  });

  it("a bare R / B / X, or ⌥ with ⇧, toggles nothing", () => {
    const { onOverlayChange } = renderToolbar();
    fireEvent.keyDown(window, { key: "r", code: "KeyR" });
    fireEvent.keyDown(window, { key: "b", code: "KeyB" });
    fireEvent.keyDown(window, { key: "ı", code: "KeyB", altKey: true, shiftKey: true });
    expect(onOverlayChange).not.toHaveBeenCalled();
  });

  it("never fires while typing in a field or in inline text", () => {
    const { onOverlayChange } = renderToolbar();
    const input = document.createElement("input");
    document.body.appendChild(input);
    fireEvent.keyDown(input, { key: "R", code: "KeyR", shiftKey: true });
    fireEvent.keyDown(input, { key: "∫", code: "KeyB", altKey: true });
    input.remove();
    expect(onOverlayChange).not.toHaveBeenCalled();
  });

  it("without a grid-size setter, Grid toggles the overlay directly", () => {
    const { onOverlayChange } = renderToolbar();
    openMenu();
    fireEvent.click(screen.getByTestId("canvas-view-grid"));
    expect(onOverlayChange).toHaveBeenCalledWith("grid", true);
  });
});

/* Board 7:18654: "Hero / Text · 1440 px · 52% · View". */
describe("CanvasFooterToolbar — the bar (board 7:18654)", () => {
  it("the path reads on the left with the type and size in its tooltip; no breakpoint or help buttons", () => {
    renderToolbar({ device: "desktop", onDeviceChange: vi.fn(), readout: "Hero / Text", readoutTitle: "Text · 680 × 40" });
    const readout = screen.getByTestId("canvas-bar-readout");
    expect(readout.textContent).toBe("Hero / Text");
    expect(readout.getAttribute("title")).toBe("Text · 680 × 40");
    expect(screen.queryByTestId("breakpoint-switcher")).toBeNull();
    expect(screen.queryByRole("button", { name: /keyboard shortcuts/i })).toBeNull();
  });

  /* Board 7:18654: device toggles centred, then width chip, zoom, View.
     Re-baseline: canvas bar contents (the devices joined it). */
  it("controls read in board order: devices, width, zoom, View", () => {
    const onDeviceChange = vi.fn();
    renderToolbar({ device: "desktop", onDeviceChange, onCustomWidth: vi.fn(), pageWidth: 1440, zoom: 52 });
    const labels = screen.getAllByRole("button").map((b) => b.getAttribute("aria-label") ?? b.textContent);
    expect(labels).toEqual(["Desktop", "Tablet", "Mobile", "Page width 1440 px", "Zoom 52%", "View"]);
    expect(screen.getByTestId("bp-cell-desktop")).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByTestId("bp-cell-mobile"));
    expect(onDeviceChange).toHaveBeenCalledWith("mobile");
  });

  it("the zoom control opens the zoom rows with the current one checked", () => {
    const onFitToScreen = vi.fn();
    const { onZoomChange } = renderToolbar({ zoom: 100, onFitToScreen });
    fireEvent.click(screen.getByTestId("canvas-zoom-trigger"));
    expect(screen.getByTestId("canvas-zoom-100").getAttribute("aria-checked")).toBe("true");
    fireEvent.click(screen.getByTestId("canvas-zoom-150"));
    expect(onZoomChange).toHaveBeenCalledWith(150);
    fireEvent.click(screen.getByTestId("canvas-zoom-trigger"));
    fireEvent.click(screen.getByTestId("canvas-zoom-fit"));
    expect(onFitToScreen).toHaveBeenCalledTimes(1);
  });
});

/* Boards 145:71013 / 145:71444 — Page width. */
describe("CanvasFooterToolbar — Page width", () => {
  const open = (props: Partial<React.ComponentProps<typeof CanvasFooterToolbar>> = {}) => {
    const onDeviceChange = vi.fn();
    const onCustomWidth = vi.fn();
    renderToolbar({ device: "desktop", onDeviceChange, onCustomWidth, pageWidth: 1440, ...props });
    fireEvent.click(screen.getByTestId("canvas-width-trigger"));
    return { onDeviceChange, onCustomWidth };
  };

  it("lists the board's presets; Tablet and Mobile switch breakpoint, others preview at that width", () => {
    const { onDeviceChange, onCustomWidth } = open();
    const rows = screen.getAllByRole("menuitemradio").map((r) => r.textContent?.replace("✓", "").trim());
    expect(rows).toEqual(["1920 · Wide", "1440 · Desktop", "1280", "1024", "768 · Tablet", "375 · Mobile"]);
    fireEvent.click(screen.getByTestId("page-width-preset-768"));
    expect(onDeviceChange).toHaveBeenCalledWith("tablet");
    fireEvent.click(screen.getByTestId("canvas-width-trigger"));
    fireEvent.click(screen.getByTestId("page-width-preset-1280"));
    expect(onCustomWidth).toHaveBeenCalledWith(1280);
  });

  it("a custom width applies on Enter; out of range keeps the page and says so", () => {
    const { onCustomWidth } = open();
    const input = screen.getByTestId("page-width-input");
    fireEvent.change(input, { target: { value: "9000" } });
    expect(screen.getByTestId("page-width-error").textContent).toBe("Enter a number from 240 to 2560. The page stays at 1440 px.");
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onCustomWidth).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { value: "600" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onCustomWidth).toHaveBeenCalledWith(600);
  });
});

/* Boards 145:65011 / 145:65448 — Grid and snapping. */
describe("CanvasFooterToolbar — Grid and snapping", () => {
  const openGrid = (props: Partial<React.ComponentProps<typeof CanvasFooterToolbar>>) => {
    const r = renderToolbar(props);
    fireEvent.click(screen.getByTestId("canvas-view-menu-trigger"));
    fireEvent.click(screen.getByTestId("canvas-view-grid"));
    return r;
  };

  it("opens the dialog; nothing changes until Apply", () => {
    const onGridSizeChange = vi.fn();
    const { onOverlayChange } = openGrid({ gridSize: 8, onGridSizeChange });
    expect(screen.getByText("Personal editor view. Existing element values stay unchanged.")).toBeTruthy();
    fireEvent.click(screen.getByTestId("grid-snap-preset-16"));
    fireEvent.click(screen.getByRole("switch", { name: "Show grid and snap" }));
    expect(onGridSizeChange).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId("grid-snap-apply"));
    expect(onGridSizeChange).toHaveBeenCalledWith(16);
    expect(onOverlayChange).toHaveBeenCalledWith("grid", true);
  });

  /* Board 145:65011: a panel in the View popover's place with Close — not a
     modal. Re-baseline: Grid and snapping container. */
  it("opens as a panel in place of the View menu; Close dismisses it", () => {
    openGrid({ gridSize: 8, onGridSizeChange: vi.fn() });
    expect(screen.queryByTestId("canvas-view-menu")).toBeNull();
    expect(screen.queryByRole("dialog", { name: "Grid and snapping" })).toBeTruthy();
    expect(document.querySelector('[data-testid="modal-grid-snap-dialog"]')).toBeNull();
    fireEvent.click(screen.getByTestId("grid-snap-close"));
    expect(screen.queryByTestId("grid-snap-dialog")).toBeNull();
  });

  it("a fractional size is refused with the board's message; the grid stays", () => {
    const onGridSizeChange = vi.fn();
    openGrid({ gridSize: 7, onGridSizeChange });
    fireEvent.change(screen.getByTestId("grid-snap-size"), { target: { value: "1.5" } });
    expect(screen.getByTestId("grid-snap-error").textContent).toBe("Enter a whole number from 1 to 100 px. Current grid stays 7 px.");
    expect(screen.getByTestId("grid-snap-hint").textContent).toBe("Whole number · 1–100 px");
    expect(screen.getByTestId("grid-snap-apply")).toBeDisabled();
  });
});

/* 2L9 176:19089 / 176:19451: Show hidden elements — a personal view
   preference; off, the canvas stops drawing condition-hidden ghosts. */
describe("CanvasFooterToolbar — Show hidden elements", () => {
  it("toggles the preference from Canvas view", async () => {
    const { setShowHiddenElements } = await import("../hiddenElementsPref");
    setShowHiddenElements(true);
    renderToolbar();
    fireEvent.click(screen.getByTestId("canvas-view-menu-trigger"));
    const row = screen.getByTestId("canvas-view-hidden");
    expect(row).toHaveTextContent("Show hidden elements");
    fireEvent.click(row);
    expect(localStorage.getItem("bk-canvas-show-hidden")).toBe("false");
    fireEvent.click(screen.getByTestId("canvas-view-menu-trigger"));
    fireEvent.click(screen.getByTestId("canvas-view-hidden"));
    expect(localStorage.getItem("bk-canvas-show-hidden")).toBe("true");
  });
});

/* SC-12 / BD-39 (2): ⌘1 / ⌘2 switch browser tabs and ⌘0 resets browser zoom,
   so the zoom chords are ⇧1 fit · ⇧2 selection · ⇧0 100% (⌘0 kept as the
   alias SC-12 allows). ⇧1 types "!" on every layout, so the physical key
   decides. */
describe("CanvasFooterToolbar — zoom chords (SC-12)", () => {
  it("⇧1 fits, ⇧2 zooms to the selection, ⇧0 goes to 100%", () => {
    const onFitToScreen = vi.fn();
    const onZoomToSelection = vi.fn();
    const { onZoomChange } = renderToolbar({ zoom: 75, onFitToScreen, onZoomToSelection });
    fireEvent.keyDown(window, { key: "!", code: "Digit1", shiftKey: true });
    fireEvent.keyDown(window, { key: "@", code: "Digit2", shiftKey: true });
    fireEvent.keyDown(window, { key: ")", code: "Digit0", shiftKey: true });
    expect(onFitToScreen).toHaveBeenCalledTimes(1);
    expect(onZoomToSelection).toHaveBeenCalledTimes(1);
    expect(onZoomChange).toHaveBeenCalledWith(100);
  });

  it("leaves ⌘1 and ⌘2 to the browser; ⌘0 stays an alias of ⇧0", () => {
    const onFitToScreen = vi.fn();
    const onZoomToSelection = vi.fn();
    const { onZoomChange } = renderToolbar({ zoom: 75, onFitToScreen, onZoomToSelection });
    expect(fireEvent.keyDown(window, { key: "1", code: "Digit1", metaKey: true })).toBe(true);
    expect(fireEvent.keyDown(window, { key: "2", code: "Digit2", ctrlKey: true })).toBe(true);
    expect(onFitToScreen).not.toHaveBeenCalled();
    expect(onZoomToSelection).not.toHaveBeenCalled();
    fireEvent.keyDown(window, { key: "0", code: "Digit0", metaKey: true });
    expect(onZoomChange).toHaveBeenCalledWith(100);
  });
});
