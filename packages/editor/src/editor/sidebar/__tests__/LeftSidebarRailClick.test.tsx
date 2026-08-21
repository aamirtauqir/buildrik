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

beforeAll(() => {
  // These specs guard the LEGACY 11-tab rail (?rail=legacy escape hatch).
  // fourToolRail is the default since the E3 rail redesign — without this
  // pin, LeftSidebar renders FourToolRail and every legacy button is absent.
  window.history.replaceState({}, "", "/?rail=legacy");
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
