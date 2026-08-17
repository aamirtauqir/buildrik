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

/* The tab reads this only to know whether the Saves list has settled —
   boards 1138:4573 (skeletons) and 453:4031 (load-error) draw neither the
   approval band nor the prune note. */
const savesState = vi.hoisted(() => ({ isLoading: false, loadError: false }));
/* Relative, matching this file's other hook mocks — an alias path here
   resolves to a second module identity and the mock silently does not apply. */
vi.mock("../../../../../shared/hooks/useVersionHistory", () => ({
  useVersionHistory: () => ({
    versions: [],
    isAvailable: true,
    isLoading: savesState.isLoading,
    loadError: savesState.loadError,
    retryLoad: vi.fn(),
    createVersion: vi.fn(),
    restoreVersion: vi.fn(),
    deleteVersion: vi.fn(),
    getVersion: vi.fn(),
    compareVersions: vi.fn(),
    updateAiSummary: vi.fn(),
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

/*
  Boards 1138:4573 and 453:4031 draw the Saves screen with NOTHING around the
  list: the skeleton screen is only skeletons, and the error screen ends on
  "Retry, or reopen Versions in a moment." rather than a second footer under
  it. The chrome waits for the list to be in a state it can sit around.
*/
describe("HistoryTab — the Saves chrome waits for the list", () => {
  beforeEach(() => {
    /* The view preference is persisted, and an earlier test in this file
       stores one — without this the tab opens on Published and every
       assertion below is about a screen that has no Saves chrome by design. */
    window.localStorage.clear();
  });

  afterEach(() => {
    savesState.isLoading = false;
    savesState.loadError = false;
  });

  /* The real SavesChrome, not a stub: the prune note is the piece that
     renders off a composer alone, so it probes the gate without needing a
     review round. */
  /* A composer complete enough for the REAL useVersionHistory to run against,
     so this test does not depend on the hook mock applying — a thinner double
     throws inside the hook and the failure reads as "note missing". */
  const withCap = {
    on: () => {},
    off: () => {},
    versions: {
      maxVersions: 50,
      isAvailable: () => true,
      getVersions: () => [],
      getLoadState: () => "ready",
    },
  } as never;
  const note = () => screen.queryByText(/versions kept\. Auto-saves prune oldest first/);

  it("frames the list once it has settled", () => {
    renderTab({ composer: withCap });
    expect(note()).toBeInTheDocument();
  });

  it("stays away while the list is still loading", () => {
    savesState.isLoading = true;
    renderTab({ composer: withCap });
    expect(note()).toBeNull();
  });

  it("stays away when the list failed to load", () => {
    // The error screen already carries its own footer; a prune note under it
    // would be the second thing at the bottom of one board.
    savesState.loadError = true;
    renderTab({ composer: withCap });
    expect(note()).toBeNull();
  });

  it("frames the Published view with neither — it is not the Saves list", () => {
    renderTab({ composer: withCap, initialView: "published" });
    expect(note()).toBeNull();
  });
});
