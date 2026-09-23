/**
 * C5 G1-089 — every v3 shell board ends the rail with "? Help", the door to
 * the one keyboard sheet (B7).
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

describe("rail Help", () => {
  it("sits at the foot of the rail and opens the keyboard legend (board 4418:126882)", () => {
    const composer = { emit: vi.fn(), on: vi.fn(), off: vi.fn() };
    render(
      <ToastProvider>
        <LeftSidebar composer={composer as never} activeTab="layers" onTabChange={vi.fn()} drawerOpen onDrawerToggle={vi.fn()} />
      </ToastProvider>,
    );
    const help = screen.getByTestId("rail-help");
    expect(help).toHaveTextContent("Help");
    expect(screen.getByTestId("rail").lastElementChild?.contains(help)).toBe(true);
    fireEvent.click(help);
    expect(composer.emit).toHaveBeenCalledWith(EVENTS.UI_TOGGLE_KEYBOARD_LEGEND, {});
  });
});
