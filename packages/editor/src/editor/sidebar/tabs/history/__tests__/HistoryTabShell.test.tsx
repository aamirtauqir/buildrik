/**
 * HistoryTab shell tests — verifies the prototype-aligned chrome:
 *   - View switcher (Changes default, Saves second)
 *   - Helper text under each tab
 *   - Search bar with prototype markup
 *   - Time-Travel scrubber toggles via Ctrl+Shift+T
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import * as React from "react";

// Mock the heavy panels/hooks so this test focuses on shell behavior.
vi.mock("../../../../panels/VersionHistoryPanel", () => ({
  VersionHistoryPanel: () => <div data-testid="saves-panel">SAVES</div>,
}));

vi.mock("../components/ActivityView", () => ({
  ActivityView: ({ onOpenTimeTravel }: { onOpenTimeTravel?: () => void }) => (
    <div data-testid="activity-view">
      <button data-testid="tt-trigger" onClick={() => onOpenTimeTravel?.()}>
        open-tt
      </button>
    </div>
  ),
}));

vi.mock("../components/TimeTravelScrubber", () => ({
  TimeTravelScrubber: () => <div data-testid="tt-scrubber">SCRUBBER</div>,
}));

vi.mock("../components/MilestoneSuggestionBanner", () => ({
  MilestoneSuggestionBanner: () => <div data-testid="milestone-banner" />,
}));

vi.mock("../../../shared/PanelHeader", () => ({
  PanelHeader: ({ title }: { title: string }) => <header>{title}</header>,
}));

vi.mock("../../../../../shared/hooks/useHistoryState", () => ({
  useHistoryState: () => ({
    historyStack: [],
    canUndo: false,
    canRedo: false,
    undo: vi.fn(),
    redo: vi.fn(),
    clear: vi.fn(),
    isLoading: false,
  }),
}));

vi.mock("../../../../../shared/hooks/useAutoMilestone", () => ({
  useAutoMilestone: () => ({
    suggestion: null,
    isLoading: false,
    dismiss: vi.fn(),
    accept: vi.fn(),
    edit: vi.fn(),
    isAvailable: false,
  }),
}));

import { HistoryTab } from "../HistoryTab";

const renderTab = () =>
  render(
    <HistoryTab
      composer={null}
      isPinned={false}
      onPinToggle={() => {}}
      onHelpClick={() => {}}
      onClose={() => {}}
    />
  );

describe("HistoryTab shell", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });
  afterEach(cleanup);

  it("renders Changes view by default with both tabs visible", () => {
    renderTab();
    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(2);
    expect(tabs[0]).toHaveTextContent(/Changes/);
    expect(tabs[1]).toHaveTextContent(/Saves/);
    expect(tabs[0].getAttribute("aria-selected")).toBe("true");
  });

  it("shows the prototype helper text under each tab", () => {
    renderTab();
    expect(screen.getByText("Your recent edits")).toBeInTheDocument();
    expect(screen.getByText("Named milestones")).toBeInTheDocument();
  });

  it("switches to the Saves view when the Saves tab is clicked", () => {
    renderTab();
    fireEvent.click(screen.getByRole("tab", { name: /Saves/ }));
    expect(screen.getByTestId("saves-panel")).toBeInTheDocument();
  });

  it("renders prototype search-bar markup with a search-icon", () => {
    const { container } = renderTab();
    expect(container.querySelector(".search-bar")).toBeTruthy();
    expect(container.querySelector(".search-input")).toBeTruthy();
    expect(container.querySelector(".search-icon")).toBeTruthy();
  });

  it("toggles the Time-Travel scrubber when the activity view requests it", () => {
    renderTab();
    expect(screen.queryByTestId("tt-scrubber")).toBeNull();
    fireEvent.click(screen.getByTestId("tt-trigger"));
    expect(screen.getByTestId("tt-scrubber")).toBeInTheDocument();
  });

  it("toggles the Time-Travel scrubber via Ctrl+Shift+T", () => {
    renderTab();
    expect(screen.queryByTestId("tt-scrubber")).toBeNull();
    fireEvent.keyDown(document, { key: "T", ctrlKey: true, shiftKey: true });
    expect(screen.getByTestId("tt-scrubber")).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "T", ctrlKey: true, shiftKey: true });
    expect(screen.queryByTestId("tt-scrubber")).toBeNull();
  });
});
