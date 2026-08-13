/**
 * useStudioState.test.ts — device/zoom defaults, panel-state persistence to
 * localStorage ("buildrick-panel-state"), navigation helpers, the 9 overlay
 * toggles + dev-mode master toggle, issues tracking, and dirty/save state.
 *
 * @license BSD-3-Clause
 */

import { renderHook, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useStudioState, type OverlayState } from "../useStudioState";

const PANEL_STATE_KEY = "buildrick-panel-state";

function readPersisted(): Record<string, unknown> | null {
  const raw = localStorage.getItem(PANEL_STATE_KEY);
  return raw ? JSON.parse(raw) : null;
}

describe("useStudioState", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  // Defaults -------------------------------------------------------------------
  describe("defaults (no persisted state)", () => {
    it("starts with desktop device and 100% zoom", () => {
      const { result } = renderHook(() => useStudioState());
      expect(result.current.device).toBe("desktop");
      expect(result.current.zoom).toBe(100);
    });

    it("starts with 'add' left tab, 'inspector' right tab, panel open", () => {
      const { result } = renderHook(() => useStudioState());
      expect(result.current.leftPanelTab).toBe("add");
      expect(result.current.rightPanelTab).toBe("inspector");
      expect(result.current.leftPanelSubTabs).toEqual({});
      expect(result.current.isLeftPanelOpen).toBe(true);
    });

    it("overlay defaults: guides + suggestions on, everything else off", () => {
      const { result } = renderHook(() => useStudioState());
      expect(result.current.overlays).toEqual({
        showComponentView: false,
        showXRay: false,
        showSpacingIndicators: false,
        showBadges: false,
        showGuides: true,
        showGrid: false,
        showRulers: false,
        devMode: false,
        showSuggestions: true,
      });
    });

    it("starts connected, clean, idle, with no issues and no undo/redo", () => {
      const { result } = renderHook(() => useStudioState());
      expect(result.current.syncStatus).toBe("connected");
      expect(result.current.issues).toEqual([]);
      expect(result.current.saveState).toEqual({
        status: "idle",
        lastSavedAt: undefined,
      });
      expect(result.current.isDirty).toBe(false);
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
    });
  });

  // Persistence ----------------------------------------------------------------
  describe("panel-state persistence", () => {
    it("persists leftPanelTab / subTabs / rightPanelTab to buildrick-panel-state", () => {
      const { result } = renderHook(() => useStudioState());
      act(() => {
        result.current.setLeftPanelTab("pages");
        result.current.setLeftPanelSubTabs({ pages: "list" });
        result.current.setRightPanelTab("styles");
      });
      expect(readPersisted()).toMatchObject({
        leftPanelTab: "pages",
        leftPanelSubTabs: { pages: "list" },
        rightPanelTab: "styles",
      });
    });

    /* Board 817:4649: "Toggles persist per-user per-project." They did not —
       every reload reset the canvas to guides-on and everything else off. */
    it("persists the canvas overlay toggles and restores them on mount", () => {
      const { result, unmount } = renderHook(() => useStudioState());
      act(() => result.current.toggleOverlay("showRulers"));
      act(() => result.current.toggleOverlay("showGuides"));
      expect(readPersisted()?.overlays).toMatchObject({ showRulers: true, showGuides: false });
      unmount();

      const remount = renderHook(() => useStudioState());
      expect(remount.result.current.overlays.showRulers).toBe(true);
      expect(remount.result.current.overlays.showGuides).toBe(false);
    });

    /* A payload written before overlays existed must not read as all-false —
       showGuides defaults on. */
    it("falls back to defaults for a stored payload with no overlays key", () => {
      localStorage.setItem(PANEL_STATE_KEY, JSON.stringify({ leftPanelTab: "pages" }));
      const { result } = renderHook(() => useStudioState());
      expect(result.current.overlays.showGuides).toBe(true);
      expect(result.current.overlays.showGrid).toBe(false);
    });

    it("restores persisted tabs on mount", () => {
      localStorage.setItem(
        PANEL_STATE_KEY,
        JSON.stringify({
          leftPanelTab: "layers",
          leftPanelSubTabs: { add: "blocks" },
          rightPanelTab: "styles",
        }),
      );
      const { result } = renderHook(() => useStudioState());
      expect(result.current.leftPanelTab).toBe("layers");
      expect(result.current.leftPanelSubTabs).toEqual({ add: "blocks" });
      expect(result.current.rightPanelTab).toBe("styles");
    });

    it("migrates a legacy tab id (elements → add) through panelStateMigration", () => {
      localStorage.setItem(
        PANEL_STATE_KEY,
        JSON.stringify({ leftPanelTab: "elements" }),
      );
      const { result } = renderHook(() => useStudioState());
      expect(result.current.leftPanelTab).toBe("add");
    });

    it("isLeftPanelOpen is NOT persisted and always starts true (stranded-panel guard)", () => {
      // Closed state is per-session only — persisting `false` stranded users
      // with an invisible panel (see initializer comment in useStudioState).
      localStorage.setItem(
        PANEL_STATE_KEY,
        JSON.stringify({ leftPanelTab: "pages", isLeftPanelOpen: false }),
      );
      const { result } = renderHook(() => useStudioState());
      expect(result.current.isLeftPanelOpen).toBe(true);

      act(() => {
        result.current.setIsLeftPanelOpen(false);
        // trigger the persistence effect via a tab change
        result.current.setLeftPanelTab("layers");
      });
      const persisted = readPersisted();
      expect(persisted).not.toBeNull();
      expect(persisted).not.toHaveProperty("isLeftPanelOpen");
    });

    it("survives corrupted localStorage JSON (falls back to defaults)", () => {
      localStorage.setItem(PANEL_STATE_KEY, "{not-json!!");
      const { result } = renderHook(() => useStudioState());
      expect(result.current.leftPanelTab).toBe("add");
      expect(result.current.rightPanelTab).toBe("inspector");
    });
  });

  // Navigation -----------------------------------------------------------------
  describe("navigation helpers", () => {
    it("openLeftPanelToTab opens the panel, sets tab and sub-tab", () => {
      const { result } = renderHook(() => useStudioState());
      act(() => result.current.setIsLeftPanelOpen(false));
      act(() => result.current.openLeftPanelToTab("design", "colors"));
      expect(result.current.isLeftPanelOpen).toBe(true);
      expect(result.current.leftPanelTab).toBe("design");
      expect(result.current.leftPanelSubTabs).toEqual({ design: "colors" });
    });

    it("openLeftPanelToTab without a sub-tab leaves subTabs untouched", () => {
      const { result } = renderHook(() => useStudioState());
      act(() => result.current.setLeftPanelSubTabs({ add: "blocks" }));
      act(() => result.current.openLeftPanelToTab("pages"));
      expect(result.current.leftPanelSubTabs).toEqual({ add: "blocks" });
    });

    it("openBlocks / openPages / openLayers target add / pages / layers", () => {
      const { result } = renderHook(() => useStudioState());
      act(() => result.current.openBlocks());
      expect(result.current.leftPanelTab).toBe("add");
      act(() => result.current.openPages());
      expect(result.current.leftPanelTab).toBe("pages");
      act(() => result.current.openLayers());
      expect(result.current.leftPanelTab).toBe("layers");
    });

    it("openLeftPanel re-opens a closed panel", () => {
      const { result } = renderHook(() => useStudioState());
      act(() => result.current.setIsLeftPanelOpen(false));
      act(() => result.current.openLeftPanel());
      expect(result.current.isLeftPanelOpen).toBe(true);
    });
  });

  // Overlays -------------------------------------------------------------------
  describe("overlay toggles", () => {
    const ALL_OVERLAYS: (keyof OverlayState)[] = [
      "showComponentView",
      "showXRay",
      "showSpacingIndicators",
      "showBadges",
      "showGuides",
      "showGrid",
      "showRulers",
      "devMode",
      "showSuggestions",
    ];

    it.each(ALL_OVERLAYS)("toggleOverlay('%s') flips only that flag", (key) => {
      const { result } = renderHook(() => useStudioState());
      const before = { ...result.current.overlays };
      act(() => result.current.toggleOverlay(key));
      expect(result.current.overlays[key]).toBe(!before[key]);
      // every other flag is unchanged
      for (const other of ALL_OVERLAYS) {
        if (other === key) continue;
        expect(result.current.overlays[other]).toBe(before[other]);
      }
      act(() => result.current.toggleOverlay(key));
      expect(result.current.overlays[key]).toBe(before[key]);
    });

    it("toggleDevMode ON enables grid/guides/spacing/badges/componentView", () => {
      const { result } = renderHook(() => useStudioState());
      act(() => result.current.toggleDevMode());
      expect(result.current.overlays).toMatchObject({
        devMode: true,
        showGrid: true,
        showGuides: true,
        showSpacingIndicators: true,
        showBadges: true,
        showComponentView: true,
      });
    });

    it("toggleDevMode OFF disables the dev feature set again", () => {
      const { result } = renderHook(() => useStudioState());
      act(() => result.current.toggleDevMode());
      act(() => result.current.toggleDevMode());
      expect(result.current.overlays).toMatchObject({
        devMode: false,
        showGrid: false,
        showGuides: false,
        showSpacingIndicators: false,
        showBadges: false,
        showComponentView: false,
      });
    });
  });

  // Issues ---------------------------------------------------------------------
  describe("issues tracking", () => {
    it("addIssue assigns a unique id; removeIssue removes by id; clearIssues empties", () => {
      const { result } = renderHook(() => useStudioState());
      act(() => {
        result.current.addIssue({ type: "error", message: "broken link" });
        result.current.addIssue({ type: "warning", message: "big image" });
      });
      expect(result.current.issues).toHaveLength(2);
      const [a, b] = result.current.issues;
      expect(a.id).toBeTruthy();
      expect(a.id).not.toBe(b.id);
      expect(a).toMatchObject({ type: "error", message: "broken link" });

      act(() => result.current.removeIssue(a.id));
      expect(result.current.issues).toHaveLength(1);
      expect(result.current.issues[0].message).toBe("big image");

      act(() => result.current.clearIssues());
      expect(result.current.issues).toEqual([]);
    });
  });

  // Dirty / save ---------------------------------------------------------------
  describe("dirty + save state", () => {
    it("markDirty / markClean flip isDirty", () => {
      const { result } = renderHook(() => useStudioState());
      act(() => result.current.markDirty());
      expect(result.current.isDirty).toBe(true);
      act(() => result.current.markClean());
      expect(result.current.isDirty).toBe(false);
    });

    it("setSaveState transitions status", () => {
      const { result } = renderHook(() => useStudioState());
      act(() =>
        result.current.setSaveState({ status: "saving", lastSavedAt: 5 }),
      );
      expect(result.current.saveState).toEqual({ status: "saving", lastSavedAt: 5 });
    });

    it("setDevice / setZoom update device state", () => {
      const { result } = renderHook(() => useStudioState());
      act(() => {
        result.current.setDevice("mobile");
        result.current.setZoom(75);
      });
      expect(result.current.device).toBe("mobile");
      expect(result.current.zoom).toBe(75);
    });
  });
});
