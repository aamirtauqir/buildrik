/**
 * The rail's seventh item, Help — design-2l9 boards 263:255084 / 263:255509:
 * a two-row menu (Keyboard shortcuts ?, Getting started), Getting started
 * hidden in view mode. Re-baseline: rail Help (it opened the legend card).
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
import { EVENTS } from "@/shared/constants/events";
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

const mount = (composer: Record<string, unknown>, viewerChrome = false) =>
  render(
    <ToastProvider>
      <LeftSidebar composer={composer as never} activeTab="layers" onTabChange={vi.fn()} drawerOpen onDrawerToggle={vi.fn()} viewerChrome={viewerChrome} />
    </ToastProvider>,
  );

describe("rail Help", () => {
  it("sits at the foot of the rail and opens the Help menu: shortcuts sheet, tour, legend", () => {
    const composer = { emit: vi.fn(), on: vi.fn(), off: vi.fn() };
    mount(composer);
    const help = screen.getByTestId("rail-help");
    expect(help).toHaveTextContent("Help");
    expect(screen.getByTestId("rail").lastElementChild?.contains(help)).toBe(true);
    fireEvent.click(help);
    const rows = screen.getAllByRole("menuitem").map((r) => r.textContent?.replace(/\?$/, "").trim());
    expect(rows).toEqual(["Keyboard shortcuts", "Getting started", "Keyboard legend"]);
    fireEvent.click(screen.getByTestId("rail-help-shortcuts"));
    expect(composer.emit).toHaveBeenCalledWith(EVENTS.UI_TOGGLE_CHEAT_SHEET, {});
    expect(screen.queryByTestId("rail-help-menu")).toBeNull();
    fireEvent.click(help);
    fireEvent.click(screen.getByTestId("rail-help-getting-started"));
    expect(composer.emit).toHaveBeenCalledWith(EVENTS.UI_ONBOARDING_REPLAY, {});
    fireEvent.click(help);
    fireEvent.click(screen.getByTestId("rail-help-legend"));
    expect(composer.emit).toHaveBeenCalledWith(EVENTS.UI_TOGGLE_KEYBOARD_LEGEND, {});
  });

  it("hides Getting started in view mode and for a viewer (263:255509)", () => {
    const composer = { emit: vi.fn(), on: vi.fn(), off: vi.fn(), editLocks: new Set(["view"]) };
    const { unmount } = mount(composer);
    fireEvent.click(screen.getByTestId("rail-help"));
    expect(screen.queryByTestId("rail-help-getting-started")).toBeNull();
    unmount();
    mount({ emit: vi.fn(), on: vi.fn(), off: vi.fn() }, true);
    fireEvent.click(screen.getByTestId("rail-help"));
    expect(screen.queryByTestId("rail-help-getting-started")).toBeNull();
    expect(screen.getByTestId("rail-help-shortcuts")).toBeTruthy();
  });
});
