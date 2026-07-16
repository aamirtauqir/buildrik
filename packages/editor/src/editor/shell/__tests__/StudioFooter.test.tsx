/**
 * StudioFooter.test.tsx — zoom preset stepping bounded 25–200, device
 * dimension labels, sync status, breadcrumb, and the E3 structure button.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { StudioFooter, type StudioFooterProps } from "../StudioFooter";
import type { Composer } from "../../../engine";
import type { DeviceType } from "../../../shared/types";

function makeComposer() {
  return { setZoom: vi.fn() };
}

function makeProps(over: Partial<StudioFooterProps> = {}): StudioFooterProps {
  return {
    composer: makeComposer() as unknown as Composer,
    device: "desktop",
    zoom: 100,
    onZoomChange: vi.fn(),
    selectedElement: null,
    ...over,
  };
}

afterEach(() => {
  cleanup();
  window.history.replaceState({}, "", "/");
});

describe("StudioFooter", () => {
  // ── device dimension labels ────────────────────────────────────────────────
  describe("device dimensions", () => {
    it.each([
      ["wide", "1440 × 900"],
      ["desktop", "1280 × 800"],
      ["tablet", "768 × 1024"],
      ["mobile", "375 × 812"],
    ] as [DeviceType, string][])("%s → %s", (device, label) => {
      render(<StudioFooter {...makeProps({ device })} />);
      expect(screen.getByText(label)).toBeInTheDocument();
    });

    it("unmapped device (watch) falls back to '—'", () => {
      render(<StudioFooter {...makeProps({ device: "watch" })} />);
      expect(screen.getByText("—")).toBeInTheDocument();
    });
  });

  // ── zoom stepping ──────────────────────────────────────────────────────────
  describe("zoom preset stepping (25–200)", () => {
    it("renders the current zoom as a rounded percent", () => {
      render(<StudioFooter {...makeProps({ zoom: 99.6 })} />);
      expect(screen.getByText("100%")).toBeInTheDocument();
    });

    it("zoom in steps to the next preset and forwards to composer", () => {
      const onZoomChange = vi.fn();
      const composer = makeComposer();
      render(
        <StudioFooter
          {...makeProps({ zoom: 100, onZoomChange, composer: composer as unknown as Composer })}
        />
      );
      fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));
      expect(onZoomChange).toHaveBeenCalledWith(125);
      expect(composer.setZoom).toHaveBeenCalledWith(125);
    });

    it("zoom out steps to the previous preset", () => {
      const onZoomChange = vi.fn();
      render(<StudioFooter {...makeProps({ zoom: 100, onZoomChange })} />);
      fireEvent.click(screen.getByRole("button", { name: "Zoom out" }));
      expect(onZoomChange).toHaveBeenCalledWith(75);
    });

    it("non-preset zoom snaps to the nearest presets in each direction", () => {
      const onZoomChange = vi.fn();
      const { rerender, unmount } = render(
        <StudioFooter {...makeProps({ zoom: 110, onZoomChange })} />
      );
      fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));
      expect(onZoomChange).toHaveBeenLastCalledWith(125);
      rerender(<StudioFooter {...makeProps({ zoom: 110, onZoomChange })} />);
      fireEvent.click(screen.getByRole("button", { name: "Zoom out" }));
      expect(onZoomChange).toHaveBeenLastCalledWith(100);
      unmount();
    });

    it("zoom in is disabled at the 200 ceiling", () => {
      render(<StudioFooter {...makeProps({ zoom: 200 })} />);
      expect(screen.getByRole("button", { name: "Zoom in" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "Zoom out" })).toBeEnabled();
    });

    it("zoom out is disabled at the 25 floor", () => {
      render(<StudioFooter {...makeProps({ zoom: 25 })} />);
      expect(screen.getByRole("button", { name: "Zoom out" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "Zoom in" })).toBeEnabled();
    });

    it("zoom-out below the lowest preset clamps to 25", () => {
      const onZoomChange = vi.fn();
      render(<StudioFooter {...makeProps({ zoom: 30, onZoomChange })} />);
      fireEvent.click(screen.getByRole("button", { name: "Zoom out" }));
      expect(onZoomChange).toHaveBeenCalledWith(25);
    });

    it("zoom-in above the highest preset clamps to 200", () => {
      // zoom prop can arrive above the presets (e.g. pinch); the buttons still
      // clamp into the 25–200 band. At 210, Zoom in is disabled (>=200), and
      // Zoom out steps back to the highest preset below.
      const onZoomChange = vi.fn();
      render(<StudioFooter {...makeProps({ zoom: 210, onZoomChange })} />);
      expect(screen.getByRole("button", { name: "Zoom in" })).toBeDisabled();
      fireEvent.click(screen.getByRole("button", { name: "Zoom out" }));
      expect(onZoomChange).toHaveBeenCalledWith(200);
    });
  });

  // ── status + breadcrumb ────────────────────────────────────────────────────
  it("shows 'Connected · main' when synced, 'Offline' when not", () => {
    const { rerender } = render(<StudioFooter {...makeProps({ syncConnected: true })} />);
    expect(screen.getByText("Connected · main")).toBeInTheDocument();
    rerender(<StudioFooter {...makeProps({ syncConnected: false })} />);
    expect(screen.getByText("Offline")).toBeInTheDocument();
  });

  it("breadcrumb shows body alone or body › tag of the selection", () => {
    const { rerender } = render(<StudioFooter {...makeProps()} />);
    expect(screen.getByTitle("body")).toBeInTheDocument();
    rerender(
      <StudioFooter
        {...makeProps({ selectedElement: { id: "e1", type: "section", tagName: "header" } })}
      />
    );
    expect(screen.getByTitle("body › header")).toBeInTheDocument();
    rerender(
      <StudioFooter {...makeProps({ selectedElement: { id: "e1", type: "section" } })} />
    );
    expect(screen.getByTitle("body › section")).toBeInTheDocument();
  });

  // ── E3 structure button ────────────────────────────────────────────────────
  it("Structure button only exists in the E3 4-tool rail mode", () => {
    const onOpenStructure = vi.fn();
    const { unmount } = render(<StudioFooter {...makeProps({ onOpenStructure })} />);
    expect(screen.queryByRole("button", { name: "Page structure" })).toBeNull();
    unmount();

    window.history.replaceState({}, "", "/?rail=e3");
    render(<StudioFooter {...makeProps({ onOpenStructure })} />);
    const btn = screen.getByRole("button", { name: "Page structure" });
    fireEvent.click(btn);
    expect(onOpenStructure).toHaveBeenCalledTimes(1);
  });
});
