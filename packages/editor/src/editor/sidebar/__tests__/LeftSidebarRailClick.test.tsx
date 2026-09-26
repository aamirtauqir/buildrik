// @vitest-environment jsdom
/**
 * LeftSidebar — rail click semantics.
 * Regression for the bug where clicking an already-active rail tab collapsed
 * the drawer with no visual cue, and a persisted isLeftPanelOpen:false left
 * the panel invisible across sessions.
 */

import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// Suspense tab bundles are lazy — stub them before the import chain runs
vi.mock("../tabs/build", () => ({ BuildTab: () => null }));
vi.mock("../tabs/layers/LayersTab", () => ({ default: () => null }));
vi.mock("../tabs/pages/PagesTab", () => ({ default: () => null }));
vi.mock("../tabs/ComponentsTab", () => ({ default: () => null }));
vi.mock("../tabs/media/MediaTab", () => ({ MediaTab: () => null }));
vi.mock("../tabs/publish/PublishTab", () => ({ default: () => null }));
vi.mock("../tabs/history/HistoryTab", () => ({ default: () => null }));
vi.mock("../tabs/settings/SettingsTab", () => ({ default: () => null }));

import { ToastProvider } from "@/editor/chrome-ui";
import { LeftSidebar } from "../LeftSidebar";
import type { Composer } from "@/engine/Composer";
import { EVENTS } from "@/shared/constants/events";

beforeAll(() => {
  if (typeof globalThis.window !== "undefined") {
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

function renderSidebar(overrides: {
  activeTab?: "add" | "layers" | "pages";
  drawerOpen?: boolean;
  onTabChange?: () => void;
  onDrawerToggle?: () => void;
}) {
  const onTabChange = overrides.onTabChange ?? vi.fn();
  const onDrawerToggle = overrides.onDrawerToggle ?? vi.fn();
  /* LeftSidebar reads useToast (the Components create door tells the user when
     nothing is selected), and useToast throws outside its provider. The app
     always has one — AquibraStudio wraps the whole studio in ToastProvider —
     so the provider belongs in the harness, not a fallback in the component. */
  render(
    <ToastProvider>
    <LeftSidebar
      composer={null}
      activeTab={overrides.activeTab ?? "layers"}
      onTabChange={onTabChange}
      drawerOpen={overrides.drawerOpen ?? true}
      onDrawerToggle={onDrawerToggle}
    />
    </ToastProvider>
  );
  return { onTabChange, onDrawerToggle };
}

describe("LeftSidebar rail click semantics", () => {
  // Post ISSUE-005: the active rail icon doubles as the drawer's close affordance.
  // The legacy outer `.ls-panel-close` × icon was removed; the inline PanelHeader
  // close X inside each tab is the only other way to dismiss the drawer.
  it("active tab click while drawer OPEN closes the drawer", () => {
    const { onTabChange, onDrawerToggle } = renderSidebar({
      activeTab: "layers",
      drawerOpen: true,
    });
    fireEvent.click(screen.getByRole("tab", { selected: true }));
    expect(onDrawerToggle).toHaveBeenCalledTimes(1);
    expect(onTabChange).not.toHaveBeenCalled();
  });

  it("active tab click while drawer CLOSED reopens the drawer", () => {
    const { onTabChange, onDrawerToggle } = renderSidebar({
      activeTab: "layers",
      drawerOpen: false,
    });
    // aria-selected is false when drawerOpen=false, so query by data-tab
    fireEvent.click(document.querySelector('[data-tab="layers"]') as HTMLElement);
    expect(onDrawerToggle).toHaveBeenCalledTimes(1);
    expect(onTabChange).not.toHaveBeenCalled();
  });

  it("different tab click while drawer OPEN switches tab, leaves drawer open", () => {
    const { onTabChange, onDrawerToggle } = renderSidebar({
      activeTab: "add",
      drawerOpen: true,
    });
    fireEvent.click(document.querySelector('[data-tab="layers"]') as HTMLElement);
    expect(onTabChange).toHaveBeenCalledWith("layers");
    expect(onDrawerToggle).not.toHaveBeenCalled();
  });

  /* The closed drawer is width 0 and opacity 0, but its whole tree stays
     mounted — every control inside kept its tab stop, so a keyboard user could
     Tab into an invisible panel and operate it. axe: aria-hidden-focus,
     serious. `inert` is what actually removes the tab stops; aria-hidden alone
     only lies to the AT about content the keyboard can still reach. */
  it("the closed drawer is inert, not merely hidden", () => {
    renderSidebar({ activeTab: "layers", drawerOpen: false });
    const panel = screen.getByTestId("sidebar-panel");
    expect(panel).toHaveAttribute("aria-hidden", "true");
    expect(panel).toHaveAttribute("inert");
  });

  it("the open drawer is not inert", () => {
    renderSidebar({ activeTab: "layers", drawerOpen: true });
    const panel = screen.getByTestId("sidebar-panel");
    expect(panel).toHaveAttribute("aria-hidden", "false");
    expect(panel).not.toHaveAttribute("inert");
  });

  it("different tab click while drawer CLOSED switches AND opens drawer", () => {
    const { onTabChange, onDrawerToggle } = renderSidebar({
      activeTab: "add",
      drawerOpen: false,
    });
    fireEvent.click(document.querySelector('[data-tab="layers"]') as HTMLElement);
    expect(onTabChange).toHaveBeenCalledWith("layers");
    expect(onDrawerToggle).toHaveBeenCalledTimes(1);
  });

  it("last-active rail button keeps highlight when drawer is closed", () => {
    renderSidebar({ activeTab: "layers", drawerOpen: false });
    const btn = document.querySelector('[data-tab="layers"]') as HTMLElement;
    expect(btn.classList.contains("ls-btn--active")).toBe(true);
    expect(btn.classList.contains("ls-btn--last")).toBe(true);
  });

  it("legacy outer .ls-panel-close button is never rendered", () => {
    // Removed in ISSUE-005 — the active rail icon owns the drawer toggle now.
    renderSidebar({ drawerOpen: true });
    expect(document.querySelector(".ls-panel-close")).toBeNull();
  });
});

// B-9: every rail tab was an equal Tab stop, so Tab walked all six before
// leaving the rail. Only the active tab is now in the Tab order.
describe("LeftSidebar rail — roving tabindex + tabpanel naming", () => {
  it("the active tab is tabIndex 0; the rest are -1", () => {
    renderSidebar({ activeTab: "layers", drawerOpen: true });
    expect(document.querySelector('[data-tab="layers"]')).toHaveAttribute("tabIndex", "0");
    expect(document.querySelector('[data-tab="add"]')).toHaveAttribute("tabIndex", "-1");
    expect(document.querySelector('[data-tab="pages"]')).toHaveAttribute("tabIndex", "-1");
  });

  it("the tabpanel is labelled by the active tab's button id", () => {
    renderSidebar({ activeTab: "pages", drawerOpen: true });
    const panel = screen.getByTestId("sidebar-panel");
    expect(panel).toHaveAttribute("aria-labelledby", "rail-tab-pages");
    expect(document.getElementById("rail-tab-pages")).not.toBeNull();
  });
});

/* Gap walk 93 #1: a rail letter only SWITCHED the tab. After Esc closed a
   right-column panel (isLeftPanelOpen false, tab kept), U → Esc → H switched
   to History into a closed column — nothing opened. A letter is a door, so it
   goes through the one open-this-tab event (ui:switch-tab), which switches
   AND opens, and applies the viewer gate — the same event I already uses. */
describe("LeftSidebar — rail letters open their tab", () => {
  it("a letter emits ui:switch-tab for its tab instead of only switching", () => {
    const emit = vi.fn();
    const onTabChange = vi.fn();
    render(
      <ToastProvider>
        <LeftSidebar
          composer={{ emit } as unknown as Composer}
          activeTab="publish"
          onTabChange={onTabChange}
          drawerOpen={false}
          onDrawerToggle={vi.fn()}
        />
      </ToastProvider>
    );
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "h" }));
    expect(emit).toHaveBeenCalledWith(EVENTS.UI_SWITCH_TAB, { tab: "history" });
    expect(onTabChange).not.toHaveBeenCalled();
  });
});
