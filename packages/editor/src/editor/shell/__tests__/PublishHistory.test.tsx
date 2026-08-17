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
  /* The service returns the id of the job the server created — that is what
     the shell polls. It used to return void, which is how the outcome boards
     ended up reading a stale "published" instead of a real job. */
  rollbackToVersion.mockReset().mockResolvedValue({ jobId: "rb-job-1" });
});
afterEach(() => {
  cleanup();
  roleState.role = null;
});


/*
  Board 949:4474 has no per-row Roll back button; rollback starts from the
  button under the list, which opens the picker (board 184:2). Every test that
  used to click a row now walks that flow — the change is the boards', not a
  regression.
*/
async function pickVersion(version: number) {
  fireEvent.click(await screen.findByRole("button", { name: /Roll back to a published version/ }));
  fireEvent.click(await screen.findByRole("radio", { name: new RegExp(`^v${version}(?![0-9])`) }));
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
}

// P6 permissions boards: rollback is admin-scoped — non-admins see the button
// disabled with "Ask an admin to roll back", never hidden.
describe("P6 rollback role gating", () => {
  it("EDITOR sees rollback disabled with the ask-an-admin reason", async () => {
    roleState.role = "EDITOR";
    renderIt();
    expect(await screen.findByText(/Version 3/i)).toBeInTheDocument();
    const entry = screen.getByRole("button", { name: /Roll back to a published version/ });
    expect(entry).toBeDisabled();
    expect(entry).toHaveAttribute("title", "Ask an admin to roll back");
  });

  it("ADMIN keeps rollback enabled on rollbackable versions", async () => {
    roleState.role = "ADMIN";
    renderIt();
    expect(await screen.findByText(/Version 3/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Roll back to a published version/ })).toBeEnabled();
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
  it("the live version is listed but cannot be chosen", async () => {
    // Board 184:2 shows it with its `live` chip — rolling back to what is
    // already serving is a deploy that changes nothing.
    renderIt();
    fireEvent.click(await screen.findByRole("button", { name: /Roll back to a published version/ }));
    expect(await screen.findByRole("radio", { name: /^v3(?![0-9])/ })).toBeDisabled();
  });

  it("a version whose snapshot is gone cannot be chosen either", async () => {
    renderIt();
    fireEvent.click(await screen.findByRole("button", { name: /Roll back to a published version/ }));
    expect(await screen.findByRole("radio", { name: /^v1(?![0-9])/ })).toBeDisabled();
  });

  it("rolling back an older version confirms then re-publishes it", async () => {
    renderIt();
    await pickVersion(2);
    // confirm dialog names the version + reassures the draft is untouched
    expect(screen.getByText(/roll back to v2\?/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^Roll back to v\d+$/ }));
    await waitFor(() => expect(rollbackToVersion).toHaveBeenCalledWith("s1", "j2"));
  });

  /* Board 453:4064 answers a failed rollback with a modal whose first line is
     the reassurance — the live site did not change — not a grey notice under
     the header, which is what this shipped with. The three reasons map to the
     three outcomes publish.service can produce. */
  it("a failed rollback opens the board's modal, naming the live version as unchanged", async () => {
    rollbackToVersion.mockRejectedValueOnce(new Error("boom"));
    renderIt();
    await pickVersion(2);
    fireEvent.click(screen.getByRole("button", { name: /^Roll back to v\d+$/ }));

    await screen.findByText(/Rollback failed/i);
    expect(screen.getByText(/v2 could not be re-published/i)).toBeInTheDocument();
    // The live version is v3 (newest row) — the board names it explicitly.
    expect(screen.getByText(/still v3/i)).toBeInTheDocument();
    expect(screen.getByText(/Nothing was overwritten/i)).toBeInTheDocument();
  });

  it("names the reason when the snapshot is gone, and when a publish is already running", async () => {
    rollbackToVersion.mockRejectedValueOnce(new Error("PRECONDITION_FAILED"));
    renderIt();
    await pickVersion(2);
    fireEvent.click(screen.getByRole("button", { name: /^Roll back to v\d+$/ }));
    await screen.findByText(/snapshot is no longer stored/i);

    cleanup();
    rollbackToVersion.mockRejectedValueOnce(new Error("CONFLICT: publish in progress"));
    renderIt();
    await pickVersion(2);
    fireEvent.click(screen.getByRole("button", { name: /^Roll back to v\d+$/ }));
    await screen.findByText(/publish is already running/i);
  });

  it("Try again reopens the confirm for the same version, not a blind retry", async () => {
    rollbackToVersion.mockRejectedValueOnce(new Error("boom"));
    renderIt();
    await pickVersion(2);
    fireEvent.click(screen.getByRole("button", { name: /^Roll back to v\d+$/ }));
    await screen.findByText(/Rollback failed/i);

    rollbackToVersion.mockClear();
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));

    expect(screen.getByText(/roll back to v2\?/i)).toBeInTheDocument();
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
    await pickVersion(2);
    fireEvent.click(screen.getByRole("button", { name: /^Roll back to v\d+$/ }));
    await waitFor(() => expect(rollbackToVersion).toHaveBeenCalled());

    rerender(<PublishHistory siteId="s1" rollbackJob={{ state: "publishing", progress: 40 }} />);
    expect(await screen.findByText(/Rolling back…/i)).toBeInTheDocument();
    expect(screen.getByText(/Publishing v2 as v4/i)).toBeInTheDocument();
  });

  it("board 184:45 — the job completing says what is live and that the old version survives", async () => {
    const { rerender } = render(
      <PublishHistory siteId="s1" rollbackJob={{ state: "publishing", progress: 10 }} />,
    );
    await pickVersion(2);
    fireEvent.click(screen.getByRole("button", { name: /^Roll back to v\d+$/ }));
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
    await pickVersion(2);
    fireEvent.click(screen.getByRole("button", { name: /^Roll back to v\d+$/ }));
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

/*
  Board 184:24 names a version number in every sentence, and that is the whole
  point of it. The copy it replaced — "This re-publishes that version as a new
  one … your current draft is untouched" — was vague exactly where the user is
  anxious: which version replaces which, and what happens to the one that is
  live right now. It also said "draft", which is not what a rollback touches.
*/
describe("board 184:24 — the rollback confirm names the versions", () => {
  const openConfirm = async () => {
    renderIt();
    expect(await screen.findByText(/Version 2/i)).toBeInTheDocument();
    await pickVersion(2);
  };

  it("titles itself with the target version", async () => {
    await openConfirm();
    expect(await screen.findByText("Roll back to v2?")).toBeInTheDocument();
  });

  it("names target, replacement and the version staying in history", async () => {
    await openConfirm();
    // ROWS is v3 live, so rolling back to v2 re-publishes it as v4.
    expect(
      await screen.findByText(/This publishes v2 again as v4\. Your current v3 stays in history/),
    ).toBeInTheDocument();
  });

  it("carries the board's info block about the list only growing", async () => {
    await openConfirm();
    // Not a repeat of the sentence above it: that one is about the live
    // version, this one is about the LIST — which is what makes a rollback
    // safe to try at all.
    expect(await screen.findByText("The publish list only ever grows.")).toBeInTheDocument();
    expect(screen.getByText("v4 will name v2 as its source.")).toBeInTheDocument();
  });

  it("names the target on the confirm button too", async () => {
    await openConfirm();
    expect(await screen.findByRole("button", { name: "Roll back to v2" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /roll back now/i })).toBeNull();
  });
});

/*
  The rollback confirm announced success before the server had done anything.

  `rollbackJob` was derived from `publishJob.uiState`, which is "published"
  for any already-live site with no job in flight — true from mount. So the
  moment a rollback was confirmed, the effect below saw state "published" and
  wrote the 184:45 modal: "Rolled back — v5 is live." Observed live on
  2026-08-17 at T+0s, with no new row in publish_build_jobs at all.

  The fix is upstream (the panel hands the server's job id to the shell, and
  TabRouter gates `rollbackJob` on a job existing), but the panel must not
  trust a terminal state it was handed before it started either.
*/
describe("rollback outcome follows the JOB, not the site's standing state", () => {
  const start = async () => {
    expect(await screen.findByText(/Version 2/i)).toBeInTheDocument();
    await pickVersion(2);
    fireEvent.click(await screen.findByRole("button", { name: /^Roll back to v2$/ }));
  };

  it("does not report success from a 'published' state that predates the rollback", async () => {
    // What the shell handed the panel before the fix: already-published, no
    // job. A success modal here is a lie about a request still in flight.
    render(<PublishHistory siteId="s1" rollbackJob={null} />);
    await start();

    await waitFor(() => expect(rollbackToVersion).toHaveBeenCalled());
    expect(screen.queryByText(/Rolled back/i)).toBeNull();
  });

  it("hands the server's job id up so the shell can poll it", async () => {
    const onRollbackStarted = vi.fn();
    render(<PublishHistory siteId="s1" onRollbackStarted={onRollbackStarted} rollbackJob={null} />);
    await start();

    await waitFor(() => expect(onRollbackStarted).toHaveBeenCalledWith("rb-job-1"));
  });

  it("reports success once that job actually completes", async () => {
    const { rerender } = render(<PublishHistory siteId="s1" rollbackJob={null} />);
    await start();
    await waitFor(() => expect(rollbackToVersion).toHaveBeenCalled());

    rerender(<PublishHistory siteId="s1" rollbackJob={{ state: "published", progress: 100 }} />);
    expect(await screen.findByText(/Rolled back/i)).toBeInTheDocument();
  });
});

/*
  Board 184:2 — "Roll back to a published version". The board spends a whole
  screen on CHOOSING the version, and 949:4474 gives it one full-width entry
  under the list. The panel had neither: it put a Roll back button on every
  row, which is not what either board draws.
*/
describe("board 184:2 — the version picker", () => {
  const open = async () =>
    fireEvent.click(await screen.findByRole("button", { name: /Roll back to a published version/ }));

  it("is the only way in — rows carry no rollback button", async () => {
    renderIt();
    await screen.findByText(/Version 2/i);
    const row = screen.getByText(/Version 2/i).closest("[data-version-row]") as HTMLElement;
    expect(within(row).queryByRole("button", { name: /roll back/i })).not.toBeInTheDocument();
  });

  it("lists every version, live one included", async () => {
    renderIt();
    await open();
    expect(screen.getAllByRole("radio")).toHaveLength(3);
  });

  it("Continue stays dead until a version is chosen", async () => {
    // The board draws v5 pre-selected; with nothing choosable there is
    // nothing to continue to, and a live Continue would be a dead control.
    fetchPublishHistory.mockResolvedValue([ROWS[0]]);
    renderIt();
    await screen.findByText(/Version 3/i);
    expect(
      screen.getByRole("button", { name: /Roll back to a published version/ }),
    ).toBeDisabled();
  });

  it("Continue hands the chosen version to the confirm", async () => {
    renderIt();
    await open();
    fireEvent.click(await screen.findByRole("radio", { name: /^v2(?![0-9])/ }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(await screen.findByText("Roll back to v2?")).toBeInTheDocument();
  });

  it("Cancel leaves without confirming anything", async () => {
    renderIt();
    await open();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByText(/^Roll back to v/)).toBeNull();
    expect(rollbackToVersion).not.toHaveBeenCalled();
  });
});
