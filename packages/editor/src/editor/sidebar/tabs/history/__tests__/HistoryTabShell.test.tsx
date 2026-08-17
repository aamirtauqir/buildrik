/**
 * HistoryTab shell tests — verifies the chrome after M1 + M2:
 *   - View switcher is Saves / Published (Changes is a filter, not a tab)
 *   - Helper text under each tab
 *   - Saves filter switches milestones ↔ all changes
 *   - Search bar is Saves-only (Published takes no query)
 *   - `initialView` deep link lands on Published
 *   - Time-Travel scrubber toggles via Ctrl+Shift+T
 *
 * Rewritten with the M1/M2 change rather than after it: the three assertions
 * that broke were pinning the OLD design (Changes-by-default, "Your recent
 * edits" helper text, ActivityView mounted at first paint), not a regression.
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

vi.mock("../../../../shell/PublishHistory", () => ({
  PublishHistory: ({ siteId }: { siteId: string }) => (
    <div data-testid="published-panel">PUBLISHED:{siteId}</div>
  ),
}));

const renderTab = (props: Partial<React.ComponentProps<typeof HistoryTab>> = {}) =>
  render(
    <HistoryTab
      composer={null}
      isExpanded={false}
      onExpandToggle={() => {}}
      onHelpClick={() => {}}
      onClose={() => {}}
      {...props}
    />
  );

/** Saves is the default view; the changes list sits behind a filter chip. */
const showChanges = () => fireEvent.click(screen.getByRole("button", { name: "All changes" }));

describe("HistoryTab shell", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });
  afterEach(cleanup);

  it("renders Saves by default, with Published as the only sibling tab", () => {
    renderTab();
    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(2);
    expect(tabs[0]).toHaveTextContent(/Saves/);
    expect(tabs[1]).toHaveTextContent(/Published/);
    expect(tabs[0].getAttribute("aria-selected")).toBe("true");
    // Changes is a filter now — it must not be reachable as a tab.
    expect(screen.queryByRole("tab", { name: /Changes/ })).toBeNull();
  });

  it("shows helper text under each tab", () => {
    renderTab();
    expect(screen.getByText("Named milestones")).toBeInTheDocument();
    expect(screen.getByText("What's live")).toBeInTheDocument();
  });

  it("defaults the Saves filter to milestones and switches to all changes", () => {
    renderTab();
    expect(screen.getByTestId("saves-panel")).toBeInTheDocument();
    expect(screen.queryByTestId("activity-view")).toBeNull();
    showChanges();
    expect(screen.getByTestId("activity-view")).toBeInTheDocument();
    expect(screen.queryByTestId("saves-panel")).toBeNull();
  });

  it("renders prototype search-bar markup with a search-icon", () => {
    const { container } = renderTab();
    expect(container.querySelector(".search-bar")).toBeTruthy();
    expect(container.querySelector(".search-input")).toBeTruthy();
    expect(container.querySelector(".search-icon")).toBeTruthy();
  });

  it("hides the search bar on Published, which takes no query", () => {
    const { container } = renderTab({ projectId: "site_1" });
    fireEvent.click(screen.getByRole("tab", { name: /Published/ }));
    expect(screen.getByTestId("published-panel")).toBeInTheDocument();
    expect(container.querySelector(".search-bar")).toBeNull();
    expect(container.querySelector(".saves-filter")).toBeNull();
  });

  it("lands on Published when deep-linked, ahead of the stored preference", () => {
    window.localStorage.setItem("buildrick-history-view", "changes");
    renderTab({ projectId: "site_1", initialView: "published" });
    expect(screen.getByTestId("published-panel")).toHaveTextContent("PUBLISHED:site_1");
  });

  /* Was: expects "Publish the site once to start a version history." That
     line pinned a lie — it fired whenever the SITE could not be resolved, not
     when nothing had been published, and in unified-editor mode that was
     always. See the reachability block at the bottom of this file. */
  it("explains itself on Published with no site rather than rendering an empty list", () => {
    renderTab({ initialView: "published" });
    expect(screen.queryByTestId("published-panel")).toBeNull();
    expect(screen.getByText(/Open this site from the dashboard/)).toBeInTheDocument();
  });

  it("migrates a stored 'changes' preference to Saves + the changes filter", () => {
    window.localStorage.setItem("buildrick-history-view", "changes");
    renderTab();
    expect(screen.getAllByRole("tab")[0].getAttribute("aria-selected")).toBe("true");
    expect(screen.getByTestId("activity-view")).toBeInTheDocument();
  });

  it("toggles the Time-Travel scrubber when the activity view requests it", () => {
    renderTab();
    showChanges();
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

/*
  The Published view resolved its site from the `projectId` prop alone, and
  AquibraStudio never sets it in unified-editor mode. So every real user got
  the fallback — "Publish the site once to start a version history." — at a
  site with four published versions behind it, and board 949:4474 plus its
  five state boards were unreachable in the shipping editor.

  PublishTab hit exactly this and fixed it for itself, leaving a comment
  saying so; the sibling kept the null prop. Walked live 2026-08-17.
*/
describe("HistoryTab — the Published view finds its site", () => {
  const openPublished = () => fireEvent.click(screen.getByRole("tab", { name: /Published/ }));

  afterEach(() => {
    window.history.replaceState({}, "", "/");
  });

  it("falls back to the siteId in the URL when projectId is absent", () => {
    window.history.replaceState({}, "", "/?siteId=site_from_url");
    renderTab({ projectId: null });
    openPublished();

    expect(screen.getByTestId("published-panel").textContent).toBe("PUBLISHED:site_from_url");
  });

  it("prefers an explicit projectId over the URL", () => {
    window.history.replaceState({}, "", "/?siteId=site_from_url");
    renderTab({ projectId: "site_from_prop" });
    openPublished();

    expect(screen.getByTestId("published-panel").textContent).toBe("PUBLISHED:site_from_prop");
  });

  it("says there is no SITE, not that nothing was ever published", () => {
    // The two are different facts. PublishHistory owns "no versions yet" and
    // says it in its own words; this line only fires with no site at all.
    renderTab({ projectId: null });
    openPublished();

    expect(screen.queryByTestId("published-panel")).toBeNull();
    expect(screen.getByText("Open this site from the dashboard to see its publish history.")).toBeTruthy();
  });
});
