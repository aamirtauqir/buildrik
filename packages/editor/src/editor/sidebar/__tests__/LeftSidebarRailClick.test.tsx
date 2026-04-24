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

import { LeftSidebar } from "../LeftSidebar";

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
  render(
    <LeftSidebar
      composer={null}
      activeTab={overrides.activeTab ?? "layers"}
      onTabChange={onTabChange}
      drawerOpen={overrides.drawerOpen ?? true}
      onDrawerToggle={onDrawerToggle}
    />
  );
  return { onTabChange, onDrawerToggle };
}

describe("LeftSidebar rail click semantics", () => {
  it("active tab click while drawer OPEN is a no-op", () => {
    const { onTabChange, onDrawerToggle } = renderSidebar({
      activeTab: "layers",
      drawerOpen: true,
    });
    fireEvent.click(screen.getByRole("tab", { selected: true }));
    expect(onDrawerToggle).not.toHaveBeenCalled();
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

  it("explicit close button invokes onDrawerToggle", () => {
    const { onDrawerToggle } = renderSidebar({ drawerOpen: true });
    const closeBtn = document.querySelector(".ls-panel-close") as HTMLElement;
    expect(closeBtn).not.toBeNull();
    fireEvent.click(closeBtn);
    expect(onDrawerToggle).toHaveBeenCalledTimes(1);
  });

  it("close button is not rendered when drawer is already closed", () => {
    renderSidebar({ drawerOpen: false });
    expect(document.querySelector(".ls-panel-close")).toBeNull();
  });
});
