/**
 * PublishHistory (P1) — the published-version list + republish (contract §5).
 * Verifies load states (loading → list, error+retry not fake-empty, empty),
 * the live badge on the latest, rollbackable gating, and the per-row
 * "Republish vN…" → confirm → re-publish-as-new-version (G1-052: the v3 IA
 * puts the action on the row and calls it Republish; the picker under the
 * list is gone).
 */
import * as React from "react";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fetchPublishHistory = vi.fn();
const rollbackToVersion = vi.fn();
/* Board 949:4474's banner names the live domain, which the history rows do
   not carry — the panel reads it separately. */
const fetchSitePublishState = vi.fn();

const fetchPublishDiff = vi.fn();
vi.mock("../../../services/PublishService", () => ({
  fetchPublishHistory: (...a: unknown[]) => fetchPublishHistory(...a),
  fetchSitePublishState: (...a: unknown[]) => fetchSitePublishState(...a),
  rollbackToVersion: (...a: unknown[]) => rollbackToVersion(...a),
  fetchPublishDiff: (...a: unknown[]) => fetchPublishDiff(...a),
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


/* G1-052: the action is ON the row. Every test that used to walk the picker
   (board 184:2) now clicks the row's own button — the change is the v3 IA's,
   not a regression. */
async function pickVersion(version: number) {
  fireEvent.click(await screen.findByTestId(`publish-republish-${version}`));
}
const CONFIRM_BUTTON = /^Republish v\d+$/;

// P6 permissions boards: republish is admin-scoped (owner decision 8) —
// non-admins see the row action disabled with "Ask an admin", never hidden.
describe("P6 republish role gating", () => {
  it("EDITOR sees republish disabled with the ask-an-admin reason", async () => {
    roleState.role = "EDITOR";
    renderIt();
    expect(await screen.findByText(/Version 3/i)).toBeInTheDocument();
    const entry = screen.getByTestId("publish-republish-2");
    expect(entry).toBeDisabled();
    expect(entry).toHaveAttribute("title", "Ask an admin to republish");
  });

  it("ADMIN keeps republish enabled on rollbackable versions", async () => {
    roleState.role = "ADMIN";
    renderIt();
    expect(await screen.findByText(/Version 3/i)).toBeInTheDocument();
    expect(screen.getByTestId("publish-republish-2")).toBeEnabled();
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

describe("republish", () => {
  it("the live version carries no Republish — its chip says why", async () => {
    // Republishing what is already serving is a deploy that changes nothing.
    renderIt();
    await screen.findByText(/Version 3/i);
    expect(screen.queryByTestId("publish-republish-3")).toBeNull();
    expect(screen.getByText("Live")).toBeInTheDocument();
  });

  it("a version whose snapshot is gone is disabled with the reason", async () => {
    renderIt();
    const pruned = await screen.findByTestId("publish-republish-1");
    expect(pruned).toBeDisabled();
    expect(pruned).toHaveAttribute("title", "This version's snapshot is no longer stored");
  });

  it("republishing an older version confirms then re-publishes it", async () => {
    renderIt();
    await pickVersion(2);
    // confirm dialog names both versions + reassures nothing is rewritten
    expect(screen.getByText("Republish v2 as v4?")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: CONFIRM_BUTTON }));
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
    fireEvent.click(screen.getByRole("button", { name: CONFIRM_BUTTON }));

    await screen.findByText(/Republish failed/i);
    expect(screen.getByText(/v2 could not be re-published/i)).toBeInTheDocument();
    // The live version is v3 (newest row) — the board names it explicitly.
    expect(screen.getByText(/still v3/i)).toBeInTheDocument();
    expect(screen.getByText(/Nothing was overwritten/i)).toBeInTheDocument();
  });

  it("names the reason when the snapshot is gone, and when a publish is already running", async () => {
    rollbackToVersion.mockRejectedValueOnce(new Error("PRECONDITION_FAILED"));
    renderIt();
    await pickVersion(2);
    fireEvent.click(screen.getByRole("button", { name: CONFIRM_BUTTON }));
    await screen.findByText(/snapshot is no longer stored/i);

    cleanup();
    rollbackToVersion.mockRejectedValueOnce(new Error("CONFLICT: publish in progress"));
    renderIt();
    await pickVersion(2);
    fireEvent.click(screen.getByRole("button", { name: CONFIRM_BUTTON }));
    await screen.findByText(/publish is already running/i);
  });

  it("Try again reopens the confirm for the same version, not a blind retry", async () => {
    rollbackToVersion.mockRejectedValueOnce(new Error("boom"));
    renderIt();
    await pickVersion(2);
    fireEvent.click(screen.getByRole("button", { name: CONFIRM_BUTTON }));
    await screen.findByText(/Republish failed/i);

    rollbackToVersion.mockClear();
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));

    expect(screen.getByText("Republish v2 as v4?")).toBeInTheDocument();
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
    fireEvent.click(screen.getByRole("button", { name: CONFIRM_BUTTON }));
    await waitFor(() => expect(rollbackToVersion).toHaveBeenCalled());

    rerender(<PublishHistory siteId="s1" rollbackJob={{ state: "publishing", progress: 40 }} />);
    expect(await screen.findByText(/Republishing…/i)).toBeInTheDocument();
    expect(screen.getByText(/Publishing v2 as v4/i)).toBeInTheDocument();
  });

  it("board 184:45 — the job completing says what is live and that the old version survives", async () => {
    const { rerender } = render(
      <PublishHistory siteId="s1" rollbackJob={{ state: "publishing", progress: 10 }} />,
    );
    await pickVersion(2);
    fireEvent.click(screen.getByRole("button", { name: CONFIRM_BUTTON }));
    await waitFor(() => expect(rollbackToVersion).toHaveBeenCalled());

    rerender(<PublishHistory siteId="s1" rollbackJob={{ state: "published", progress: 100 }} />);

    expect(await screen.findByText("Republished")).toBeInTheDocument();
    expect(screen.getByText(/v4 is live — a re-publish of v2/i)).toBeInTheDocument();
    expect(screen.getByText(/v3 is still in your history/i)).toBeInTheDocument();
  });

  it("a job that fails mid-publish reaches the failure modal too, not just a start-time throw", async () => {
    const { rerender } = render(
      <PublishHistory siteId="s1" rollbackJob={{ state: "publishing", progress: 10 }} />,
    );
    await pickVersion(2);
    fireEvent.click(screen.getByRole("button", { name: CONFIRM_BUTTON }));
    await waitFor(() => expect(rollbackToVersion).toHaveBeenCalled());

    rerender(<PublishHistory siteId="s1" rollbackJob={{ state: "failed", progress: 60 }} />);

    expect(await screen.findByText(/Republish failed/i)).toBeInTheDocument();
    /* 453:4072's sentence, and it is now the ONLY one. This asserted "did not
       finish", which was a second wording this path had to itself — same
       screen, same failure, different text depending on whether the request
       threw or the job failed, and only the throw path matched the board. */
    expect(screen.getByText(/Nothing was overwritten\. Retry the republish/i)).toBeInTheDocument();
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

  it("keeps the banner when the site state cannot be read, minus the live claim", async () => {
    /* That read is best-effort and losing it costs one clause, never the
       whole list — board 781:4489's job, not this one's. It now also carries
       whether the site is serving, and an unread state cannot support a green
       LIVE. So the version and its timestamp stay, both true of the deploy
       itself, and only the claim goes. Asserting LIVE here would have made a
       network blip vouch for a site nobody checked. */
    fetchSitePublishState.mockRejectedValueOnce(new Error("offline"));
    renderIt();
    expect(await screen.findByText(/^v3$/)).toBeInTheDocument();
    expect(screen.queryByText(/LIVE · v3/)).not.toBeInTheDocument();
    expect(screen.getByText(/Version 3/i)).toBeInTheDocument();
  });

  it("hides the banner when the site is known not to be serving", async () => {
    /* The defect this pins: a COMPLETED job at index 0 was read as proof of
       liveness, so an unpublished site with deploy history announced itself
       LIVE. Known-not-serving is different from unread, and only this one
       takes the banner away. */
    fetchSitePublishState.mockResolvedValueOnce({ publishedUrl: null });
    renderIt();
    expect(await screen.findByText(/Version 3/i)).toBeInTheDocument();
    expect(screen.queryByText(/LIVE/)).not.toBeInTheDocument();
  });

  it("states the republish rule under the list", async () => {
    renderIt();
    expect(
      await screen.findByText("Every publish is restorable. Republishing a version redeploys it as a new one."),
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
describe("board 184:24 — the republish confirm names the versions", () => {
  const openConfirm = async () => {
    renderIt();
    expect(await screen.findByText(/Version 2/i)).toBeInTheDocument();
    await pickVersion(2);
  };

  it("titles itself with the target and the replacement — 'Republish v5 as v7' (G1-052)", async () => {
    await openConfirm();
    expect(await screen.findByText("Republish v2 as v4?")).toBeInTheDocument();
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
    expect(await screen.findByRole("button", { name: "Republish v2" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /republish now/i })).toBeNull();
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
    fireEvent.click(await screen.findByRole("button", { name: "Republish v2" }));
  };

  it("does not report success from a 'published' state that predates the rollback", async () => {
    // What the shell handed the panel before the fix: already-published, no
    // job. A success modal here is a lie about a request still in flight.
    render(<PublishHistory siteId="s1" rollbackJob={null} />);
    await start();

    await waitFor(() => expect(rollbackToVersion).toHaveBeenCalled());
    expect(screen.queryByText("Republished")).toBeNull();
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
    expect(await screen.findByText("Republished")).toBeInTheDocument();
  });
});

/* G1-052 (v3 IA): the picker under the list (board 184:2) is gone — a second
   screen for a choice the rows already make visible. The row IS the entry. */
describe("the row is the entry — no picker under the list", () => {
  it("offers Republish on every non-live row and nothing under the list", async () => {
    renderIt();
    await screen.findByText(/Version 2/i);
    expect(screen.getByTestId("publish-republish-2")).toBeInTheDocument();
    expect(screen.getByTestId("publish-republish-1")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Roll back to a published version/ })).toBeNull();
    expect(screen.queryByRole("radio")).toBeNull();
  });

  it("Cancel on the confirm leaves without republishing anything", async () => {
    renderIt();
    await pickVersion(2);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByText(/^Republish v2 as/)).toBeNull();
    expect(rollbackToVersion).not.toHaveBeenCalled();
  });
});

describe("Compare — what changed between two published versions", () => {
  /* "Compare v3 → v4" only switched tabs; no diff existed. Now every row but
     the oldest can compare itself with the version before it, page by page. */
  beforeEach(() => {
    fetchPublishDiff.mockReset().mockResolvedValue({
      retained: true,
      pages: [
        { path: "about.html", change: "changed", fromBytes: 1024, toBytes: 2048 },
        { path: "index.html", change: "same", fromBytes: 512, toBytes: 512 },
        { path: "new.html", change: "added", fromBytes: null, toBytes: 300 },
      ],
      added: 1, removed: 0, changed: 1,
    });
  });

  it("offers Compare on every row except the oldest, which has nothing before it", async () => {
    renderIt();
    await screen.findByText(/Version 3/i);
    expect(screen.getByRole("button", { name: "Compare v2 to v3" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Compare v1 to v2" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Compare v0/ })).toBeNull();
  });

  it("asks the server for exactly those two jobs and names what changed", async () => {
    renderIt();
    await screen.findByText(/Version 3/i);
    fireEvent.click(screen.getByRole("button", { name: "Compare v2 to v3" }));
    await waitFor(() => expect(fetchPublishDiff).toHaveBeenCalledWith("s1", "j2", "j3"));
    expect(await screen.findByTestId("publish-diff-summary")).toHaveTextContent("1 changed · 1 added · 0 removed · 1 unchanged");
    expect(screen.getByText("about.html").closest("li")).toHaveAttribute("data-change", "changed");
    expect(screen.getByText("new.html").closest("li")).toHaveAttribute("data-change", "added");
    expect(screen.getByText("1.0 KB → 2.0 KB")).toBeInTheDocument();
  });

  it("says a pruned version cannot be compared, rather than showing an empty diff", async () => {
    fetchPublishDiff.mockResolvedValue({ retained: false, pages: [], added: 0, removed: 0, changed: 0 });
    renderIt();
    await screen.findByText(/Version 3/i);
    fireEvent.click(screen.getByRole("button", { name: "Compare v1 to v2" }));
    expect(await screen.findByText(/no longer stored/)).toBeInTheDocument();
    expect(screen.queryByTestId("publish-diff-summary")).toBeNull();
  });

  it("goes back to the list", async () => {
    renderIt();
    await screen.findByText(/Version 3/i);
    fireEvent.click(screen.getByRole("button", { name: "Compare v2 to v3" }));
    await screen.findByTestId("publish-diff");
    fireEvent.click(screen.getByRole("button", { name: "‹ Versions" }));
    expect(await screen.findByText(/Version 3/i)).toBeInTheDocument();
  });
});
