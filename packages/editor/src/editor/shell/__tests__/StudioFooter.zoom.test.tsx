// @vitest-environment jsdom
/**
 * StudioFooter — the zoom flyout (board 817:4723).
 *
 * The board says it in words: "Bottom-right corner of footer. Click percentage
 * to open flyout. Range: 10%–400%." These controls used to sit in the floating
 * canvas toolbar, where they cost ~105px of a 760px bar and forced every
 * overlay toggle down to a bare icon — so this is the board's own placement,
 * not a preference.
 *
 * Fit and zoom-to-selection go out as composer events: only the canvas can
 * measure, and the footer cannot reach it without a prop chain across the
 * shell. Pinned here because an event with no listener is exactly the failure
 * the canvas already had with ZOOM_IN/ZOOM_OUT.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeAll, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

import { StudioFooter } from "../StudioFooter";
import { ZOOM_PRESETS } from "../../../shared/constants/canvas";
import { EVENTS } from "../../../shared/constants/events";

function makeComposer() {
  const emit = vi.fn();
  const composer = {
    emit,
    on: vi.fn(),
    off: vi.fn(),
    isProjectLoading: () => false,
    elements: { getActivePage: () => ({ id: "page-1" }) },
    selection: { getSelectedIds: () => [] },
  } as never;
  return { composer, emit };
}

function renderFooter(zoom = 100) {
  const { composer, emit } = makeComposer();
  const onZoomChange = vi.fn();
  render(
    <StudioFooter
      composer={composer}
      device="desktop"
      zoom={zoom}
      onZoomChange={onZoomChange}
      selectedElement={null}
    />
  );
  return { onZoomChange, emit };
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

afterEach(cleanup);

describe("StudioFooter — zoom flyout", () => {
  it("reads `{Device} · {zoom}%` and rounds the percent", () => {
    renderFooter(133.4);
    expect(screen.getByTestId("footer-device-zoom").textContent).toBe("Desktop · 133%");
  });

  it("the readout is the control — clicking it opens the flyout", () => {
    renderFooter();
    expect(screen.queryByTestId("footer-zoom-flyout")).toBeNull();
    fireEvent.click(screen.getByTestId("footer-device-zoom"));
    expect(screen.getByTestId("footer-zoom-flyout")).toBeTruthy();
  });

  it("lists every preset, 10% through 400%", () => {
    renderFooter();
    fireEvent.click(screen.getByTestId("footer-device-zoom"));
    for (const preset of ZOOM_PRESETS) {
      expect(screen.getByRole("button", { name: `${preset}%` })).toBeTruthy();
    }
  });

  it("picking a preset sends that exact value and closes the flyout", () => {
    const { onZoomChange } = renderFooter();
    fireEvent.click(screen.getByTestId("footer-device-zoom"));
    fireEvent.click(screen.getByRole("button", { name: "50%" }));
    expect(onZoomChange).toHaveBeenCalledWith(50);
    expect(screen.queryByTestId("footer-zoom-flyout")).toBeNull();
  });

  it("Zoom to 100% is its own row, separate from the preset list", () => {
    const { onZoomChange } = renderFooter(50);
    fireEvent.click(screen.getByTestId("footer-device-zoom"));
    fireEvent.click(screen.getByRole("button", { name: /Zoom to 100%/ }));
    expect(onZoomChange).toHaveBeenCalledWith(100);
  });

  it("fit and zoom-to-selection reach the canvas through the composer", () => {
    const { emit } = renderFooter();
    fireEvent.click(screen.getByTestId("footer-device-zoom"));
    fireEvent.click(screen.getByRole("button", { name: /Zoom to fit/ }));
    expect(emit).toHaveBeenCalledWith(EVENTS.ZOOM_FIT, {});

    fireEvent.click(screen.getByTestId("footer-device-zoom"));
    fireEvent.click(screen.getByRole("button", { name: /Zoom to selection/ }));
    expect(emit).toHaveBeenCalledWith(EVENTS.ZOOM_SELECTION, {});
  });

  it("zoom in and zoom out go out as events too, so both palettes and this agree", () => {
    const { emit } = renderFooter();
    fireEvent.click(screen.getByTestId("footer-device-zoom"));
    fireEvent.click(screen.getByRole("button", { name: /Zoom in/ }));
    expect(emit).toHaveBeenCalledWith(EVENTS.ZOOM_IN, {});

    fireEvent.click(screen.getByTestId("footer-device-zoom"));
    fireEvent.click(screen.getByRole("button", { name: /Zoom out/ }));
    expect(emit).toHaveBeenCalledWith(EVENTS.ZOOM_OUT, {});
  });
});
