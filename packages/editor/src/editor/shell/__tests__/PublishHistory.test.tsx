/**
 * PublishHistory (P1) — the published-version list + rollback (contract §5).
 * Verifies load states (loading → list, error+retry not fake-empty, empty),
 * the live badge on the latest, rollbackable gating, and rollback pick →
 * confirm → re-publish-as-new-version.
 */
import * as React from "react";
import { render, screen, fireEvent, waitFor, cleanup, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fetchPublishHistory = vi.fn();
const rollbackToVersion = vi.fn();
/* Board 949:4474's banner names the live domain, which the history rows do
   not carry — the panel reads it separately. */
const fetchSitePublishState = vi.fn();

vi.mock("../../../services/PublishService", () => ({
  fetchPublishHistory: (...a: unknown[]) => fetchPublishHistory(...a),
  fetchSitePublishState: (...a: unknown[]) => fetchSitePublishState(...a),
  rollbackToVersion: (...a: unknown[]) => rollbackToVersion(...a),
}));

// P6 role gating — controllable; null = unknown (rollback stays enabled).
const roleState = vi.hoisted(() => ({ role: null as string | null }));
vi.mock("../hooks/useEditorRole", () => ({
  useEditorRole: () => roleState.role,
}));

import { PublishHistory } from "../PublishHistory";

const ROWS = [
  { id: "j3", version: 3, completedAt: "2026-07-23T10:00:00Z", deploymentId: "d3", rollbackable: true, rolledBackFrom: null },
  { id: "j2", version: 2, completedAt: "2026-07-22T10:00:00Z", deploymentId: "d2", rollbackable: true, rolledBackFrom: "j1" },
  { id: "j1", version: 1, completedAt: "2026-07-21T10:00:00Z", deploymentId: "d1", rollbackable: false, rolledBackFrom: null },
];

function renderIt(props = {}) {
  return render(
    <PublishHistory siteId="s1" {...props} />,
  );
}

beforeEach(() => {
  fetchPublishHistory.mockReset().mockResolvedValue(ROWS);
  fetchSitePublishState
    .mockReset()
    .mockResolvedValue({ isPublished: true, publishedUrl: "https://bellacucina.vercel.app" });
  rollbackToVersion.mockReset().mockResolvedValue(undefined);
});
afterEach(() => {
  cleanup();
  roleState.role = null;
});

// P6 permissions boards: rollback is admin-scoped — non-admins see the button
// disabled with "Ask an admin to roll back", never hidden.
describe("P6 rollback role gating", () => {
  it("EDITOR sees rollback disabled with the ask-an-admin reason", async () => {
    roleState.role = "EDITOR";
    renderIt();
    expect(await screen.findByText(/Version 3/i)).toBeInTheDocument();
    const buttons = screen.getAllByRole("button", { name: /roll back/i });
    buttons.forEach((b) => {
      expect(b).toBeDisabled();
      expect(b).toHaveAttribute("title", "Ask an admin to roll back");
    });
  });

  it("ADMIN keeps rollback enabled on rollbackable versions", async () => {
    roleState.role = "ADMIN";
    renderIt();
    expect(await screen.findByText(/Version 3/i)).toBeInTheDocument();
    const rows = screen.getAllByRole("button", { name: /roll back/i });
    // v2 is rollbackable (enabled); v1's snapshot is gone (still disabled).
    expect(rows.some((b) => !(b as HTMLButtonElement).disabled)).toBe(true);
  });
});

describe("load states", () => {
  it("lists versions with a live badge on the latest and a ↩ marker on a rollback", async () => {
    renderIt();
    expect(await screen.findByText(/Version 3/i)).toBeInTheDocument();
    // /live/i now matches the banner AND the row chip — board 949:4474 says
    // both. Assert the row's chip specifically.
    expect(screen.getByText("Live")).toBeInTheDocument(); // latest is the live one
    expect(screen.getByText(/from v1/i)).toBeInTheDocument(); // v2 was a rollback
  });

  it("shows error+retry (not fake-empty) on a failed load", async () => {
    fetchPublishHistory.mockRejectedValueOnce(new Error("network"));
    renderIt();
    expect(await screen.findByText(/couldn't load/i)).toBeInTheDocument();
    expect(screen.queryByText(/no published versions/i)).not.toBeInTheDocument();
    fetchPublishHistory.mockResolvedValue(ROWS);
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(await screen.findByText(/Version 3/i)).toBeInTheDocument();
  });

  it("shows an empty state when nothing has been published", async () => {
    fetchPublishHistory.mockResolvedValue([]);
    renderIt();
    expect(await screen.findByText(/no published versions/i)).toBeInTheDocument();
  });
});

describe("rollback", () => {
  it("the live (latest) version has no rollback action", async () => {
    renderIt();
    await screen.findByText(/Version 3/i);
    const liveRow = screen.getByText(/Version 3/i).closest("[data-version-row]") as HTMLElement;
    expect(within(liveRow).queryByRole("button", { name: /roll back/i })).not.toBeInTheDocument();
  });

  it("a non-rollbackable older version is disabled with a reason", async () => {
    renderIt();
    await screen.findByText(/Version 1/i);
    const row = screen.getByText(/Version 1/i).closest("[data-version-row]") as HTMLElement;
    const btn = within(row).getByRole("button", { name: /roll back/i });
    expect(btn).toBeDisabled();
  });

  it("rolling back an older version confirms then re-publishes it", async () => {
    renderIt();
    await screen.findByText(/Version 2/i);
    const row = screen.getByText(/Version 2/i).closest("[data-version-row]") as HTMLElement;
    fireEvent.click(within(row).getByRole("button", { name: /roll back/i }));
    // confirm dialog names the version + reassures the draft is untouched
    expect(screen.getByText(/roll back to version 2/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /roll back now/i }));
    await waitFor(() => expect(rollbackToVersion).toHaveBeenCalledWith("s1", "j2"));
  });

  /* Board 453:4064 answers a failed rollback with a modal whose first line is
     the reassurance — the live site did not change — not a grey notice under
     the header, which is what this shipped with. The three reasons map to the
     three outcomes publish.service can produce. */
  it("a failed rollback opens the board's modal, naming the live version as unchanged", async () => {
    rollbackToVersion.mockRejectedValueOnce(new Error("boom"));
    renderIt();
    await screen.findByText(/Version 2/i);
    const row = screen.getByText(/Version 2/i).closest("[data-version-row]") as HTMLElement;
    fireEvent.click(within(row).getByRole("button", { name: /roll back/i }));
    fireEvent.click(screen.getByRole("button", { name: /roll back now/i }));

    await screen.findByText(/Rollback failed/i);
    expect(screen.getByText(/v2 could not be re-published/i)).toBeInTheDocument();
    // The live version is v3 (newest row) — the board names it explicitly.
    expect(screen.getByText(/still v3/i)).toBeInTheDocument();
    expect(screen.getByText(/Nothing was overwritten/i)).toBeInTheDocument();
  });

  it("names the reason when the snapshot is gone, and when a publish is already running", async () => {
    rollbackToVersion.mockRejectedValueOnce(new Error("PRECONDITION_FAILED"));
    renderIt();
    await screen.findByText(/Version 2/i);
    const row = screen.getByText(/Version 2/i).closest("[data-version-row]") as HTMLElement;
    fireEvent.click(within(row).getByRole("button", { name: /roll back/i }));
    fireEvent.click(screen.getByRole("button", { name: /roll back now/i }));
    await screen.findByText(/snapshot is no longer stored/i);

    cleanup();
    rollbackToVersion.mockRejectedValueOnce(new Error("CONFLICT: publish in progress"));
    renderIt();
    await screen.findByText(/Version 2/i);
    const row2 = screen.getByText(/Version 2/i).closest("[data-version-row]") as HTMLElement;
    fireEvent.click(within(row2).getByRole("button", { name: /roll back/i }));
    fireEvent.click(screen.getByRole("button", { name: /roll back now/i }));
    await screen.findByText(/publish is already running/i);
  });

  it("Try again reopens the confirm for the same version, not a blind retry", async () => {
    rollbackToVersion.mockRejectedValueOnce(new Error("boom"));
    renderIt();
    await screen.findByText(/Version 2/i);
    const row = screen.getByText(/Version 2/i).closest("[data-version-row]") as HTMLElement;
    fireEvent.click(within(row).getByRole("button", { name: /roll back/i }));
    fireEvent.click(screen.getByRole("button", { name: /roll back now/i }));
    await screen.findByText(/Rollback failed/i);

    rollbackToVersion.mockClear();
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));

    expect(screen.getByText(/roll back to version 2/i)).toBeInTheDocument();
    expect(rollbackToVersion).not.toHaveBeenCalled();
  });

  /* The rollback is NOT done when rollbackToVersion resolves — that only starts
     the job. Boards 184:37 / 184:45 belong to the job FINISHING, which the
     shell polls and feeds back in. Until this landed, the panel showed a grey
     notice and never told the user the rollback had actually succeeded. */
  it("shows the progress modal while the shell reports the job publishing", async () => {
    const { rerender } = render(
      <PublishHistory siteId="s1" rollbackJob={null} />,
    );
    await screen.findByText(/Version 2/i);
    const row = screen.getByText(/Version 2/i).closest("[data-version-row]") as HTMLElement;
    fireEvent.click(within(row).getByRole("button", { name: /roll back/i }));
    fireEvent.click(screen.getByRole("button", { name: /roll back now/i }));
    await waitFor(() => expect(rollbackToVersion).toHaveBeenCalled());

    rerender(<PublishHistory siteId="s1" rollbackJob={{ state: "publishing", progress: 40 }} />);
    expect(await screen.findByText(/Rolling back…/i)).toBeInTheDocument();
    expect(screen.getByText(/Publishing v2 as v4/i)).toBeInTheDocument();
  });

  it("board 184:45 — the job completing says what is live and that the old version survives", async () => {
    const { rerender } = render(
      <PublishHistory siteId="s1" rollbackJob={{ state: "publishing", progress: 10 }} />,
    );
    await screen.findByText(/Version 2/i);
    const row = screen.getByText(/Version 2/i).closest("[data-version-row]") as HTMLElement;
    fireEvent.click(within(row).getByRole("button", { name: /roll back/i }));
    fireEvent.click(screen.getByRole("button", { name: /roll back now/i }));
    await waitFor(() => expect(rollbackToVersion).toHaveBeenCalled());

    rerender(<PublishHistory siteId="s1" rollbackJob={{ state: "published", progress: 100 }} />);

    expect(await screen.findByText(/Rolled back/i)).toBeInTheDocument();
    expect(screen.getByText(/v4 is live — a re-publish of v2/i)).toBeInTheDocument();
    expect(screen.getByText(/v3 is still in your history/i)).toBeInTheDocument();
  });

  it("a job that fails mid-publish reaches the failure modal too, not just a start-time throw", async () => {
    const { rerender } = render(
      <PublishHistory siteId="s1" rollbackJob={{ state: "publishing", progress: 10 }} />,
    );
    await screen.findByText(/Version 2/i);
    const row = screen.getByText(/Version 2/i).closest("[data-version-row]") as HTMLElement;
    fireEvent.click(within(row).getByRole("button", { name: /roll back/i }));
    fireEvent.click(screen.getByRole("button", { name: /roll back now/i }));
    await waitFor(() => expect(rollbackToVersion).toHaveBeenCalled());

    rerender(<PublishHistory siteId="s1" rollbackJob={{ state: "failed", progress: 60 }} />);

    expect(await screen.findByText(/Rollback failed/i)).toBeInTheDocument();
    expect(screen.getByText(/did not finish/i)).toBeInTheDocument();
  });
});

/*
  Board 949:4474 opens on WHAT IS LIVE and closes on the rule that makes
  rollback safe to try. The panel opened on a "Published versions" header — a
  third label for a destination the tab strip and sub-tab already name — and
  closed on nothing.
*/
describe("board 949:4474 — the banner and the closing rule", () => {
  it("leads with the live version, not a list header", async () => {
    renderIt();
    expect(await screen.findByText(/LIVE · v3/)).toBeInTheDocument();
    expect(screen.queryByText("Published versions")).not.toBeInTheDocument();
  });

  it("names the live domain when the site reports one", async () => {
    renderIt();
    expect(await screen.findByText(/bellacucina\.vercel\.app · published/)).toBeInTheDocument();
  });

  it("keeps the banner when the domain cannot be read", async () => {
    // The domain is a second, best-effort read. Losing it costs one clause,
    // never the whole list — that is board 781:4489's job, not this one's.
    fetchSitePublishState.mockRejectedValueOnce(new Error("offline"));
    renderIt();
    expect(await screen.findByText(/LIVE · v3/)).toBeInTheDocument();
    expect(screen.getByText(/Version 3/i)).toBeInTheDocument();
  });

  it("states the rollback rule under the list", async () => {
    renderIt();
    expect(
      await screen.findByText("Every publish is restorable. Rolling back redeploys that version."),
    ).toBeInTheDocument();
  });
});
