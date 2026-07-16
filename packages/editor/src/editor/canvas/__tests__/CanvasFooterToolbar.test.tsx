// @vitest-environment jsdom
/**
 * CanvasFooterToolbar — overlay toggles, preset-snapping zoom controls, the
 * preset dropdown and the help button. (The undo/redo/device edit group is
 * covered separately in CanvasFooterToolbar.editgroup.test.tsx.)
 *
 * KNOWN real behavior pinned here (the reason a naive "clamp-to-max" test was
 * wrong): zoom in/out SNAP to the neighbouring ZOOM_PRESETS entry rather than
 * clamping arbitrary values, and the +/- buttons are DISABLED at the preset
 * bounds — so a click at the bound is a genuine no-op (0 onZoomChange calls),
 * not a clamp.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, vi, beforeAll } from "vitest";
import { render as rtlRender, screen, fireEvent } from "@testing-library/react";
import { TooltipProvider } from "@/editor/shared/vibcoder/Tooltip";
import { ZOOM_PRESETS } from "../shared";
import { CanvasFooterToolbar } from "../CanvasFooterToolbar";

const render = (ui: React.ReactElement) => rtlRender(<TooltipProvider>{ui}</TooltipProvider>);

const ALL_OFF = {
  guides: false,
  spacing: false,
  grid: false,
  rulers: false,
  badges: false,
  xray: false,
};

const MIN = ZOOM_PRESETS[0]; // 10
const MAX = ZOOM_PRESETS[ZOOM_PRESETS.length - 1]; // 300

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
});

describe("CanvasFooterToolbar — zoom controls (preset snapping)", () => {
  it("shows the current zoom rounded to a whole percent", () => {
    renderToolbar({ zoom: 133.4 });
    expect(screen.getByRole("button", { name: "Zoom presets" }).textContent).toBe("133%");
  });

  it("zoom in snaps UP to the next preset above the current value", () => {
    const { onZoomChange } = renderToolbar({ zoom: 100 });
    fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));
    expect(onZoomChange).toHaveBeenCalledWith(125); // next preset above 100
  });

  it("zoom out snaps DOWN to the next preset below the current value", () => {
    const { onZoomChange } = renderToolbar({ zoom: 100 });
    fireEvent.click(screen.getByRole("button", { name: "Zoom out" }));
    expect(onZoomChange).toHaveBeenCalledWith(75); // next preset below 100
  });

  it("snaps an off-preset value UP to the nearest preset above it", () => {
    const { onZoomChange } = renderToolbar({ zoom: 110 });
    fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));
    expect(onZoomChange).toHaveBeenCalledWith(125);
  });

  it("snaps an off-preset value DOWN to the nearest preset below it", () => {
    const { onZoomChange } = renderToolbar({ zoom: 110 });
    fireEvent.click(screen.getByRole("button", { name: "Zoom out" }));
    expect(onZoomChange).toHaveBeenCalledWith(100);
  });

  it("disables zoom-in at the maximum preset and clicking it is a no-op (KNOWN: no clamp)", () => {
    const { onZoomChange } = renderToolbar({ zoom: MAX });
    const zoomIn = screen.getByRole("button", { name: "Zoom in" }) as HTMLButtonElement;
    expect(zoomIn.disabled).toBe(true);
    fireEvent.click(zoomIn);
    expect(onZoomChange).not.toHaveBeenCalled();
  });

  it("disables zoom-out at the minimum preset and clicking it is a no-op", () => {
    const { onZoomChange } = renderToolbar({ zoom: MIN });
    const zoomOut = screen.getByRole("button", { name: "Zoom out" }) as HTMLButtonElement;
    expect(zoomOut.disabled).toBe(true);
    fireEvent.click(zoomOut);
    expect(onZoomChange).not.toHaveBeenCalled();
  });

  it("keeps zoom-in enabled above a preset boundary but below max (e.g. 350 is not a real state, 250 is)", () => {
    renderToolbar({ zoom: 250 });
    const zoomIn = screen.getByRole("button", { name: "Zoom in" }) as HTMLButtonElement;
    // 250 < 300 → still enabled; snaps up to 300
    expect(zoomIn.disabled).toBe(false);
  });
});

describe("CanvasFooterToolbar — preset dropdown", () => {
  it("opens the preset dropdown listing every ZOOM_PRESETS entry when the % is clicked", () => {
    renderToolbar({ zoom: 100 });
    fireEvent.click(screen.getByRole("button", { name: "Zoom presets" }));
    for (const preset of ZOOM_PRESETS) {
      expect(screen.getByRole("button", { name: `${preset}%` })).toBeTruthy();
    }
  });

  it("selecting a preset fires onZoomChange with that exact value and closes the dropdown", () => {
    const { onZoomChange } = renderToolbar({ zoom: 100 });
    fireEvent.click(screen.getByRole("button", { name: "Zoom presets" }));
    fireEvent.click(screen.getByRole("button", { name: "50%" }));
    expect(onZoomChange).toHaveBeenCalledWith(50);
    // dropdown closed → the 25% option is gone
    expect(screen.queryByRole("button", { name: "25%" })).toBeNull();
  });

  it("renders a Fit to screen entry inside the dropdown when onFitToScreen is wired", () => {
    const onFitToScreen = vi.fn();
    renderToolbar({ zoom: 100, onFitToScreen });
    fireEvent.click(screen.getByRole("button", { name: "Zoom presets" }));
    const fit = screen.getByRole("button", { name: "Fit to screen" });
    fireEvent.click(fit);
    expect(onFitToScreen).toHaveBeenCalledTimes(1);
  });

  it("omits the Fit to screen entry when onFitToScreen is not provided", () => {
    renderToolbar({ zoom: 100 });
    fireEvent.click(screen.getByRole("button", { name: "Zoom presets" }));
    expect(screen.queryByRole("button", { name: "Fit to screen" })).toBeNull();
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
