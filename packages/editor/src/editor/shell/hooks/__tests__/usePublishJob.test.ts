/**
 * usePublishJob.test.ts — publish flow state machine: happy-path 2s polling
 * (QUEUED → BUILDING → COMPLETED), FAILED/CANCELLED terminals, re-entrancy
 * guard, republish after terminal, mount hydration, cancel() and reset().
 *
 * @license BSD-3-Clause
 */

import { renderHook, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  publishSite,
  fetchPublishStatus,
  cancelPublish,
  fetchSitePublishState,
  type PublishStatus,
} from "@/services/PublishService";
import { getSiteIdFromUrl } from "@/services/BuildrikSyncProvider";
import { usePublishJob } from "../usePublishJob";
import { PUBLISH_APPROVAL_MESSAGES } from "@buildrik/shared/schemas/publish";

vi.mock("@/services/PublishService", () => ({
  publishSite: vi.fn(),
  fetchPublishStatus: vi.fn(),
  cancelPublish: vi.fn(),
  fetchSitePublishState: vi.fn(),
}));

vi.mock("@/services/BuildrikSyncProvider", () => ({
  /* Added with the attribution wiring: useComposerInit now reads the
     signed-in user so versions and history stop recording `userId: null`. */
  loadCurrentUserId: vi.fn(() => Promise.resolve(null)),
  getSiteIdFromUrl: vi.fn(() => null),
}));

const mockPublishSite = vi.mocked(publishSite);
const mockFetchStatus = vi.mocked(fetchPublishStatus);
const mockCancel = vi.mocked(cancelPublish);
const mockFetchSiteState = vi.mocked(fetchSitePublishState);
const mockGetSiteId = vi.mocked(getSiteIdFromUrl);

const PAGES = [{ path: "index.html", html: "<h1>hi</h1>" }];

function statusOf(
  status: PublishStatus["status"],
  overrides: Partial<PublishStatus> = {},
): PublishStatus {
  return { jobId: "job-1", status, progress: 0, ...overrides };
}

/** Flush the immediate first poll (fired via `void tick(id)` in startPolling). */
async function flushMicrotasks() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });
}

async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

describe("usePublishJob", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockGetSiteId.mockReturnValue(null);
    mockPublishSite.mockResolvedValue({ jobId: "job-1" });
    mockCancel.mockResolvedValue(undefined);
    mockFetchSiteState.mockResolvedValue({ isPublished: false, publishedUrl: null, hasUnpublishedChanges: null, lastPublishedAt: null, lastEditedAt: null });
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("starts idle with no job, no progress, no error", () => {
    const { result } = renderHook(() => usePublishJob());
    expect(result.current.uiState).toBe("idle");
    expect(result.current.jobId).toBeNull();
    expect(result.current.progress).toBe(0);
    expect(result.current.publishedUrl).toBeNull();
    expect(result.current.error).toBeNull();
  });

  describe("publish() happy path", () => {
    it("walks QUEUED → BUILDING → COMPLETED on the 2000ms poll cadence", async () => {
      mockFetchStatus
        .mockResolvedValueOnce(statusOf("QUEUED"))
        .mockResolvedValueOnce(statusOf("BUILDING", { progress: 40 }))
        .mockResolvedValueOnce(
          statusOf("COMPLETED", {
            progress: 100,
            publishedUrl: "https://site-1.vercel.app",
          }),
        );

      const { result } = renderHook(() => usePublishJob());

      await act(async () => {
        await result.current.publish("site-1", PAGES);
      });
      await flushMicrotasks();

      expect(mockPublishSite).toHaveBeenCalledWith("site-1", PAGES);
      expect(result.current.jobId).toBe("job-1");
      expect(result.current.uiState).toBe("publishing");
      expect(result.current.progress).toBe(0);
      // Immediate first poll fired without waiting for the interval.
      expect(mockFetchStatus).toHaveBeenCalledTimes(1);
      expect(mockFetchStatus).toHaveBeenCalledWith("job-1");

      await advance(2000);
      expect(result.current.uiState).toBe("publishing");
      expect(result.current.progress).toBe(40);
      expect(mockFetchStatus).toHaveBeenCalledTimes(2);

      await advance(2000);
      expect(result.current.uiState).toBe("published");
      expect(result.current.progress).toBe(100);
      expect(result.current.publishedUrl).toBe("https://site-1.vercel.app");
      expect(result.current.error).toBeNull();
      expect(mockFetchStatus).toHaveBeenCalledTimes(3);

      // Terminal state stops the poll loop.
      await advance(10000);
      expect(mockFetchStatus).toHaveBeenCalledTimes(3);
    });

    it("stays 'publishing' through intermediate DEPLOYING states", async () => {
      mockFetchStatus
        .mockResolvedValueOnce(statusOf("QUEUED"))
        .mockResolvedValueOnce(statusOf("DEPLOYING", { progress: 80 }));

      const { result } = renderHook(() => usePublishJob());
      await act(async () => {
        await result.current.publish("site-1", PAGES);
      });
      await flushMicrotasks();
      await advance(2000);

      expect(result.current.uiState).toBe("publishing");
      expect(result.current.progress).toBe(80);
    });
  });

  describe("FAILED / CANCELLED terminals", () => {
    it("surfaces the job error and stops polling on FAILED", async () => {
      mockFetchStatus
        .mockResolvedValueOnce(statusOf("QUEUED"))
        .mockResolvedValueOnce(statusOf("FAILED", { error: "Build exploded" }));

      const { result } = renderHook(() => usePublishJob());
      await act(async () => {
        await result.current.publish("site-1", PAGES);
      });
      await flushMicrotasks();
      await advance(2000);

      expect(result.current.uiState).toBe("failed");
      expect(result.current.error).toBe("Build exploded");

      await advance(10000);
      expect(mockFetchStatus).toHaveBeenCalledTimes(2);
    });

    it("FAILED without an error message still flips uiState to failed", async () => {
      mockFetchStatus.mockResolvedValueOnce(statusOf("FAILED"));

      const { result } = renderHook(() => usePublishJob());
      await act(async () => {
        await result.current.publish("site-1", PAGES);
      });
      await flushMicrotasks();

      expect(result.current.uiState).toBe("failed");
      expect(result.current.error).toBeNull();
    });

    it("flips uiState to cancelled and stops polling on CANCELLED", async () => {
      mockFetchStatus
        .mockResolvedValueOnce(statusOf("QUEUED"))
        .mockResolvedValueOnce(statusOf("CANCELLED"));

      const { result } = renderHook(() => usePublishJob());
      await act(async () => {
        await result.current.publish("site-1", PAGES);
      });
      await flushMicrotasks();
      await advance(2000);

      expect(result.current.uiState).toBe("cancelled");

      await advance(10000);
      expect(mockFetchStatus).toHaveBeenCalledTimes(2);
    });
  });

  describe("re-entrancy guard", () => {
    it("blocks a second publish while the job is non-terminal", async () => {
      mockFetchStatus.mockResolvedValue(statusOf("BUILDING", { progress: 20 }));

      const { result } = renderHook(() => usePublishJob());
      await act(async () => {
        await result.current.publish("site-1", PAGES);
      });
      await flushMicrotasks();
      expect(mockPublishSite).toHaveBeenCalledTimes(1);

      await act(async () => {
        await result.current.publish("site-1", PAGES);
      });
      expect(mockPublishSite).toHaveBeenCalledTimes(1);
      expect(result.current.jobId).toBe("job-1");
    });

    it("allows republish after a terminal state and polls the new job", async () => {
      mockPublishSite
        .mockResolvedValueOnce({ jobId: "job-1" })
        .mockResolvedValueOnce({ jobId: "job-2" });
      mockFetchStatus
        .mockResolvedValueOnce(
          statusOf("COMPLETED", { progress: 100, publishedUrl: "https://v1.vercel.app" }),
        )
        .mockResolvedValueOnce(statusOf("QUEUED", { jobId: "job-2" }));

      const { result } = renderHook(() => usePublishJob());
      await act(async () => {
        await result.current.publish("site-1", PAGES);
      });
      await flushMicrotasks();
      expect(result.current.uiState).toBe("published");

      await act(async () => {
        await result.current.publish("site-1", PAGES);
      });
      await flushMicrotasks();

      expect(mockPublishSite).toHaveBeenCalledTimes(2);
      expect(result.current.jobId).toBe("job-2");
      expect(result.current.uiState).toBe("publishing");
      expect(mockFetchStatus).toHaveBeenLastCalledWith("job-2");
    });
  });

  describe("error paths", () => {
    /* This asserted `uiState === "idle"`, which is what the bug looked like
       from inside the hook: a publish that dies before a job id exists set
       `error` and reported idle, and BOTH readers of a failure gate on
       `uiState === "failed"` — PublishTab's board 784:4403 branch and the
       outcome toast. The user got no toast, no panel state, nothing. The test
       named the wrong thing as correct. */
    it("reports failed — not idle — when publishSite rejects before a job exists", async () => {
      mockPublishSite.mockRejectedValueOnce(new Error("Publish quota exceeded"));

      const { result } = renderHook(() => usePublishJob());
      await act(async () => {
        await result.current.publish("site-1", PAGES);
      });

      expect(result.current.error).toBe("Publish quota exceeded");
      expect(result.current.uiState).toBe("failed");
      expect(result.current.jobId).toBeNull();
      expect(mockFetchStatus).not.toHaveBeenCalled();
    });

    it("goes back to idle once the failure is reset", async () => {
      mockPublishSite.mockRejectedValueOnce(new Error("Publish quota exceeded"));

      const { result } = renderHook(() => usePublishJob());
      await act(async () => {
        await result.current.publish("site-1", PAGES);
      });
      expect(result.current.uiState).toBe("failed");

      // The panel's "Try again" resets before reopening the wizard; a sticky
      // failed state would keep board 784:4403 on screen behind it.
      act(() => result.current.reset());
      expect(result.current.uiState).toBe("idle");
      expect(result.current.error).toBeNull();
    });

    it("falls back to 'Publish failed' for non-Error rejections", async () => {
      mockPublishSite.mockRejectedValueOnce("boom");

      const { result } = renderHook(() => usePublishJob());
      await act(async () => {
        await result.current.publish("site-1", PAGES);
      });

      expect(result.current.error).toBe("Publish failed");
    });

    it("backs off across consecutive poll failures instead of orphaning the job on the first one", async () => {
      mockFetchStatus.mockRejectedValue(new Error("network down"));

      const { result } = renderHook(() => usePublishJob());
      await act(async () => {
        await result.current.publish("site-1", PAGES);
      });
      await flushMicrotasks();
      // Failure 1 of 3 — no error surfaced yet, polling keeps going.
      expect(result.current.error).toBeNull();
      expect(result.current.uiState).toBe("publishing");
      expect(mockFetchStatus).toHaveBeenCalledTimes(1);

      await advance(2000);
      // Failure 2 of 3 — still no error.
      expect(result.current.error).toBeNull();
      expect(result.current.uiState).toBe("publishing");
      expect(mockFetchStatus).toHaveBeenCalledTimes(2);

      await advance(2000);
      // Failure 3 of 3 — now surfaces and stops. B-2: jobId stays set (the
      // job never reached a terminal status on its own) so uiState MUST fold
      // the lost poll in as "failed" — otherwise the panel spins forever with
      // no retry, which is the bug this test pins.
      expect(result.current.error).toBe("network down");
      expect(result.current.uiState).toBe("failed");
      expect(mockFetchStatus).toHaveBeenCalledTimes(3);

      await advance(10000);
      expect(mockFetchStatus).toHaveBeenCalledTimes(3);
    });

    it("track() resumes polling and clears the poll-lost failed state on success", async () => {
      mockFetchStatus.mockRejectedValue(new Error("network down"));

      const { result } = renderHook(() => usePublishJob());
      await act(async () => {
        await result.current.publish("site-1", PAGES);
      });
      await flushMicrotasks();
      await advance(2000);
      await advance(2000);
      expect(result.current.uiState).toBe("failed");
      const lostJobId = result.current.jobId;
      expect(lostJobId).not.toBeNull();

      // The panel's "Check status" retry resumes tracking the SAME job.
      mockFetchStatus.mockReset();
      mockFetchStatus.mockResolvedValue(statusOf("COMPLETED", { jobId: lostJobId! }));

      act(() => result.current.track(lostJobId!));
      await flushMicrotasks();

      expect(result.current.uiState).toBe("published");
      expect(result.current.error).toBeNull();
    });

    it("a single dropped poll does not stop polling", async () => {
      mockFetchStatus
        .mockRejectedValueOnce(new Error("blip"))
        .mockResolvedValue(statusOf("BUILDING", { progress: 40 }));

      const { result } = renderHook(() => usePublishJob());
      await act(async () => {
        await result.current.publish("site-1", PAGES);
      });
      await flushMicrotasks();
      expect(result.current.error).toBeNull();

      await advance(2000);
      expect(result.current.error).toBeNull();
      expect(result.current.uiState).toBe("publishing");
      expect(result.current.progress).toBe(40);
    });

    it("republish is allowed once the poll is lost, even though the last status was never terminal", async () => {
      mockFetchStatus.mockRejectedValue(new Error("network down"));

      const { result } = renderHook(() => usePublishJob());
      await act(async () => {
        await result.current.publish("site-1", PAGES);
      });
      await flushMicrotasks();
      await advance(2000);
      await advance(2000);
      expect(result.current.error).toBe("network down");

      mockPublishSite.mockResolvedValueOnce({ jobId: "job-2" });
      mockFetchStatus.mockResolvedValue(statusOf("QUEUED", { jobId: "job-2" }));

      await act(async () => {
        await result.current.publish("site-1", PAGES);
      });
      await flushMicrotasks();

      expect(mockPublishSite).toHaveBeenCalledTimes(2);
      expect(result.current.jobId).toBe("job-2");
    });
  });

  describe("in-flight guard (B-2) — a double click before the request lands", () => {
    it("a second publish() fired before the first await resolves creates only one job", async () => {
      let resolvePublish: (v: { jobId: string }) => void = () => {};
      mockPublishSite.mockImplementationOnce(
        () => new Promise((resolve) => { resolvePublish = resolve; }),
      );

      const { result } = renderHook(() => usePublishJob());

      let firstDone: Promise<void>;
      let secondDone: Promise<void>;
      await act(async () => {
        firstDone = result.current.publish("site-1", PAGES);
        secondDone = result.current.publish("site-1", PAGES);
        resolvePublish({ jobId: "job-1" });
        await Promise.all([firstDone, secondDone]);
      });

      expect(mockPublishSite).toHaveBeenCalledTimes(1);
      expect(result.current.jobId).toBe("job-1");
    });
  });

  /* P2-1 (2026-10-08 audit): the poll was a bare setInterval over an async
     tick. A slow tick still in flight when a later one applied COMPLETED (and
     stopped polling) then landed BUILDING over it — "publishing" forever, no
     outcome toast. Ticks no longer overlap, and a response from a poll that
     has since stopped or moved to another job is dropped. */
  describe("poll sequencing (P2-1)", () => {
    it("does not send a status request while the previous one is still in flight", async () => {
      let release: (s: PublishStatus) => void = () => {};
      mockFetchStatus.mockImplementationOnce(() => new Promise((r) => { release = r; }));
      mockFetchStatus.mockResolvedValue(statusOf("COMPLETED", { progress: 100, publishedUrl: "https://x" }));

      const { result } = renderHook(() => usePublishJob());
      await act(async () => {
        await result.current.publish("site-1", PAGES);
      });
      await flushMicrotasks();
      await advance(2000);
      await advance(2000);
      expect(mockFetchStatus).toHaveBeenCalledTimes(1);

      await act(async () => {
        release(statusOf("BUILDING", { progress: 40 }));
      });
      await advance(2000);
      expect(mockFetchStatus).toHaveBeenCalledTimes(2);
      expect(result.current.uiState).toBe("published");
    });

    it("drops a response that belongs to a job the hook has moved off", async () => {
      let release: (s: PublishStatus) => void = () => {};
      mockFetchStatus.mockImplementationOnce(() => new Promise((r) => { release = r; }));
      mockFetchStatus.mockResolvedValue(statusOf("QUEUED", { jobId: "job-2" }));

      const { result } = renderHook(() => usePublishJob());
      await act(async () => {
        await result.current.publish("site-1", PAGES);
      });
      await flushMicrotasks();

      act(() => result.current.track("job-2"));
      await flushMicrotasks();
      await act(async () => {
        release(statusOf("FAILED", { error: "old job" }));
      });

      expect(result.current.jobId).toBe("job-2");
      expect(result.current.uiState).toBe("publishing");
      expect(result.current.error).toBeNull();
    });
  });

  describe("mount hydration from fetchSitePublishState", () => {
    it("hydrates a previously published site to 'published' with no job", async () => {
      mockGetSiteId.mockReturnValue("site-9");
      mockFetchSiteState.mockResolvedValue({
        isPublished: true,
        publishedUrl: "https://live.example.com",
        hasUnpublishedChanges: null,
        lastPublishedAt: null,
        lastEditedAt: null,
      });

      const { result } = renderHook(() => usePublishJob());
      await flushMicrotasks();

      expect(mockFetchSiteState).toHaveBeenCalledWith("site-9");
      expect(result.current.uiState).toBe("published");
      expect(result.current.publishedUrl).toBe("https://live.example.com");
      expect(result.current.jobId).toBeNull();
    });

    it("stays idle when the site is not published", async () => {
      mockGetSiteId.mockReturnValue("site-9");
      mockFetchSiteState.mockResolvedValue({ isPublished: false, publishedUrl: null, hasUnpublishedChanges: null, lastPublishedAt: null, lastEditedAt: null });

      const { result } = renderHook(() => usePublishJob());
      await flushMicrotasks();

      expect(result.current.uiState).toBe("idle");
      expect(result.current.publishedUrl).toBeNull();
    });

    it("does not hydrate when no siteId is in the URL", async () => {
      mockGetSiteId.mockReturnValue(null);

      renderHook(() => usePublishJob());
      await flushMicrotasks();

      expect(mockFetchSiteState).not.toHaveBeenCalled();
    });

    it("hydration failure is best-effort — falls back to idle with no error", async () => {
      mockGetSiteId.mockReturnValue("site-9");
      mockFetchSiteState.mockRejectedValue(new Error("offline"));

      const { result } = renderHook(() => usePublishJob());
      await flushMicrotasks();

      expect(result.current.uiState).toBe("idle");
      expect(result.current.error).toBeNull();
    });

    it("hydrated 'published' does not poison the re-entrancy guard", async () => {
      mockGetSiteId.mockReturnValue("site-9");
      mockFetchSiteState.mockResolvedValue({
        isPublished: true,
        publishedUrl: "https://live.example.com",
        hasUnpublishedChanges: null,
        lastPublishedAt: null,
        lastEditedAt: null,
      });
      mockFetchStatus.mockResolvedValueOnce(statusOf("QUEUED"));

      const { result } = renderHook(() => usePublishJob());
      await flushMicrotasks();
      expect(result.current.uiState).toBe("published");

      await act(async () => {
        await result.current.publish("site-9", PAGES);
      });
      await flushMicrotasks();

      expect(mockPublishSite).toHaveBeenCalledTimes(1);
      expect(result.current.uiState).toBe("publishing");
    });
  });

  describe("cancel()", () => {
    it("no-ops when there is no job", async () => {
      const { result } = renderHook(() => usePublishJob());
      await act(async () => {
        await result.current.cancel();
      });
      expect(mockCancel).not.toHaveBeenCalled();
    });

    it("forwards the jobId to cancelPublish", async () => {
      mockFetchStatus.mockResolvedValue(statusOf("QUEUED"));

      const { result } = renderHook(() => usePublishJob());
      await act(async () => {
        await result.current.publish("site-1", PAGES);
      });
      await flushMicrotasks();

      await act(async () => {
        await result.current.cancel();
      });
      expect(mockCancel).toHaveBeenCalledWith("job-1");
    });

    it("surfaces cancel failures via error", async () => {
      mockFetchStatus.mockResolvedValue(statusOf("QUEUED"));
      mockCancel.mockRejectedValueOnce(new Error("already deploying"));

      const { result } = renderHook(() => usePublishJob());
      await act(async () => {
        await result.current.publish("site-1", PAGES);
      });
      await flushMicrotasks();

      await act(async () => {
        await result.current.cancel();
      });
      expect(result.current.error).toBe("already deploying");
    });
  });

  describe("reset() and unmount", () => {
    it("reset() clears job state and stops polling", async () => {
      mockFetchStatus.mockResolvedValue(statusOf("QUEUED"));

      const { result } = renderHook(() => usePublishJob());
      await act(async () => {
        await result.current.publish("site-1", PAGES);
      });
      await flushMicrotasks();
      expect(result.current.uiState).toBe("publishing");
      const pollCount = mockFetchStatus.mock.calls.length;

      act(() => {
        result.current.reset();
      });

      expect(result.current.uiState).toBe("idle");
      expect(result.current.jobId).toBeNull();
      expect(result.current.error).toBeNull();

      await advance(10000);
      expect(mockFetchStatus).toHaveBeenCalledTimes(pollCount);
    });

    it("unmount stops the poll loop", async () => {
      mockFetchStatus.mockResolvedValue(statusOf("QUEUED"));

      const { result, unmount } = renderHook(() => usePublishJob());
      await act(async () => {
        await result.current.publish("site-1", PAGES);
      });
      await flushMicrotasks();
      const pollCount = mockFetchStatus.mock.calls.length;

      unmount();
      await advance(10000);
      expect(mockFetchStatus).toHaveBeenCalledTimes(pollCount);
    });
  });

  describe("approval gate (contracts §1.5 / §2)", () => {
    it("classifies a stale-approval rejection into blockedReason, not error", async () => {
      mockPublishSite.mockRejectedValueOnce(
        new Error(
          "This site changed after it was approved. Re-send it for review, or acknowledge to publish the un-approved changes.",
        ),
      );
      const { result } = renderHook(() => usePublishJob());
      await act(async () => {
        await result.current.publish("site-1", PAGES);
      });
      expect(result.current.blockedReason).toBe("stale-approval");
      expect(result.current.error).toBeNull();
      expect(result.current.uiState).toBe("idle");
    });

    /**
     * Board S5.4 draws the approval gate as three screens. They used to arrive
     * as one `needs-approval` carrying one sentence, so a user whose reviewer
     * had already asked for changes was told to send the site for review.
     * The server now sends a distinct message per state and this is where they
     * are told apart — the messages are the discriminator (all three come back
     * as tRPC PRECONDITION_FAILED), so a reworded server message must be
     * reflected here or the gate silently degrades to a red error toast.
     */
    it.each([
      ["This site has not been sent for review yet. Send it for review to publish.", "no-review"],
      ["This site is waiting on its review. You can publish once it is approved.", "review-pending"],
      [
        "The reviewer asked for changes. Resolve the open comments and re-send for review.",
        "changes-requested",
      ],
    ])("classifies %s", async (message, reason) => {
      mockPublishSite.mockRejectedValueOnce(new Error(message));
      const { result } = renderHook(() => usePublishJob());
      await act(async () => {
        await result.current.publish("site-1", PAGES);
      });
      expect(result.current.blockedReason).toBe(reason);
      expect(result.current.error).toBeNull();
    });

    it("a non-approval rejection still lands in error, not blockedReason", async () => {
      mockPublishSite.mockRejectedValueOnce(new Error("Something else went wrong"));
      const { result } = renderHook(() => usePublishJob());
      await act(async () => {
        await result.current.publish("site-1", PAGES);
      });
      expect(result.current.blockedReason).toBeNull();
      expect(result.current.error).toBe("Something else went wrong");
    });

    it("acknowledgeStale passes the third arg through to publishSite", async () => {
      mockPublishSite.mockResolvedValueOnce({ jobId: "job-ack" });
      const { result } = renderHook(() => usePublishJob());
      await act(async () => {
        await result.current.publish("site-1", PAGES, { acknowledgeStale: true });
      });
      expect(mockPublishSite).toHaveBeenCalledWith("site-1", PAGES, true);
    });

    it("dismissBlock clears the block without publishing", async () => {
      mockPublishSite.mockRejectedValueOnce(
        /* The REAL sentence, not a paraphrase. This read
           "This site changed after it was approved. …acknowledge…" and passed
           only because the classifier matched on the word "acknowledge" — a
           string the server never sends. */
        new Error(PUBLISH_APPROVAL_MESSAGES["stale-unacknowledged"]),
      );
      const { result } = renderHook(() => usePublishJob());
      await act(async () => {
        await result.current.publish("site-1", PAGES);
      });
      expect(result.current.blockedReason).toBe("stale-approval");
      await act(async () => {
        result.current.dismissBlock();
      });
      expect(result.current.blockedReason).toBeNull();
    });
  });
});

/* The gate spans two packages: the server throws one of four sentences and this
   hook reads it back to choose the recovery UI. Before they were shared, each
   side kept its own copy — the router's in `sites.ts`, the editor's as regexes
   — and nothing failed if one was reworded. This drives the hook the way the
   app does, so it locks the pairing itself: a sentence can only change in
   @buildrik/shared, where both sides read it. */
describe("approval-gate messages are one contract, not two copies", () => {
  const EXPECTED: Record<string, string> = {
    "no-review-sent": "no-review",
    "review-pending": "review-pending",
    "changes-requested": "changes-requested",
    "stale-unacknowledged": "stale-approval",
  };

  it.each(Object.entries(PUBLISH_APPROVAL_MESSAGES))(
    "%s -> its own recovery reason",
    async (key, sentence) => {
      mockPublishSite.mockRejectedValueOnce(new Error(sentence));
      const { result } = renderHook(() => usePublishJob());
      await act(async () => { await result.current.publish("site-1", PAGES); });
      expect(result.current.blockedReason).toBe(EXPECTED[key]);
    },
  );

  it("gives the four blocks four DIFFERENT reasons", () => {
    expect(new Set(Object.values(EXPECTED)).size).toBe(4);
  });

  it("still matches when the sentence arrives wrapped by tRPC", async () => {
    mockPublishSite.mockRejectedValueOnce(
      new Error(`PRECONDITION_FAILED: ${PUBLISH_APPROVAL_MESSAGES["no-review-sent"]}`),
    );
    const { result } = renderHook(() => usePublishJob());
    await act(async () => { await result.current.publish("site-1", PAGES); });
    expect(result.current.blockedReason).toBe("no-review");
  });

  it("leaves the reason null for a failure that is not the approval gate", async () => {
    mockPublishSite.mockRejectedValueOnce(new Error("Vercel rejected the deployment."));
    const { result } = renderHook(() => usePublishJob());
    await act(async () => { await result.current.publish("site-1", PAGES); });
    expect(result.current.blockedReason).toBeNull();
  });
});

describe("unpublished() — the server took the site down, the hook stops saying live", () => {
  /* Outside the top-level describe, so it owns its own timers: flushMicrotasks
     advances fake timers, and without these the first full-suite run failed
     here while every targeted run had skipped this file. */
  beforeEach(() => {
    vi.useFakeTimers();
    mockFetchSiteState.mockReset();
    mockGetSiteId.mockReset();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  /* The shell derives publishedUrl from the last job's status OR the hydrated
     state, so a successful sites.unpublish has to clear both, or the topbar
     keeps a green Published over a site that is a draft again. The hook has
     no composer, but the panel receives this whole result as a prop, so it
     reports the new truth through a method rather than an event. */
  it("drops the hydrated live URL and reads idle", async () => {
    mockGetSiteId.mockReturnValue("site-9");
    mockFetchSiteState.mockResolvedValue({
      isPublished: true,
      publishedUrl: "https://live.example.com",
      hasUnpublishedChanges: null,
      lastPublishedAt: null,
      lastEditedAt: null,
    });
    const { result } = renderHook(() => usePublishJob());
    await flushMicrotasks();
    expect(result.current.publishedUrl).toBe("https://live.example.com");

    act(() => result.current.unpublished());
    expect(result.current.publishedUrl).toBeNull();
    expect(result.current.uiState).toBe("idle");
    expect(mockFetchSiteState).toHaveBeenCalledTimes(1); // no re-fetch: the caller just wrote the truth
  });
});
