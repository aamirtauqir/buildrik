import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePanelState } from "../usePanelState";

const STORAGE_KEY = "aqb-panel-state";

describe("usePanelState", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns default state when no saved state", () => {
    const { result } = renderHook(() => usePanelState());
    expect(result.current.leftPanelTab).toBe("add");
    expect(result.current.rightPanelTab).toBe("inspector");
    expect(result.current.isLeftPanelOpen).toBe(false);
    expect(result.current.panelPinned).toBe(true);
  });

  it("restores saved state from localStorage", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        leftPanelTab: "layers",
        rightPanelTab: "inspector",
        isLeftPanelOpen: true,
        panelPinned: false,
      })
    );
    const { result } = renderHook(() => usePanelState());
    expect(result.current.leftPanelTab).toBe("layers");
    expect(result.current.isLeftPanelOpen).toBe(true);
    expect(result.current.panelPinned).toBe(false);
  });

  it("falls back to defaults on corrupted localStorage JSON", () => {
    localStorage.setItem(STORAGE_KEY, "not-valid-json{{{");
    const { result } = renderHook(() => usePanelState());
    expect(result.current.leftPanelTab).toBe("add");
  });

  it("migrates legacy tab IDs from localStorage", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ leftPanelTab: "elements" })
    );
    const { result } = renderHook(() => usePanelState());
    expect(result.current.leftPanelTab).toBe("add");
  });

  it("migrates phantom 'build' tab ID", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ leftPanelTab: "build" })
    );
    const { result } = renderHook(() => usePanelState());
    expect(result.current.leftPanelTab).toBe("add");
  });

  it("derives isFullPageMode from active tab config", () => {
    const { result } = renderHook(() => usePanelState());
    // "add" is panel mode
    expect(result.current.isFullPageMode).toBe(false);

    act(() => result.current.setLeftPanelTab("templates"));
    expect(result.current.isFullPageMode).toBe(true);

    act(() => result.current.setLeftPanelTab("settings"));
    expect(result.current.isFullPageMode).toBe(true);

    act(() => result.current.setLeftPanelTab("layers"));
    expect(result.current.isFullPageMode).toBe(false);
  });

  it("derives drawerWidth from active tab config", () => {
    const { result } = renderHook(() => usePanelState());
    // "add" has panelWidth 280
    expect(result.current.drawerWidth).toBe(280);

    act(() => result.current.setLeftPanelTab("layers"));
    expect(result.current.drawerWidth).toBe(200);

    act(() => result.current.setLeftPanelTab("pages"));
    expect(result.current.drawerWidth).toBe(200);
  });

  it("openLeftPanelToTab sets tab and opens panel", () => {
    const { result } = renderHook(() => usePanelState());
    expect(result.current.isLeftPanelOpen).toBe(false);

    act(() => result.current.openLeftPanelToTab("layers"));
    expect(result.current.isLeftPanelOpen).toBe(true);
    expect(result.current.leftPanelTab).toBe("layers");
  });

  it("openLeftPanelToTab with subTab updates subTabs", () => {
    const { result } = renderHook(() => usePanelState());
    act(() => result.current.openLeftPanelToTab("add", "sections"));
    expect(result.current.leftPanelSubTabs.add).toBe("sections");
  });

  it("openBlocks navigates to add tab", () => {
    const { result } = renderHook(() => usePanelState());
    act(() => result.current.openBlocks());
    expect(result.current.leftPanelTab).toBe("add");
    expect(result.current.isLeftPanelOpen).toBe(true);
  });

  it("openPages navigates to pages tab", () => {
    const { result } = renderHook(() => usePanelState());
    act(() => result.current.openPages());
    expect(result.current.leftPanelTab).toBe("pages");
    expect(result.current.isLeftPanelOpen).toBe(true);
  });

  it("openLayers navigates to layers tab", () => {
    const { result } = renderHook(() => usePanelState());
    act(() => result.current.openLayers());
    expect(result.current.leftPanelTab).toBe("layers");
    expect(result.current.isLeftPanelOpen).toBe(true);
  });

  it("persists state changes to localStorage", () => {
    const { result } = renderHook(() => usePanelState());
    act(() => result.current.setLeftPanelTab("layers"));

    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    expect(saved.leftPanelTab).toBe("layers");
  });

  it("handles localStorage quota exceeded gracefully", () => {
    // Mock storage to throw
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = vi.fn(() => {
      throw new DOMException("QuotaExceededError");
    });

    const { result } = renderHook(() => usePanelState());
    // Should not throw
    act(() => result.current.setLeftPanelTab("layers"));
    expect(result.current.leftPanelTab).toBe("layers");

    Storage.prototype.setItem = originalSetItem;
  });

  it("setPanelPinned updates pinned state", () => {
    const { result } = renderHook(() => usePanelState());
    expect(result.current.panelPinned).toBe(true);
    act(() => result.current.setPanelPinned(false));
    expect(result.current.panelPinned).toBe(false);
  });
});
