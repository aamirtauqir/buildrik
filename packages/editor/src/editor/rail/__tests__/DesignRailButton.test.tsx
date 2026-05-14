// @vitest-environment jsdom
/**
 * Design rail button — appears between Components and Settings.
 *
 * Task 5: DS panel must be reachable in 1 click. Verifies that:
 *   1. tabsConfig has design entry in the "config" zone.
 *   2. LeftSidebar rail renders Design button after Components and before Settings.
 */

import { describe, it, expect, vi, beforeAll } from "vitest";
import { render } from "@testing-library/react";

// Suspense tab bundles are lazy — stub them before the import chain runs.
vi.mock("../../sidebar/tabs/build", () => ({ BuildTab: () => null }));
vi.mock("../../sidebar/tabs/layers/LayersTab", () => ({ default: () => null }));
vi.mock("../../sidebar/tabs/pages/PagesTab", () => ({ default: () => null }));
vi.mock("../../sidebar/tabs/ComponentsTab", () => ({ default: () => null }));
vi.mock("../../sidebar/tabs/media/MediaTab", () => ({ MediaTab: () => null }));
vi.mock("../../sidebar/tabs/publish/PublishTab", () => ({ default: () => null }));
vi.mock("../../sidebar/tabs/history/HistoryTab", () => ({ default: () => null }));
vi.mock("../../sidebar/tabs/settings/SettingsTab", () => ({ default: () => null }));

import { GROUPED_TABS_CONFIG } from "../tabsConfig";
import { LeftSidebar } from "../../sidebar/LeftSidebar";

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

describe("Rail — Design entry", () => {
  it("tabsConfig registers design in config zone", () => {
    const design = GROUPED_TABS_CONFIG.find((t) => t.id === "design");
    expect(design).toBeDefined();
    expect(design?.zone).toBe("config");
    expect(design?.iconName).toBe("Palette");
  });

  it("renders Design between Components and Settings in rail", () => {
    const { container } = render(
      <LeftSidebar
        composer={null}
        activeTab="add"
        onTabChange={vi.fn()}
        drawerOpen={false}
        onDrawerToggle={vi.fn()}
      />
    );
    const buttons = Array.from(
      container.querySelectorAll<HTMLButtonElement>(".ls-rail button[data-tab]")
    );
    const tabs = buttons.map((b) => b.dataset.tab);
    const compIdx = tabs.indexOf("components");
    const designIdx = tabs.indexOf("design");
    const settingsIdx = tabs.indexOf("settings");
    expect(compIdx).toBeGreaterThanOrEqual(0);
    expect(designIdx).toBeGreaterThan(compIdx);
    expect(settingsIdx).toBeGreaterThan(designIdx);
  });
});
