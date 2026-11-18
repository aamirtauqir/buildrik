/** Audit evidence only: assertions describe required behavior; failures remain unfixed. */
import React from "react";
import { act, cleanup, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Composer } from "@/engine";
import { ResizeHandler } from "@/engine/canvas/ResizeHandler";
import { GuidesOverlay } from "@/editor/canvas/overlays/GuidesOverlay";
import { CanvasFooterToolbar } from "@/editor/canvas/CanvasFooterToolbar";
import { useCanvasGuides } from "@/editor/canvas/hooks/useCanvasGuides";
import type { ProjectSettings } from "@/shared/types";

afterEach(() => { cleanup(); vi.useRealTimers(); document.body.innerHTML = ""; });

function fixture() {
  let settings: ProjectSettings = {};
  const composer = {
    getProjectSettings: () => settings,
    setProjectSettings: vi.fn((next: ProjectSettings) => { settings = next; }),
    on: vi.fn(), off: vi.fn(),
  };
  return { composer: composer as unknown as Composer, read: () => settings };
}

describe("Canvas targeted acceptance, 2026-10-19", () => {
  it("decimal custom-grid input does not silently apply a different integer", () => {
    const change = vi.fn();
    render(<CanvasFooterToolbar overlays={{ guides: false, spacing: false, grid: true, rulers: false, badges: false, xray: false }} zoom={100} gridSize={7} onGridSizeChange={change} onOverlayChange={vi.fn()} onZoomChange={vi.fn()} />);
    fireEvent.click(screen.getByTestId("canvas-view-menu-trigger"));
    fireEvent.click(screen.getByTestId("canvas-view-grid"));
    const input = screen.getByTestId("canvas-grid-size-custom");
    fireEvent.change(input, { target: { value: "1.5" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(change).not.toHaveBeenCalled();
  });

  it("resize uses the configured 7px grid", () => {
    document.body.innerHTML = '<div class="buildrick-canvas"><div data-buildrick-id="audit-el"></div></div>';
    const node = document.querySelector('[data-buildrick-id="audit-el"]') as HTMLElement;
    node.getBoundingClientRect = () => ({ x: 0, y: 0, top: 0, left: 0, right: 200, bottom: 100, width: 200, height: 100, toJSON: () => ({}) }) as DOMRect;
    const element = { getType: () => "container", getId: () => "audit-el", getStyles: () => ({}) };
    const h = new ResizeHandler({
      elements: { getElement: () => element }, getState: () => ({ snapToGrid: true, gridSize: 7 }),
      emit: vi.fn(), on: vi.fn(), off: vi.fn(), beginTransaction: vi.fn(), endTransaction: vi.fn(),
    } as never);
    expect(h.startResize("audit-el", "se", 200, 100)).toBe(true);
    expect(h.getResizeState()?.snap.gridSize).toBe(7);
  });

  it("locked guide refuses double-click removal through the real hook", () => {
    vi.useFakeTimers();
    const f = fixture();
    f.composer.setProjectSettings({ canvasGuides: [{ id: "locked", type: "vertical", position: 40, locked: true }] });
    function Fixture() {
      const g = useCanvasGuides({ composer: f.composer, enabled: true });
      return <GuidesOverlay guides={g.guides} zoom={100} onDragGuide={g.updateGuide} onRemoveGuide={g.removeGuide} />;
    }
    const { container } = render(<Fixture />);
    fireEvent.doubleClick(container.querySelector('[style*="not-allowed"]')!);
    act(() => vi.advanceTimersByTime(300));
    expect(f.read().canvasGuides?.map(g => g.id)).toEqual(["locked"]);
  });

  it("locked guide refuses dragging", () => {
    const drag = vi.fn();
    const { container } = render(<GuidesOverlay guides={[{ id: "locked", type: "vertical", position: 40, locked: true }]} zoom={100} onDragGuide={drag} onRemoveGuide={vi.fn()} />);
    fireEvent.mouseDown(container.querySelector('[style*="not-allowed"]')!, { clientX: 40 });
    fireEvent.mouseMove(document, { clientX: 100 });
    fireEvent.mouseUp(document);
    expect(drag).not.toHaveBeenCalled();
  });

  it("retains an edit when the hook unmounts before the 300ms write", () => {
    vi.useFakeTimers();
    const f = fixture();
    const { result, unmount } = renderHook(() => useCanvasGuides({ composer: f.composer, enabled: true }));
    act(() => result.current.addGuide("vertical", 73));
    act(() => vi.advanceTimersByTime(100));
    unmount();
    act(() => vi.advanceTimersByTime(1000));
    expect(f.read().canvasGuides?.map(g => g.position)).toEqual([73]);
  });

  it("hiding then showing rulers preserves a guide and allows its pending write", () => {
    vi.useFakeTimers();
    const f = fixture();
    const { result, rerender } = renderHook(({ enabled }) => useCanvasGuides({ composer: f.composer, enabled }), { initialProps: { enabled: true } });
    act(() => result.current.addGuide("horizontal", 81));
    rerender({ enabled: false });
    expect(result.current.guides).toEqual([]);
    act(() => vi.advanceTimersByTime(300));
    expect(f.read().canvasGuides?.[0].position).toBe(81);
    rerender({ enabled: true });
    expect(result.current.guides[0].position).toBe(81);
  });
});
