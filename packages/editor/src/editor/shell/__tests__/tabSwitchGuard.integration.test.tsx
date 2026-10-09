/**
 * B-1 fix — the real doors, not the hook in isolation: ⌘H (through
 * useEditorShortcuts) and UI_PANEL_OPEN (through useEditorEventListeners)
 * wired to the guarded sinks exactly as AquibraStudio wires them, with a
 * dirty Settings entry in the shell registry → the confirm appears and the
 * tab does not change until "Leave and lose changes".
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { render, screen, fireEvent, act, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { shellDirty } from "../shellDirtyRegistry";
import { useTabSwitchGuard } from "../hooks/useTabSwitchGuard";
import { useEditorShortcuts } from "../hooks/useEditorShortcuts";
import { useEditorEventListeners } from "../hooks/useEditorEventListeners";
import { UnsavedTabSwitchDialog } from "../modals/UnsavedTabSwitchDialog";
import { EVENTS } from "@/shared/constants/events";
import type { Composer } from "@/engine/Composer";

function makeComposer() {
  const handlers = new Map<string, Set<(p?: unknown) => void>>();
  return {
    history: { undo: vi.fn(), redo: vi.fn() },
    elements: { getAllElements: vi.fn(() => []) },
    canvas: { indicators: { getOverlay: vi.fn(() => ({ showSpacing: false, showBadges: false, showGuides: true, showGrid: false })) } },
    on: vi.fn((ev: string, fn: (p?: unknown) => void) => {
      if (!handlers.has(ev)) handlers.set(ev, new Set());
      handlers.get(ev)!.add(fn);
    }),
    off: vi.fn((ev: string, fn: (p?: unknown) => void) => {
      handlers.get(ev)?.delete(fn);
    }),
    emit: vi.fn((ev: string, p?: unknown) => {
      handlers.get(ev)?.forEach((fn) => fn(p));
    }),
  };
}

function Harness({ composer }: { composer: ReturnType<typeof makeComposer> }) {
  const [leftPanelTab, setTab] = React.useState("settings");
  const [leftPanelSubTabs, setSubTabs] = React.useState<Record<string, string>>({});
  const setLeftPanelTab = React.useCallback((tab: string) => setTab(tab), []);
  const openLeftPanelToTab = React.useCallback((tab: string, sub?: string) => {
    setTab(tab);
    setSubTabs((prev) => (sub ? { ...prev, [tab]: sub } : prev));
  }, []);
  const guarded = useTabSwitchGuard({
    leftPanelTab,
    leftPanelSubTabs,
    setLeftPanelTab,
    openLeftPanelToTab,
    isTabAllowed: () => true,
    onDiscardFailed: () => {},
    isLeftPanelOpen: true,
    setIsLeftPanelOpen: () => {},
  });
  const c = composer as unknown as Composer;
  useEditorShortcuts({
    composer: c,
    modals: { setShowShortcuts: vi.fn() },
    saveProject: vi.fn(),
    openLeftPanelToTab: guarded.openLeftPanelToTab,
    openSiteSettings: () => guarded.openLeftPanelToTab("settings"),
  });
  useEditorEventListeners({
    composer: c,
    addToast: vi.fn(() => "toast-id"),
    modals: {
      openCreateComponent: vi.fn(),
      openSaveAsComponent: vi.fn(),
      openSaveTemplate: vi.fn(),
      toggleShortcuts: vi.fn(),
    },
    state: {
      openLeftPanelToTab: guarded.openLeftPanelToTab,
      setShowSpacingIndicators: vi.fn(),
      setShowBadges: vi.fn(),
      setShowGuides: vi.fn(),
      setShowGrid: vi.fn(),
    },
  });
  return (
    <>
      <output data-testid="tab">{leftPanelTab}</output>
      <UnsavedTabSwitchDialog {...guarded.dialogProps} />
    </>
  );
}

describe("B-1 — real doors with a dirty Settings entry", () => {
  afterEach(() => {
    cleanup();
    act(() => shellDirty.set("settings", false));
  });

  it("⌘H prompts; the tab stays on Settings until Leave and lose changes", () => {
    act(() => shellDirty.set("settings", true));
    render(<Harness composer={makeComposer()} />);
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "h", metaKey: true, cancelable: true, bubbles: true }));
    });
    expect(screen.getByTestId("tab-switch-unsaved")).toBeTruthy();
    expect(screen.getByTestId("tab").textContent).toBe("settings");
    fireEvent.click(screen.getByTestId("tab-switch-unsaved-leave"));
    expect(screen.getByTestId("tab").textContent).toBe("history");
  });

  it("UI_PANEL_OPEN prompts; Keep editing stays on Settings", () => {
    act(() => shellDirty.set("settings", true));
    const composer = makeComposer();
    render(<Harness composer={composer} />);
    act(() => composer.emit(EVENTS.UI_PANEL_OPEN, { panel: "pages" }));
    expect(screen.getByTestId("tab-switch-unsaved")).toBeTruthy();
    fireEvent.click(screen.getByTestId("tab-switch-unsaved-keep"));
    expect(screen.getByTestId("tab").textContent).toBe("settings");
    expect(shellDirty.get()).toBe(true);
  });

  it("clean registry: ⌘H switches straight through, no prompt", () => {
    render(<Harness composer={makeComposer()} />);
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "h", metaKey: true, cancelable: true, bubbles: true }));
    });
    expect(screen.queryByTestId("tab-switch-unsaved")).toBeNull();
    expect(screen.getByTestId("tab").textContent).toBe("history");
  });
});
