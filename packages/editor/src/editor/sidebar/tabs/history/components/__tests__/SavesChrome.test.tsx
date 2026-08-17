/**
 * Boards 162:2 / 163:2 / 163:64 — the chrome around the Saves list.
 *
 * The Saves list is the record of what changed after a client signed off, and
 * nothing on screen said a sign-off existed, when it happened, or how much had
 * moved since. All three boards answer that above the list and state the
 * retention rule below it.
 *
 * These live at tab level, not inside a list: 163:64 is the EMPTY state, with
 * no list at all, and still carries the note. Built inside VersionHistoryPanel
 * first, which is only the Milestones filter — so the "All changes" filter
 * (163:2, same band, same note) and the empty state got neither.
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

import { SavesApproval, SavesPruneNote } from "../SavesChrome";

const APPROVED_AT = new Date(3_000).toISOString();
const HISTORY = [
  { id: "h1", label: "edit", timestamp: 5_000 },
  { id: "h2", label: "edit", timestamp: 7_000 },
  { id: "h3", label: "edit", timestamp: 1_000 }, // before the approval
];

/* No default on `maxVersions` — passing `undefined` to a defaulted parameter
   would take the default and the no-cap case would silently test the cap. */
const composerWith = (maxVersions?: number): Composer =>
  ({
    history: { getHistoryStack: () => HISTORY },
    versions: { maxVersions },
  }) as unknown as Composer;

beforeEach(() => {
  reviewState.value = { state: "none", reviewerName: null, at: null };
});
afterEach(cleanup);

describe("SavesApproval — the band", () => {
  it("is absent when nothing has been approved", async () => {
    render(<SavesApproval composer={composerWith(50)} />);
    await waitFor(() => expect(screen.queryByText("APPROVED")).toBeNull());
  });

  it("names the reviewer and the moment", async () => {
    reviewState.value = { state: "approved", reviewerName: "Sara Khan", at: APPROVED_AT };
    render(<SavesApproval composer={composerWith(50)} />);
    expect(await screen.findByText("APPROVED")).toBeInTheDocument();
    expect(screen.getByText(/Sara Khan · /)).toBeInTheDocument();
  });

  /*
    `approved-edited-since` is what the server returns the moment anyone
    touches the site after sign-off — exactly the situation the board draws:
    an APPROVED band with "Now — 12 changes since v3" beneath it. Gating on
    the pristine `approved` alone made the band vanish on the first edit, when
    the list it heads becomes worth reading.
  */
  it("stays once edits land on top of the approval", async () => {
    reviewState.value = { state: "approved-edited-since", reviewerName: "Sara", at: APPROVED_AT };
    render(<SavesApproval composer={composerWith(50)} />);
    expect(await screen.findByText("APPROVED")).toBeInTheDocument();
  });

  it("drops the reviewer clause rather than printing a placeholder", async () => {
    // A round resolved by someone with no name on record still has a date
    // worth showing; "— · 17 Aug" would read as a typo.
    reviewState.value = { state: "approved", reviewerName: null, at: APPROVED_AT };
    render(<SavesApproval composer={composerWith(50)} />);
    expect(await screen.findByText("APPROVED")).toBeInTheDocument();
    expect(screen.queryByText(/^— · /)).toBeNull();
  });

  it("counts only the edits made after the approval", async () => {
    reviewState.value = { state: "approved", reviewerName: "Sara", at: APPROVED_AT };
    render(<SavesApproval composer={composerWith(50)} />);
    expect(await screen.findByText("Now — 2 changes since approval")).toBeInTheDocument();
  });

  it("says nothing at all when there is no approval to measure from", async () => {
    render(<SavesApproval composer={composerWith(50)} />);
    await waitFor(() => expect(screen.queryByText(/changes since approval/)).toBeNull());
  });
});

describe("SavesPruneNote — the retention rule", () => {
  it("reads the cap off the manager instead of hardcoding it", () => {
    render(<SavesPruneNote composer={composerWith(20)} />);
    expect(
      screen.getByText("20 versions kept. Auto-saves prune oldest first; named ones never prune."),
    ).toBeInTheDocument();
  });

  it("says nothing when the manager cannot report a cap", () => {
    // A number invented here is a claim about retention that nothing backs.
    render(<SavesPruneNote composer={composerWith(undefined)} />);
    expect(screen.queryByText(/versions kept/)).toBeNull();
  });

  it("survives a composer that has no versions manager", () => {
    render(<SavesPruneNote composer={{} as Composer} />);
    expect(screen.queryByText(/versions kept/)).toBeNull();
  });
});
