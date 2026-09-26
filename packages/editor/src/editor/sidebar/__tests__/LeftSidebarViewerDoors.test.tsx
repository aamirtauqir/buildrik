/**
 * X-8 (live verify 2026-09-26) — FC-9 let a VIEWER open History, Review and
 * Activity read-only, but a viewer had no door to any of them: all three are
 * off-rail, the site menu collapses to "View only" in view mode, and the one
 * door that did route (the H shortcut) switched to a tab that rendered
 * nowhere. The viewer's rail now carries the VIEWER_TABS surfaces the six-item
 * Figma rail leaves out, below a divider; Review only when the server's review
 * layer is on (FB-4).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("../tabs/build", () => ({ BuildTab: () => null }));
vi.mock("../tabs/layers/LayersTab", () => ({ default: () => null }));
vi.mock("../tabs/pages/PagesTab", () => ({ default: () => null }));

import { ToastProvider } from "@/editor/chrome-ui";
import { LeftSidebar } from "../LeftSidebar";

beforeAll(() => {
  window.history.replaceState({}, "", "/");
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn((query: string) => ({
      matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(),
      addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
    })),
  });
});

function renderRail(props: { viewerChrome?: boolean; reviewsEnabled?: boolean; onTabChange?: (t: string) => void }) {
  const composer = { emit: vi.fn(), on: vi.fn(), off: vi.fn() };
  render(
    <ToastProvider>
      <LeftSidebar
        composer={composer as never}
        activeTab="layers"
        onTabChange={props.onTabChange ?? vi.fn()}
        drawerOpen
        onDrawerToggle={vi.fn()}
        viewerChrome={props.viewerChrome}
        reviewsEnabled={props.reviewsEnabled}
      />
    </ToastProvider>,
  );
}

describe("X-8 — a VIEWER's rail has doors to the read-only panels", () => {
  it("shows History, Review and Activity on a viewer's rail, and a click opens the tab", () => {
    const onTabChange = vi.fn();
    renderRail({ viewerChrome: true, reviewsEnabled: true, onTabChange });
    for (const id of ["history", "review", "activity"]) {
      expect(screen.getByTestId(`rail-tab-${id}`)).toBeInTheDocument();
    }
    fireEvent.click(screen.getByTestId("rail-tab-history"));
    expect(onTabChange).toHaveBeenCalledWith("history");
    fireEvent.click(screen.getByTestId("rail-tab-activity"));
    expect(onTabChange).toHaveBeenCalledWith("activity");
  });

  it("leaves Review off when the server's review layer is off (FB-4)", () => {
    renderRail({ viewerChrome: true, reviewsEnabled: false });
    expect(screen.getByTestId("rail-tab-history")).toBeInTheDocument();
    expect(screen.queryByTestId("rail-tab-review")).toBeNull();
  });

  it("keeps the six-item Figma rail for everyone else", () => {
    renderRail({ reviewsEnabled: true });
    const ids = Array.from(screen.getByTestId("rail").querySelectorAll('[role="tab"]')).map((b) =>
      b.getAttribute("data-tab"),
    );
    expect(ids).toEqual(["add", "layers", "pages", "assets", "content", "design"]);
  });
});
