// @vitest-environment jsdom
/**
 * ZoomControls — canvas zoom slider + presets.
 *
 * KNOWN ORPHAN (§2-B20): only barrel-exported from editor/canvas/index.ts,
 * no JSX consumer. Tested anyway to pin its contract: ±10 stepping with
 * min/max clamping + disabled states, rounded percent display, range-slider
 * passthrough, optional fit-to-screen, and the ZOOM_PRESETS dropdown.
 */

import * as React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render as rtlRender, screen, fireEvent, cleanup } from "@testing-library/react";
import { TooltipProvider } from "@/editor/shared/vibcoder/Tooltip";
import { ZoomControls } from "../ZoomControls";
import { ZOOM_PRESETS } from "../shared";

const render = (ui: React.ReactElement) => rtlRender(<TooltipProvider>{ui}</TooltipProvider>);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("ZoomControls — zoom stepping", () => {
  it("zoom in adds 10; zoom out subtracts 10", () => {
    const onZoomChange = vi.fn();
    render(<ZoomControls zoom={100} onZoomChange={onZoomChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Zoom In" }));
    expect(onZoomChange).toHaveBeenCalledWith(110);

    fireEvent.click(screen.getByRole("button", { name: "Zoom Out" }));
    expect(onZoomChange).toHaveBeenCalledWith(90);
  });

  it("clamps to maxZoom / minZoom on the last step", () => {
    const onZoomChange = vi.fn();
    const { unmount } = render(
      <ZoomControls zoom={395} onZoomChange={onZoomChange} /> // default max 400
    );
    fireEvent.click(screen.getByRole("button", { name: "Zoom In" }));
    expect(onZoomChange).toHaveBeenCalledWith(400); // not 405
    unmount();

    const onZoomChange2 = vi.fn();
    render(<ZoomControls zoom={15} onZoomChange={onZoomChange2} />); // default min 10
    fireEvent.click(screen.getByRole("button", { name: "Zoom Out" }));
    expect(onZoomChange2).toHaveBeenCalledWith(10); // not 5
  });

  it("disables the buttons at the bounds", () => {
    const { unmount } = render(<ZoomControls zoom={400} onZoomChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Zoom In" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Zoom Out" })).not.toBeDisabled();
    unmount();

    render(<ZoomControls zoom={10} onZoomChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Zoom Out" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Zoom In" })).not.toBeDisabled();
  });

  it("respects custom min/max props", () => {
    const onZoomChange = vi.fn();
    render(<ZoomControls zoom={48} minZoom={50} maxZoom={60} onZoomChange={onZoomChange} />);
    // zoom below custom min → Zoom Out disabled, Zoom In clamps to max 60
    expect(screen.getByRole("button", { name: "Zoom Out" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Zoom In" }));
    expect(onZoomChange).toHaveBeenCalledWith(58);
  });
});

describe("ZoomControls — display + slider", () => {
  it("shows the rounded zoom percentage", () => {
    render(<ZoomControls zoom={87.4} onZoomChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "87%" })).toBeInTheDocument();
  });

  it("slider drives onZoomChange with the numeric value", () => {
    const onZoomChange = vi.fn();
    render(<ZoomControls zoom={100} onZoomChange={onZoomChange} />);

    const slider = screen.getByRole("slider");
    expect(slider).toHaveValue("100");
    fireEvent.change(slider, { target: { value: "150" } });
    expect(onZoomChange).toHaveBeenCalledWith(150);
  });
});

describe("ZoomControls — fit to screen", () => {
  it("renders only when onFitToScreen is provided, and fires it", () => {
    const { unmount } = render(<ZoomControls zoom={100} onZoomChange={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "Fit to Screen" })).toBeNull();
    unmount();

    const onFitToScreen = vi.fn();
    render(<ZoomControls zoom={100} onZoomChange={vi.fn()} onFitToScreen={onFitToScreen} />);
    fireEvent.click(screen.getByRole("button", { name: "Fit to Screen" }));
    expect(onFitToScreen).toHaveBeenCalledTimes(1);
  });
});

describe("ZoomControls — presets dropdown", () => {
  it("opens on percent click, lists every ZOOM_PRESET, selects and closes", () => {
    const onZoomChange = vi.fn();
    render(<ZoomControls zoom={100} onZoomChange={onZoomChange} />);

    // closed by default — no preset entries beyond the % trigger
    expect(screen.queryByRole("button", { name: "150%" })).toBeNull();

    fireEvent.click(screen.getByTitle("Zoom presets"));
    for (const preset of ZOOM_PRESETS) {
      // zoom=100 → the "100%" trigger and the 100% preset entry coexist
      const matches = screen.getAllByRole("button", { name: `${preset}%` });
      expect(matches.length).toBeGreaterThanOrEqual(1);
    }

    fireEvent.click(screen.getByRole("button", { name: "150%" }));
    expect(onZoomChange).toHaveBeenCalledWith(150);
    // dropdown closed after selection
    expect(screen.queryByRole("button", { name: "150%" })).toBeNull();
  });

  it("toggles closed when the percent button is clicked again", () => {
    render(<ZoomControls zoom={100} onZoomChange={vi.fn()} />);

    const trigger = screen.getByTitle("Zoom presets");
    fireEvent.click(trigger);
    expect(screen.getByRole("button", { name: "150%" })).toBeInTheDocument();
    fireEvent.click(trigger);
    expect(screen.queryByRole("button", { name: "150%" })).toBeNull();
  });
});
