// @vitest-environment jsdom
/**
 * PublishTab — the panel's board-driven states.
 *
 * B3-10 7574:193972 (idle: the four sections) · 784:4250 (publishing) ·
 * 4418:98663 (cancelled) · 784:4326 (live) · 784:4480 (not-connected). Each
 * board answers a different question, and each drops the sections that would
 * answer a question the user is no longer asking.
 *
 * The panel reads `nextMove` for whether a publish may go ahead (B4); every
 * case here hands it the plain `confirm` gate so the state under test is the
 * job's, not the round's (PublishTab.gate.test.tsx covers the gate).
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import * as React from "react";
import type { PublishTabProps } from "../PublishTab";

const fetchPublishHistory = vi.fn();
const unpublishSite = vi.fn((_siteId: string) => Promise.resolve());
vi.mock("@/services/PublishService", () => ({
  fetchPrePublishChecks: () => Promise.resolve({ ready: true, checks: [] }),
  fetchPublishHistory: (siteId: string) => fetchPublishHistory(siteId),
  rollbackToVersion: () => Promise.resolve(),
  unpublishSite: (siteId: string) => unpublishSite(siteId),
}));

vi.mock("@/editor/chrome-ui", async () => {
  const actual = await vi.importActual<Record<string, unknown>>("@/editor/chrome-ui");
  return { ...actual, useToast: () => ({ addToast: vi.fn(), removeToast: vi.fn(), toasts: [] }) };
});

import { ToastProvider } from "@/editor/chrome-ui";
import { PublishTab } from "../PublishTab";
import { deriveLifecycleState } from "../../../../shell/lifecycle";

const OPEN_MOVE = deriveLifecycleState({
  reviewState: "none",
  reviewsEnabled: false,
  editsRequireApproval: false,
  isPublished: false,
  hasUnpublishedChanges: null,
  isViewer: false,
  publishEnabled: true,
  offline: false,
  errorCount: 0,
});

type ComposerProp = PublishTabProps["composer"];

function composerWith(entries: Array<{ id: string; label: string; timestamp: number }> = []): ComposerProp {
  return {
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    history: { getHistoryStack: () => entries },
    elements: { getAllPages: () => [{ id: "p1" }, { id: "p2" }, { id: "p3" }] },
  } as unknown as ComposerProp;
}

const job = (over: Partial<NonNullable<PublishTabProps["publishJob"]>> = {}) =>
  ({ uiState: "idle", jobId: null, progress: 0, publishedUrl: null, error: null, blockedReason: null, ...over }) as NonNullable<
    PublishTabProps["publishJob"]
  >;

function renderTab(ui: React.ReactElement) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

/** Board 4418:97118 draws Changes / Last deploy collapsed; open both. */
async function expandSections() {
  for (const name of ["Changes in this session", "Last deploy"]) {
    const b = await screen.findByRole("button", { name });
    if (b.getAttribute("aria-expanded") === "false") fireEvent.click(b);
  }
}

/** Board 7045:77972: Unpublish lives in the panel ⋯. */
async function openPublishMenu() {
  fireEvent.click(await screen.findByTestId("publish-menu"));
}

beforeEach(() => {
  fetchPublishHistory.mockReset().mockResolvedValue([]);
});

describe("PublishTab — board 641:2652, the idle panel", () => {
  it("counts only the changes made SINCE the last deploy", async () => {
    const deployedAt = new Date("2026-08-14T10:00:00Z");
    fetchPublishHistory.mockResolvedValue([
      { id: "j1", version: 4, completedAt: deployedAt, deploymentId: "d", rollbackable: true, rolledBackFrom: null },
    ]);
    const before = deployedAt.getTime() - 60_000;
    const after = deployedAt.getTime() + 60_000;
    renderTab(
      <PublishTab
        composer={composerWith([
          { id: "e1", label: "Hero — new photo", timestamp: after },
          { id: "e2", label: "Ancient edit", timestamp: before },
        ])}
        projectId="site_1"
        /* A serving URL is what makes the last deploy live. Without it this
           test asserted "v4 · live" over a site with nothing published — the
           defect itself, pinned as the expectation. */
        publishedUrl="https://bellacucina.com"
        nextMove={OPEN_MOVE} onRequestPublish={vi.fn()}
      />,
    );

    await expandSections();
    // The pre-deploy entry is not pending work and must not be counted.
    await waitFor(() => expect(screen.getByText("1 change")).toBeTruthy());
    expect(screen.getByText("Hero — new photo")).toBeTruthy();
    expect(screen.queryByText("Ancient edit")).toBeNull();
    expect(screen.getByText("3 pages")).toBeTruthy();
    expect(screen.getByText("LIVE · v4")).toBeTruthy(); // 7051:78633
  });

  it("a finished deploy on a site that is not serving does not read as live", async () => {
    /* The panel showed "never published" and a green live claim on the same
       load, because any COMPLETED job was taken as proof of liveness. A job
       that ran is not a site that is up — an unpublish leaves the job row in
       place. With no serving URL the deploy is named, and called not live. */
    fetchPublishHistory.mockResolvedValue([
      { id: "j1", version: 1, completedAt: new Date(), deploymentId: "d", rollbackable: true, rolledBackFrom: null },
    ]);
    renderTab(<PublishTab composer={composerWith()} projectId="site_1" nextMove={OPEN_MOVE} onRequestPublish={vi.fn()} />);
    await expandSections();
    await waitFor(() => expect(screen.getByText("Not live · v1")).toBeTruthy());
    expect(screen.queryByText("LIVE · v1")).toBeNull();
  });

  it("never-published reads as never published, not as an empty deploy", async () => {
    renderTab(<PublishTab composer={composerWith()} projectId="site_1" nextMove={OPEN_MOVE} onRequestPublish={vi.fn()} />);
    await expandSections();
    await waitFor(() => expect(screen.getByText("This site has never been published.")).toBeTruthy());
  });
});

describe("PublishTab — board 784:4250, publishing", () => {
  it("leads with the run and drops the two 'what would go out' sections", async () => {
    renderTab(
      <PublishTab
        composer={composerWith([{ id: "e1", label: "Edit", timestamp: Date.now() }])}
        projectId="site_1"
        nextMove={OPEN_MOVE} onRequestPublish={vi.fn()}
        publishJob={job({ uiState: "publishing", progress: 40 })}
      />,
    );

    await waitFor(() => expect(screen.getByText("Publishing to production…")).toBeTruthy());
    expect(screen.getByText(/40%/)).toBeTruthy();
    // Release to stays — where it is going is still the question.
    expect(screen.getByText("Production")).toBeTruthy();
    // The checks step aside for the run, which the board leads with.
    expect(screen.queryByText("Pre-publish checks")).toBeNull();
    // And the run can be cancelled from here.
    expect(screen.getByTestId("publish-cancel")).toBeTruthy();
    expect(screen.queryByText("Changes in this session")).toBeNull();
    expect(screen.queryByText("Last deploy")).toBeNull();
  });
});

describe("PublishTab — cancel in flight, and the cancelled outcome", () => {
  it("Cancel asks the job to cancel — the deploy job on the server, nothing else claimed", async () => {
    const cancel = vi.fn(() => Promise.resolve());
    renderTab(
      <PublishTab
        composer={composerWith()}
        projectId="site_1"
        nextMove={OPEN_MOVE} onRequestPublish={vi.fn()}
        publishJob={{ ...job({ uiState: "publishing", jobId: "job-1", progress: 20 }), cancel }}
      />,
    );
    fireEvent.click(await screen.findByTestId("publish-cancel"));
    await waitFor(() => expect(cancel).toHaveBeenCalledTimes(1));
    expect(document.body.textContent).not.toMatch(/export.*cancel/i);
  });

  it("a refused cancel prints the server's sentence under the bar and the run continues", async () => {
    renderTab(
      <PublishTab
        composer={composerWith()}
        projectId="site_1"
        nextMove={OPEN_MOVE} onRequestPublish={vi.fn()}
        publishJob={job({ uiState: "publishing", jobId: "job-1", progress: 80, error: "This job cannot be cancelled." })}
      />,
    );
    expect(await screen.findByTestId("publish-cancel-error")).toHaveTextContent("This job cannot be cancelled.");
    expect(screen.getByText("Publishing to production…")).toBeTruthy();
  });

  it("board 4418:98663 — cancelled leads with the outcome and offers Publish again through the one door", async () => {
    const onRequestPublish = vi.fn();
    const reset = vi.fn();
    renderTab(
      <PublishTab
        composer={composerWith()}
        projectId="site_1"
        nextMove={OPEN_MOVE}
        onRequestPublish={onRequestPublish}
        publishJob={{ ...job({ uiState: "cancelled", jobId: "job-1" }), reset }}
      />,
    );
    await waitFor(() => expect(screen.getByText("Publish cancelled.")).toBeTruthy());
    expect(screen.getByText("Nothing was deployed. Your work is saved.")).toBeTruthy();
    fireEvent.click(screen.getByTestId("publish-again"));
    expect(reset).toHaveBeenCalledTimes(1);
    expect(onRequestPublish).toHaveBeenCalledTimes(1);
  });
});

describe("PublishTab — board 784:4326, just published", () => {
  /* The job id is the scenario, not decoration: this board is the moment after
     a publish THIS session finished. Without it the case was indistinguishable
     from opening an already-live site, which is how that load came to render
     this board. */
  it("states the result, offers the live site, and greys the CTA", async () => {
    fetchPublishHistory.mockResolvedValue([
      { id: "j1", version: 15, completedAt: new Date(), deploymentId: "d", rollbackable: true, rolledBackFrom: null },
    ]);
    renderTab(
      <PublishTab
        composer={composerWith()}
        projectId="site_1"
        nextMove={OPEN_MOVE} onRequestPublish={vi.fn()}
        publishJob={job({ uiState: "published", jobId: "job-1", publishedUrl: "https://bellacucina.com" })}
      />,
    );

    await waitFor(() => expect(screen.getByText("Published to production.")).toBeTruthy());
    expect(screen.getByText(/LIVE · v15/)).toBeTruthy(); // 4418:97787
    expect((screen.getByText("View live site") as HTMLAnchorElement).href).toContain("bellacucina.com");
    expect(screen.getByText("Compare v14 → v15")).toBeTruthy();
    // Nothing pending — the button has nothing to send.
    expect(
      (screen.getByText("Publish to production").closest("button") as HTMLButtonElement).disabled,
    ).toBe(true);
  });
});

/* Board 4418:99089 (C5 G1-048): a dev simulation says nothing was deployed
   and offers no live link — its URL can never resolve. */
describe("PublishTab — a simulated publish says so", () => {
  it("names the simulation and withholds View live site", async () => {
    fetchPublishHistory.mockResolvedValue([
      { id: "j1", version: 15, completedAt: new Date(), deploymentId: "d", rollbackable: true, rolledBackFrom: null },
    ]);
    renderTab(
      <PublishTab
        composer={composerWith()}
        projectId="site_1"
        nextMove={OPEN_MOVE} onRequestPublish={vi.fn()}
        publishJob={job({ uiState: "published", jobId: "job-1", publishedUrl: "https://bella.dev-simulated.invalid" })}
      />,
    );
    await waitFor(() => expect(screen.getByText("Simulated publish — nothing was deployed.")).toBeTruthy());
    expect(screen.getByText(/PUBLISH_ALLOW_SIMULATION is on/)).toBeTruthy();
    expect(screen.queryByText("View live site")).toBeNull();
    expect(screen.queryByText("Published to production.")).toBeNull();
  });
});

describe("PublishTab — a fresh load is not a fresh publish", () => {
  /* `justPublished` read two facts that are BOTH true the moment the editor
     opens an already-live site, and neither of which means a publish happened:
     `uiState` is "published" for any site with a hydrated URL and no job in
     flight (usePublishJob), and the undo stack is empty because HistoryManager
     clears it on every project load. The panel therefore hid both "what would
     go out" sections and greyed the CTA on first paint — the site could not be
     published at all — while the topbar, reading the save clock, offered
     "Publish changes" beside it. Same defect and same fix as the rollback job
     in TabRouter: a job id is what says something actually ran. */
  it("a previously-published site with no job in flight can still publish", async () => {
    fetchPublishHistory.mockResolvedValue([
      { id: "j1", version: 15, completedAt: new Date(), deploymentId: "d", rollbackable: true, rolledBackFrom: null },
    ]);
    renderTab(
      <PublishTab
        /* HistoryManager empties the undo stack on load, by design. */
        composer={composerWith()}
        projectId="site_1"
        nextMove={OPEN_MOVE} onRequestPublish={vi.fn()}
        publishJob={job({ uiState: "published", jobId: null, publishedUrl: "https://bellacucina.com" })}
      />,
    );

    await waitFor(() => expect(screen.getByText("Changes in this session")).toBeTruthy());
    // Nothing was published in this session, so the result board must not show.
    expect(screen.queryByText("Published to production.")).toBeNull();
    expect(screen.getByText("Last deploy")).toBeTruthy();
    expect(
      (screen.getByText("Publish to production").closest("button") as HTMLButtonElement).disabled,
    ).toBe(false);
  });
});

describe("PublishTab — board 784:4480, no publish path", () => {
  it("is one sentence and one action, not a checklist", () => {
    const { container } = renderTab(<PublishTab composer={composerWith()} projectId="site_1" nextMove={OPEN_MOVE} />);
    expect(container.textContent).toContain("Connect Vercel to publish.");
    expect(container.textContent).toContain("we host nothing");
    expect(screen.getByText("Connect Vercel")).toBeTruthy();
    // The board draws no release/changes/deploy sections here.
    expect(container.textContent).not.toContain("Changes in this session");
    expect(screen.queryByText("Publish to production")).toBeNull();
  });
});

describe("PublishTab — board 784:4403, failed", () => {
  it("says what failed AND that nothing was deployed", async () => {
    renderTab(
      <PublishTab
        composer={composerWith([{ id: "e1", label: "Edit", timestamp: Date.now() }])}
        projectId="site_1"
        nextMove={OPEN_MOVE} onRequestPublish={vi.fn()}
        publishJob={job({ uiState: "failed", error: "Build error on Menu — 3 unresolved links." })}
      />,
    );

    await waitFor(() => expect(screen.getByText("Publish failed.")).toBeTruthy());
    /* The reassurance is the half a user needs first, and the panel adds it
       when the server message does not carry it. */
    expect(screen.getByText(/Nothing was deployed\./)).toBeTruthy();
    expect(screen.getByText("Try again")).toBeTruthy();
    // Same as publishing/live: the "what would go out" sections step aside.
    expect(screen.queryByText("Changes in this session")).toBeNull();
    // 4418:97355: the foot offers one way back; retry is "Try again" above.
    expect(screen.getByTestId("publish-back")).toHaveTextContent("Back to Publish");
  });

  it("does not double the reassurance when the server already said it", async () => {
    renderTab(
      <PublishTab
        composer={composerWith()}
        projectId="site_1"
        nextMove={OPEN_MOVE} onRequestPublish={vi.fn()}
        publishJob={job({ uiState: "failed", error: "Timed out. Nothing was deployed." })}
      />,
    );
    await waitFor(() => expect(screen.getByText("Publish failed.")).toBeTruthy());
    expect(screen.getByText("Timed out. Nothing was deployed.")).toBeTruthy();
  });
});

describe("PublishTab — board 781:4489, the deploy service is unreachable", () => {
  it("says so, and says nothing about environments it cannot read", async () => {
    fetchPublishHistory.mockRejectedValue(new Error("network"));
    renderTab(<PublishTab composer={composerWith()} projectId="site_1" nextMove={OPEN_MOVE} onRequestPublish={vi.fn()} />);

    await waitFor(() => expect(screen.getByText("Couldn't reach the deploy service.")).toBeTruthy());
    /* Both halves: nothing went out, and the work is not lost. */
    expect(screen.getByText("Nothing was published. Your work is saved.")).toBeTruthy();
    expect(screen.getByText("Try again")).toBeTruthy();
    // "no deploys yet" and "we cannot tell" are different facts.
    expect(screen.queryByText("This site has never been published.")).toBeNull();
    expect(screen.queryByText("Changes in this session")).toBeNull();
    expect(
      (screen.getByText("Publish to production").closest("button") as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  it("Try again re-reads the history and recovers", async () => {
    /* A flag, not mockRejectedValueOnce: TWO components read this history (the
       panel's snapshot and PublishHistory), so a "once" mock is spent by the
       second reader before the test can use it. */
    let failing = true;
    fetchPublishHistory.mockImplementation(() =>
      failing
        ? Promise.reject(new Error("network"))
        : Promise.resolve([
            { id: "j1", version: 2, completedAt: new Date(), deploymentId: "d", rollbackable: true, rolledBackFrom: null },
          ]),
    );
    renderTab(
      <PublishTab
        composer={composerWith()}
        projectId="site_1"
        publishedUrl="https://bellacucina.com"
        nextMove={OPEN_MOVE} onRequestPublish={vi.fn()}
      />,
    );

    await waitFor(() => expect(screen.getByText("Couldn't reach the deploy service.")).toBeTruthy());
    failing = false;
    fireEvent.click(screen.getByText("Try again"));
    await expandSections();
    await waitFor(() => expect(screen.getByText("LIVE · v2")).toBeTruthy());
  });
});

/* The panel has three whole-body states that can be true at once. Their order
   is a product decision, not an accident of JSX nesting: with no publish path,
   connecting is the only next step, so it outranks a history read that failed;
   and a failed read outranks sections it cannot speak for. */
describe("PublishTab — which whole-body state wins", () => {
  it("no publish path beats an unreachable deploy service", async () => {
    fetchPublishHistory.mockRejectedValue(new Error("network"));
    const { container } = renderTab(<PublishTab composer={composerWith()} projectId="site_1" nextMove={OPEN_MOVE} />);

    await waitFor(() => expect(container.textContent).toContain("Connect Vercel to publish."));
    expect(container.textContent).not.toContain("Couldn't reach the deploy service.");
  });

  it("an unreachable service beats the sections it cannot speak for", async () => {
    fetchPublishHistory.mockRejectedValue(new Error("network"));
    renderTab(
      <PublishTab
        composer={composerWith([{ id: "e1", label: "Edit", timestamp: Date.now() }])}
        projectId="site_1"
        nextMove={OPEN_MOVE} onRequestPublish={vi.fn()}
        publishJob={job({ uiState: "failed", error: "boom" })}
      />,
    );

    await waitFor(() => expect(screen.getByText("Couldn't reach the deploy service.")).toBeTruthy());
    expect(screen.queryByText("Publish failed.")).toBeNull();
    expect(screen.queryByText("Changes in this session")).toBeNull();
  });
});

/*
  SINCE LAST DEPLOY's empty state wore one sentence for two different facts.
  With no deploy to measure from, "Nothing has changed since the last deploy."
  is false, and it reads as an all-clear two lines above LAST DEPLOY saying
  "This site has never been published." — the panel contradicting itself on the
  path where a user decides whether to publish at all. Seen live on a site with
  no deploys and an untouched undo stack, which is every unpublished site the
  moment it opens.
*/
describe("PublishTab — the zero-changes sentence tells the truth", () => {
  it("says the site is going live for the first time when nothing was ever deployed", async () => {
    fetchPublishHistory.mockResolvedValue([]);
    renderTab(<PublishTab composer={composerWith([])} projectId="site_1" nextMove={OPEN_MOVE} onRequestPublish={vi.fn()} />);

    await expandSections();
    await waitFor(() =>
      expect(screen.getByText("Publishing will put the whole site live for the first time.")).toBeInTheDocument(),
    );
    expect(screen.queryByText("Nothing has changed since the last deploy.")).toBeNull();
    // The two sections must agree.
    expect(screen.getByText("This site has never been published.")).toBeInTheDocument();
  });

  it("keeps the original sentence once a deploy exists", async () => {
    fetchPublishHistory.mockResolvedValue([
      {
        id: "j1",
        version: 4,
        completedAt: new Date("2026-08-14T10:00:00Z"),
        deploymentId: "d",
        rollbackable: true,
        rolledBackFrom: null,
      },
    ]);
    renderTab(<PublishTab composer={composerWith([])} projectId="site_1" nextMove={OPEN_MOVE} onRequestPublish={vi.fn()} />);

    await expandSections();
    await waitFor(() =>
      expect(screen.getByText("Nothing has changed since the last deploy.")).toBeInTheDocument(),
    );
    expect(screen.queryByText("Publishing will put the whole site live for the first time.")).toBeNull();
  });
});

describe("PublishTab — Unpublish has a door, one confirm, and tells the shell", () => {
  it("offers Unpublish only on a live deploy, confirms in the dashboard's words, then unpublishes", async () => {
    fetchPublishHistory.mockResolvedValue([
      { id: "j1", version: 3, completedAt: new Date(), deploymentId: "d", rollbackable: true, rolledBackFrom: null },
    ]);
    const unpublished = vi.fn();
    renderTab(
      <PublishTab
        composer={composerWith()}
        projectId="site_1"
        publishedUrl="https://bellacucina.com"
        /* Idle, not "published": liveness comes from the last deploy, which
           the just-published state replaces with the result section. */
        publishJob={{ ...job({ uiState: "idle", publishedUrl: "https://bellacucina.com" }), unpublished }}
        nextMove={OPEN_MOVE} onRequestPublish={vi.fn()}
      />,
    );
    await expandSections();
    await waitFor(() => expect(screen.getByText("LIVE · v3")).toBeTruthy());
    await openPublishMenu();
    fireEvent.click(await screen.findByRole("menuitem", { name: "Unpublish site…" }));
    expect(screen.getByText("Unpublish site?")).toBeTruthy();
    expect(unpublishSite).not.toHaveBeenCalled();
    /* Typed confirm (board 4418:98016, decision 29 — wide action): the button
       is dead until the word is typed, so a reflex Enter cannot take the site
       down. */
    const confirm = screen.getByTestId("unpublish-confirm-button") as HTMLButtonElement;
    expect(confirm.disabled).toBe(true);
    fireEvent.click(confirm);
    expect(unpublishSite).not.toHaveBeenCalled();
    fireEvent.change(screen.getByTestId("unpublish-word"), { target: { value: "unpublish" } });
    expect(confirm.disabled).toBe(true);
    fireEvent.change(screen.getByTestId("unpublish-word"), { target: { value: "UNPUBLISH" } });
    expect(confirm.disabled).toBe(false);
    fireEvent.click(confirm);
    await waitFor(() => expect(unpublishSite).toHaveBeenCalledWith("site_1"));
    await waitFor(() => expect(unpublished).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.queryByText("Unpublish site?")).toBeNull());
  });

  it("a failed unpublish keeps the dialog up — the site is still live", async () => {
    fetchPublishHistory.mockResolvedValue([
      { id: "j1", version: 3, completedAt: new Date(), deploymentId: "d", rollbackable: true, rolledBackFrom: null },
    ]);
    unpublishSite.mockRejectedValueOnce(new Error("Vercel refused"));
    const unpublished = vi.fn();
    renderTab(
      <PublishTab
        composer={composerWith()}
        projectId="site_1"
        publishedUrl="https://bellacucina.com"
        publishJob={{ ...job({ uiState: "idle", publishedUrl: "https://bellacucina.com" }), unpublished }}
        nextMove={OPEN_MOVE} onRequestPublish={vi.fn()}
      />,
    );
    await expandSections();
    await waitFor(() => expect(screen.getByText("LIVE · v3")).toBeTruthy());
    await openPublishMenu();
    fireEvent.click(await screen.findByRole("menuitem", { name: "Unpublish site…" }));
    fireEvent.change(screen.getByTestId("unpublish-word"), { target: { value: "UNPUBLISH" } });
    fireEvent.click(screen.getByTestId("unpublish-confirm-button"));
    await waitFor(() => expect(unpublishSite).toHaveBeenCalled());
    await waitFor(() => expect((screen.getByTestId("unpublish-confirm-button") as HTMLButtonElement).disabled).toBe(false));
    expect(screen.getByText("Unpublish site?")).toBeTruthy();
    expect(unpublished).not.toHaveBeenCalled();
  });

  it("the site menu's door lands on the same typed confirm (cold open)", async () => {
    const consumed = vi.fn();
    renderTab(
      <PublishTab
        composer={composerWith()}
        projectId="site_1"
        publishedUrl="https://bellacucina.com"
        publishJob={job({ uiState: "idle", publishedUrl: "https://bellacucina.com" })}
        nextMove={OPEN_MOVE} onRequestPublish={vi.fn()}
        initialUnpublish
        onUnpublishIntentConsumed={consumed}
      />,
    );
    expect(await screen.findByText("Unpublish site?")).toBeTruthy();
    expect(screen.getByTestId("unpublish-word")).toBeTruthy();
    expect(consumed).toHaveBeenCalledTimes(1);
  });

  it("does not offer Unpublish on a deploy that is not serving", async () => {
    fetchPublishHistory.mockResolvedValue([
      { id: "j1", version: 1, completedAt: new Date(), deploymentId: "d", rollbackable: true, rolledBackFrom: null },
    ]);
    renderTab(<PublishTab composer={composerWith()} projectId="site_1" nextMove={OPEN_MOVE} onRequestPublish={vi.fn()} />);
    await expandSections();
    await waitFor(() => expect(screen.getByText("Not live · v1")).toBeTruthy());
    await openPublishMenu();
    expect(screen.getByRole("menuitem", { name: "All versions ›" })).toBeTruthy();
    expect(screen.queryByRole("menuitem", { name: "Unpublish site…" })).toBeNull();
  });
});

describe("PublishTab — board 4418:97118 flow (Fix ›, Release to, collapsed sections, ⋯)", () => {
  it("Changes in this session and Last deploy start collapsed and open on their header", async () => {
    renderTab(<PublishTab composer={composerWith()} projectId="site_1" nextMove={OPEN_MOVE} onRequestPublish={vi.fn()} />);
    const last = await screen.findByRole("button", { name: "Last deploy" });
    expect(last.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByText("This site has never been published.")).toBeNull();
    fireEvent.click(last);
    expect(await screen.findByText("This site has never been published.")).toBeTruthy();
  });

  it("Production and Preview deployment open Settings › Domains", async () => {
    const composer = composerWith();
    renderTab(<PublishTab composer={composer} projectId="site_1" nextMove={OPEN_MOVE} onRequestPublish={vi.fn()} />);
    fireEvent.click(await screen.findByTestId("publish-env-preview"));
    expect(composer!.emit).toHaveBeenCalledWith("ui:settings-open", { screen: "domains" });
  });

  it("⋯ All versions › opens History on Published", async () => {
    const composer = composerWith();
    renderTab(<PublishTab composer={composer} projectId="site_1" nextMove={OPEN_MOVE} onRequestPublish={vi.fn()} />);
    await openPublishMenu();
    fireEvent.click(await screen.findByRole("menuitem", { name: "All versions ›" }));
    expect(composer!.emit).toHaveBeenCalledWith("panel:open", { panel: "history", screen: "published" });
  });
});
