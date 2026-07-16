/**
 * sidebarAnalytics tests — no-op default provider, provider wiring with the
 * `sidebar.` prefix, and the window debug-flag console path. The provider is
 * module-level state, so each test re-imports a fresh module.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

declare global {
  interface Window {
    __SIDEBAR_ANALYTICS_DEBUG__?: boolean;
  }
}

beforeEach(() => {
  vi.resetModules();
  delete window.__SIDEBAR_ANALYTICS_DEBUG__;
});

afterEach(() => {
  delete window.__SIDEBAR_ANALYTICS_DEBUG__;
  vi.restoreAllMocks();
});

describe("trackSidebar", () => {
  it("is a silent no-op by default (no provider, no console output)", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const { trackSidebar } = await import("../sidebarAnalytics");

    expect(() => trackSidebar("panel_opened", { panel: "layers" })).not.toThrow();
    expect(log).not.toHaveBeenCalled();
  });

  it("dispatches through a configured provider with the sidebar. prefix", async () => {
    const { trackSidebar, setSidebarAnalyticsProvider } = await import("../sidebarAnalytics");
    const track = vi.fn();
    setSidebarAnalyticsProvider({ track });

    trackSidebar("panel_opened", { panel: "layers", pinned: true });

    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith("sidebar.panel_opened", { panel: "layers", pinned: true });
  });

  it("passes undefined properties through untouched", async () => {
    const { trackSidebar, setSidebarAnalyticsProvider } = await import("../sidebarAnalytics");
    const track = vi.fn();
    setSidebarAnalyticsProvider({ track });

    trackSidebar("tab_switch");
    expect(track).toHaveBeenCalledWith("sidebar.tab_switch", undefined);
  });

  it("logs to console when window.__SIDEBAR_ANALYTICS_DEBUG__ is set", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    window.__SIDEBAR_ANALYTICS_DEBUG__ = true;
    const { trackSidebar } = await import("../sidebarAnalytics");

    trackSidebar("drag_start", { item: "hero" });

    expect(log).toHaveBeenCalledWith("[sidebar-analytics]", "drag_start", { item: "hero" });
  });
});
