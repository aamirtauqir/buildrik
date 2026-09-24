/**
 * QA 2026-09-24 (B6): Publish, Review and History render in the right column;
 * the closed drawer kept mounting a second, hidden copy (two subscriptions,
 * two fetches, stale state). The drawer mounts nothing for a column-hosted tab.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("../tabs/history/HistoryTab", () => ({ default: () => <div data-testid="history-copy" /> }));

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

const mount = (hostedInColumn: boolean) => {
  const composer = { emit: vi.fn(), on: vi.fn(), off: vi.fn() };
  return render(
    <ToastProvider>
      <LeftSidebar
        composer={composer as never}
        activeTab="history"
        onTabChange={vi.fn()}
        drawerOpen={false}
        hostedInColumn={hostedInColumn}
        onDrawerToggle={vi.fn()}
      />
    </ToastProvider>,
  );
};

describe("column-hosted tabs are not mounted in the drawer", () => {
  it("History in the right column: the drawer holds no copy of it", async () => {
    mount(true);
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.queryByTestId("history-copy")).toBeNull();
  });

  it("control: a drawer tab still mounts (the mock is reachable)", async () => {
    mount(false);
    expect(await screen.findByTestId("history-copy")).toBeInTheDocument();
  });
});
