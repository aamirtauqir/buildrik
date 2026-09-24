/**
 * HistoryTab shell tests — verifies the chrome after M1 + M2:
 *   - View switcher: Session / Saves / Published / Activity
 *   - Helper text under each tab
 *   - Session · Saves · Published · Activity tabs (board 4418:73791, B8)
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
  ActivityView: () => <div data-testid="activity-view" />,
}));

/** Board 4418:73791: Time-Travel and search live behind the panel ⋯. */
const openMenuItem = (name: RegExp | string) => {
  fireEvent.click(screen.getByTestId("history-menu"));
  fireEvent.click(screen.getByRole("menuitem", { name }));
};

vi.mock("../components/ActivityLogView", () => ({
  ActivityLogView: ({ onOpenRow }: { onOpenRow?: (k: "edit" | "comment" | "publish") => void }) => (
    <div data-testid="activity-log">
      <button onClick={() => onOpenRow?.("publish")}>open publish row</button>
    </div>
  ),
}));
vi.mock("../components/TimeTravelScrubber", () => ({
  TimeTravelScrubber: ({
    onPreviewChange,
  }: {
    onPreviewChange?: (e: { id: string; label: string } | null) => void;
  }) => (
    <div data-testid="tt-scrubber">
      SCRUBBER
      <button
        data-testid="tt-preview"
        onClick={() => onPreviewChange?.({ id: "e1", label: "Auto-save" })}
      >
        preview
      </button>
    </div>
  ),
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

/** Saves is the default view; this session's changes are the Session tab. */
const showChanges = () => fireEvent.click(screen.getByRole("tab", { name: /Session/ }));

describe("HistoryTab shell", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });
  afterEach(cleanup);

  /* Board 4418:73791 draws Session · Saves · Published (Backups has no
     service); Activity is B6's. "This session" was a filter chip inside Saves
     and is the Session tab now — the chip is gone. */
  it("renders Session · Saves · Published · Activity, Session selected by default (4418:73791)", () => {
    renderTab();
    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(4);
    expect(tabs[0]).toHaveTextContent(/Session/);
    expect(tabs[1]).toHaveTextContent(/Saves/);
    expect(tabs[2]).toHaveTextContent(/Published/);
    expect(tabs[3]).toHaveTextContent(/Activity/);
    expect(tabs[0].getAttribute("aria-selected")).toBe("true");
    expect(screen.queryByRole("button", { name: "This session" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Saved versions" })).toBeNull();
  });

  /* 4418:73791 draws plain labels; the helper line under each was the
     two-tab design and pushed a fourth tab off the 280 drawer. */
  it("tabs are plain labels — no helper line", () => {
    renderTab();
    expect(screen.queryByText("Named milestones")).toBeNull();
    expect(screen.queryByText("What's live")).toBeNull();
  });

  it("Saves lists saved versions; the Session tab lists this session's changes", () => {
    renderTab({ initialView: "saves" });
    expect(screen.getByTestId("saves-panel")).toBeInTheDocument();
    expect(screen.queryByTestId("activity-view")).toBeNull();
    showChanges();
    expect(screen.getByTestId("activity-view")).toBeInTheDocument();
    expect(screen.queryByTestId("saves-panel")).toBeNull();
  });

  it("draws no search field until ⋯ › Search asks for one (board 4418:73791)", () => {
    const { container } = renderTab();
    expect(container.querySelector(".search-bar")).toBeNull();
    openMenuItem(/^Search /);
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

  it("migrates a stored 'changes' preference to the Session tab", () => {
    window.localStorage.setItem("buildrick-history-view", "changes");
    renderTab();
    expect(screen.getAllByRole("tab")[0].getAttribute("aria-selected")).toBe("true");
    expect(screen.getByTestId("activity-view")).toBeInTheDocument();
  });

  it("opens the Time-Travel scrubber from the panel ⋯", () => {
    renderTab();
    showChanges();
    expect(screen.queryByTestId("tt-scrubber")).toBeNull();
    openMenuItem(/^Time-Travel/);
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

  /* Board 163:113 is the Milestones list with time-travel active, but the
     only door in used to live inside ActivityView's header — reachable only
     after switching to "All changes". Milestones (the default view) had no
     button at all, just the undiscoverable Ctrl+Shift+T chord. */
  it("opens the Time-Travel scrubber from Saves, not just Session", () => {
    renderTab({ initialView: "saves" });
    expect(screen.getByTestId("saves-panel")).toBeInTheDocument();
    expect(screen.queryByTestId("tt-scrubber")).toBeNull();
    openMenuItem(/^Time-Travel/);
    expect(screen.getByTestId("tt-scrubber")).toBeInTheDocument();
  });

  it("⋯ › Clear undo history… is there, and inert with nothing to undo", () => {
    renderTab();
    fireEvent.click(screen.getByTestId("history-menu"));
    const item = screen.getByRole("menuitem", { name: /Clear undo history/ });
    expect(item.hasAttribute("disabled") || item.getAttribute("aria-disabled") === "true").toBe(true);
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
    renderTab({ composer: withCap, initialView: "saves" });
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

/*
  Board 163:113 — while time-travel is on, the PANEL says so too.

  The scrubber is a canvas overlay, so the Saves list looked entirely normal
  while the canvas showed a past state, and the sentence that makes scrubbing
  safe to explore — nothing is written until you restore — appeared nowhere at
  all.
*/
describe("HistoryTab — board 163:113 preview band", () => {
  beforeEach(() => window.localStorage.clear());

  const openScrubber = () => {
    fireEvent.click(screen.getByRole("tab", { name: /Session/ }));
    openMenuItem(/^Time-Travel/);
  };

  it("says nothing until the scrubber reports what it is previewing", () => {
    renderTab();
    openScrubber();
    expect(screen.queryByText(/^Previewing /)).toBeNull();
  });

  it("names the previewed entry and states that nothing is written", () => {
    renderTab();
    openScrubber();
    fireEvent.click(screen.getByTestId("tt-preview"));

    expect(screen.getByText("Previewing Auto-save")).toBeInTheDocument();
    /* Board 163:166 names the exit key here and on the button. Both said only
       "Exit" while Escape did nothing; the scrubber binds it now. */
    expect(
      screen.getByText("Nothing is written until Restore. Esc exits time-travel."),
    ).toBeInTheDocument();
  });

  it("Exit leaves time-travel without restoring", () => {
    renderTab();
    openScrubber();
    fireEvent.click(screen.getByTestId("tt-preview"));
    fireEvent.click(screen.getByRole("button", { name: "Exit (Esc)" }));
    expect(screen.queryByTestId("tt-scrubber")).toBeNull();
  });
});

describe("HistoryTab — an Activity row opens in place, with the way back", () => {
  it("a publish row lands on Published with ‹ Activity; the back row returns and goes", () => {
    renderTab({ initialView: "activity" });
    fireEvent.click(screen.getByRole("button", { name: "open publish row" }));
    expect(screen.getByTestId("history-view-tab-published").getAttribute("aria-selected")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "‹ Activity" }));
    expect(screen.getByTestId("history-view-tab-activity").getAttribute("aria-selected")).toBe("true");
    expect(screen.queryByTestId("back-to-activity")).toBeNull();
  });
});
