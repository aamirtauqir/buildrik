/**
 * Board 162:2 — the Saves panel opens on the APPROVAL and closes on the prune
 * rule.
 *
 * It had neither. The list is the record of what changed after a client signed
 * off, and nothing on screen said a sign-off existed, when it happened, or how
 * much had moved since. The board answers all three above the list, and states
 * the retention rule below it.
 *
 * @license BSD-3-Clause
 */

import { render, screen, waitFor, cleanup } from "@testing-library/react";
import * as React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Composer } from "@/engine";

const reviewState: { value: unknown } = { value: { state: "none", reviewerName: null, at: null } };
vi.mock("@/services/ReviewService", () => ({
  fetchReviewStatus: () => Promise.resolve(reviewState.value),
}));

vi.mock("react-window", () => ({
  FixedSizeList: ({ children, itemCount }: never) => {
    const Row = children as unknown as React.FC<{ index: number; style: object }>;
    return (
      <div>
        {Array.from({ length: itemCount as unknown as number }, (_, i) => (
          <Row key={i} index={i} style={{}} />
        ))}
      </div>
    );
  },
}));

const mocks = {
  state: { versions: [] as unknown[], isAvailable: true },
  createVersion: vi.fn(),
  restoreVersion: vi.fn(),
  deleteVersion: vi.fn(),
  compareVersions: vi.fn(),
  getVersion: vi.fn(),
};
vi.mock("../../../shared/hooks/useVersionHistory", () => ({
  useVersionHistory: () => ({
    versions: mocks.state.versions,
    isAvailable: mocks.state.isAvailable,
    isLoading: false,
    error: null,
    createVersion: mocks.createVersion,
    restoreVersion: mocks.restoreVersion,
    deleteVersion: mocks.deleteVersion,
    compareVersions: mocks.compareVersions,
    getVersion: mocks.getVersion,
    refresh: vi.fn(),
  }),
}));
vi.mock("../version-history/useAISummary", () => ({
  useAISummary: () => ({ updateAiSummary: vi.fn(), summarizing: null }),
}));

const HISTORY = [
  { id: "h1", label: "edit", timestamp: 5_000 },
  { id: "h2", label: "edit", timestamp: 7_000 },
  { id: "h3", label: "edit", timestamp: 1_000 }, // before the approval
];

/* No default on `maxVersions` — `makeComposer(undefined)` would otherwise
   take it and the no-cap case would silently test the cap case. */
function makeComposer(maxVersions?: number): Composer {
  return {
    on: () => {},
    off: () => {},
    history: { getHistoryStack: () => HISTORY },
    versions: { captureVisualSnapshot: () => null, maxVersions },
  } as unknown as Composer;
}

const APPROVED_AT = new Date(3_000).toISOString();

async function renderPanel(composer: Composer = makeComposer(50)) {
  const { VersionHistoryPanel } = await import("../VersionHistoryPanel");
  /* The real ToastProvider, not a pass-through stub: the panel reaches toast
     through chrome-ui's own internal import, so a fake provider leaves the
     context genuinely empty and useToast throws. */
  const { ToastProvider } = await import("@/editor/chrome-ui");
  return render(
    <ToastProvider>
      <VersionHistoryPanel composer={composer} />
    </ToastProvider>,
  );
}

beforeEach(() => {
  mocks.state.versions = [];
  reviewState.value = { state: "none", reviewerName: null, at: null };
});
afterEach(cleanup);

describe("board 162:2 — the approval band", () => {
  it("is absent when nothing has been approved", async () => {
    await renderPanel();
    await waitFor(() => expect(screen.queryByText("APPROVED")).toBeNull());
  });

  it("names the reviewer and the moment", async () => {
    reviewState.value = { state: "approved", reviewerName: "Sara Khan", at: APPROVED_AT };
    await renderPanel();
    expect(await screen.findByText("APPROVED")).toBeInTheDocument();
    expect(screen.getByText(/Sara Khan · /)).toBeInTheDocument();
  });

  /*
    `approved-edited-since` is what the server returns the moment anyone
    touches the site after sign-off — which is exactly the situation the board
    draws: an APPROVED band with "Now — 12 changes since v3" beneath it.
    Gating on the pristine `approved` alone made the band vanish on the first
    edit, i.e. when the list it heads becomes worth reading.
  */
  it("stays once edits land on top of the approval", async () => {
    reviewState.value = { state: "approved-edited-since", reviewerName: "Sara Khan", at: APPROVED_AT };
    await renderPanel();
    expect(await screen.findByText("APPROVED")).toBeInTheDocument();
  });

  it("drops the reviewer clause rather than printing a placeholder", async () => {
    // A round resolved by someone with no name on record still has a date
    // worth showing; "— · 17 Aug" would read as a typo.
    reviewState.value = { state: "approved", reviewerName: null, at: APPROVED_AT };
    await renderPanel();
    expect(await screen.findByText("APPROVED")).toBeInTheDocument();
    expect(screen.queryByText(/^— · /)).toBeNull();
  });
});

describe("board 162:2 — changes since the approval", () => {
  it("counts only the edits made after it", async () => {
    reviewState.value = { state: "approved", reviewerName: "Sara", at: APPROVED_AT };
    await renderPanel();
    // Two of the three stack entries are newer than the approval.
    expect(await screen.findByText("Now — 2 changes since approval")).toBeInTheDocument();
  });

  it("says nothing when there is no approval to measure from", async () => {
    await renderPanel();
    await waitFor(() => expect(screen.queryByText(/changes since approval/)).toBeNull());
  });
});

describe("board 162:2 — the prune rule", () => {
  it("reads the cap off the manager instead of hardcoding it", async () => {
    await renderPanel(makeComposer(20));
    expect(
      await screen.findByText(
        "20 versions kept. Auto-saves prune oldest first; named ones never prune.",
      ),
    ).toBeInTheDocument();
  });

  it("says nothing when the manager cannot report a cap", async () => {
    // A number invented here would be a claim about retention that nothing
    // backs — the note is only worth showing when it is true. The approval
    // gives the render something to settle on, so this asserts an absence
    // after a real paint rather than before one.
    reviewState.value = { state: "approved", reviewerName: "Sara", at: APPROVED_AT };
    await renderPanel(makeComposer(undefined));
    expect(await screen.findByText("APPROVED")).toBeInTheDocument();
    expect(screen.queryByText(/versions kept/)).toBeNull();
  });
});
