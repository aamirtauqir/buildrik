/**
 * useLifecycle — the site's ONE next move, derived once.
 *
 * The review-status reads and the "Review closed" toast lived in
 * StudioHeader; the derivation was the topbar's alone, which is how the panel
 * came to disagree with it (B4, decision #34). Ported here with the hook.
 *
 * @license BSD-3-Clause
 */
import { renderHook, act, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/shared/utils/featureFlags", () => ({ isFeatureEnabled: vi.fn(() => true) }));
vi.mock("../useEditorRole", () => ({ useEditorRole: () => null }));

const fetchReviewStatus = vi.fn();
const fetchReviewStatusOrNull = vi.fn();
const fetchCurrentRound = vi.fn();
vi.mock("@/services/ReviewService", () => ({
  fetchReviewStatus: (...a: unknown[]) => fetchReviewStatus(...a),
  fetchReviewStatusOrNull: (...a: unknown[]) => fetchReviewStatusOrNull(...a),
  fetchCurrentRound: (...a: unknown[]) => fetchCurrentRound(...a),
  UNKNOWN_REVIEW_STATUS: {
    state: "none",
    reviewerName: null,
    at: null,
    reviewsEnabled: null,
    editsRequireApproval: null,
  },
}));

import { useLifecycle, type UseLifecycleInput } from "../useLifecycle";
import { EVENTS } from "@/shared/constants";
import type { ReviewStatus } from "@/services/ReviewService";

const status = (o: Partial<ReviewStatus> = {}): ReviewStatus => ({
  state: "none",
  reviewerName: null,
  at: null,
  reviewsEnabled: true,
  editsRequireApproval: true,
  ...o,
});

function makeComposer() {
  const handlers = new Map<string, Set<(p: unknown) => void>>();
  return {
    on: vi.fn((ev: string, fn: (p: unknown) => void) => {
      if (!handlers.has(ev)) handlers.set(ev, new Set());
      handlers.get(ev)!.add(fn);
    }),
    off: vi.fn((ev: string, fn: (p: unknown) => void) => handlers.get(ev)?.delete(fn)),
    emit: (ev: string, p?: unknown) => handlers.get(ev)?.forEach((fn) => fn(p)),
  };
}

const input = (over: Partial<UseLifecycleInput> = {}): UseLifecycleInput => ({
  composer: null,
  addToast: vi.fn(() => "id"),
  isDirty: false,
  lastSavedAt: null,
  offline: false,
  errorCount: 0,
  publishedUrl: null,
  lastPublishedAt: null,
  serverHasUnpublishedChanges: null,
  serverBlock: null,
  ...over,
});

const settle = async () => {
  await act(async () => {});
};

beforeEach(() => {
  fetchReviewStatus.mockReset();
  fetchReviewStatusOrNull.mockReset();
  fetchCurrentRound.mockReset();
  fetchReviewStatus.mockResolvedValue(status());
  fetchReviewStatusOrNull.mockResolvedValue(null);
  fetchCurrentRound.mockResolvedValue(null);
});
afterEach(cleanup);

describe("useLifecycle — the reads", () => {
  it("holds the in-flight control until the status lands, then derives", async () => {
    fetchReviewStatus.mockResolvedValue(status({ state: "pending", reviewerName: "Sara" }));
    const { result } = renderHook((p: UseLifecycleInput) => useLifecycle(p), { initialProps: input() });
    expect(result.current.nextMove?.blockedReason).toBe("Checking this site's review settings…");
    await settle();
    expect(result.current.nextMove?.gate).toBe("waiting");
    expect(result.current.nextMove?.gateReason).toBe("Waiting on Sara's approval");
  });

  it("re-reads on REVIEW_SENT so every surface moves in the same render", async () => {
    const composer = makeComposer();
    fetchReviewStatus.mockResolvedValue(status({ state: "none" }));
    const { result } = renderHook((p: UseLifecycleInput) => useLifecycle(p), {
      initialProps: input({ composer: composer as never }),
    });
    await settle();
    expect(result.current.nextMove?.kind).toBe("send-for-review");

    fetchReviewStatusOrNull.mockResolvedValue(status({ state: "pending", reviewerName: "Sara" }));
    await act(async () => {
      composer.emit(EVENTS.REVIEW_SENT, { invitedEmail: "sara@example.test" });
    });
    await settle();
    expect(result.current.nextMove?.kind).toBe("publish");
    expect(result.current.nextMove?.gate).toBe("waiting");
  });

  it("re-reads when the server refuses a publish this derivation had allowed", async () => {
    const { rerender } = renderHook((p: UseLifecycleInput) => useLifecycle(p), { initialProps: input() });
    await settle();
    expect(fetchReviewStatusOrNull).not.toHaveBeenCalled();
    rerender(input({ serverBlock: "review-pending" }));
    await settle();
    expect(fetchReviewStatusOrNull).toHaveBeenCalledTimes(1);
  });

  it("keeps the last-known status when the focus refetch fails", async () => {
    fetchReviewStatus.mockResolvedValue(status({ state: "approved", reviewerName: "Sara" }));
    const { result } = renderHook((p: UseLifecycleInput) => useLifecycle(p), { initialProps: input() });
    await settle();
    fetchReviewStatusOrNull.mockResolvedValue(null);
    await act(async () => {
      window.dispatchEvent(new Event("focus"));
    });
    await settle();
    expect(result.current.reviewStatus.state).toBe("approved");
  });
});

describe("useLifecycle — the chip's count (C2, board B3-01)", () => {
  it("reads the round's open count beside the status, and re-reads on comments:refresh", async () => {
    const composer = makeComposer();
    fetchCurrentRound.mockResolvedValue({ revoked: false, openCommentCount: 2 });
    const { result } = renderHook((p: UseLifecycleInput) => useLifecycle(p), {
      initialProps: input({ composer: composer as never }),
    });
    await settle();
    expect(result.current.openCommentCount).toBe(2);
    fetchCurrentRound.mockResolvedValue({ revoked: false, openCommentCount: 1 });
    await act(async () => {
      composer.emit("comments:refresh", {});
    });
    await settle();
    expect(result.current.openCommentCount).toBe(1);
  });

  it("no round, a revoked one, or a failed read → null, never a zero", async () => {
    fetchCurrentRound.mockRejectedValue(new Error("offline"));
    const { result, rerender } = renderHook((p: UseLifecycleInput) => useLifecycle(p), { initialProps: input() });
    await settle();
    expect(result.current.openCommentCount).toBeNull();
    fetchCurrentRound.mockResolvedValue({ revoked: true, openCommentCount: 4 });
    rerender(input({ serverBlock: "review-pending" }));
    await settle();
    expect(result.current.openCommentCount).toBeNull();
  });
});

describe("useLifecycle — the review closing is an event, not furniture", () => {
  /* Board 158:213 announces it: "Review closed — Sara approved v3". The product
     had no such moment — the pill changed and the review bar vanished, both
     silently, and the one thing a designer waits on arrived as the room quietly
     rearranging itself. */
  it("says so when a live round comes back approved", async () => {
    const addToast = vi.fn((_input: unknown) => "id");
    fetchReviewStatus.mockResolvedValueOnce(status({ state: "pending", reviewerName: "Sana" }));
    renderHook((p: UseLifecycleInput) => useLifecycle(p), { initialProps: input({ addToast }) });
    await settle();
    expect(addToast).not.toHaveBeenCalled();

    /* The transition happens inside ONE mount — the focus refetch is how an
       approval that landed while the editor was backgrounded arrives. */
    fetchReviewStatusOrNull.mockResolvedValueOnce(status({ state: "approved", reviewerName: "Sana" }));
    await act(async () => {
      window.dispatchEvent(new Event("focus"));
    });
    await settle();
    const said = addToast.mock.calls.map((c) => JSON.stringify(c[0])).join(" ");
    expect(said).toMatch(/Review closed/);
    expect(said).toMatch(/Sana/);
  });

  it("opening an already-approved site congratulates nobody", async () => {
    const addToast = vi.fn(() => "id");
    fetchReviewStatus.mockResolvedValueOnce(status({ state: "approved", reviewerName: "Sana" }));
    renderHook((p: UseLifecycleInput) => useLifecycle(p), { initialProps: input({ addToast }) });
    await settle();
    expect(addToast).not.toHaveBeenCalled();
  });
});

describe("useLifecycle — one derivation", () => {
  it("returns the same nextMove object while its inputs hold — one memo for every surface", async () => {
    fetchReviewStatus.mockResolvedValue(status({ state: "approved" }));
    const { result, rerender } = renderHook((p: UseLifecycleInput) => useLifecycle(p), { initialProps: input() });
    await settle();
    const first = result.current.nextMove;
    rerender(input());
    expect(result.current.nextMove).toBe(first);
    rerender(input({ errorCount: 1 }));
    expect(result.current.nextMove).not.toBe(first);
    expect(result.current.nextMove?.gate).toBe("open-errors");
  });

  it("gateAfterErrors is the door behind the errors confirm — stale when the approval is stale", async () => {
    fetchReviewStatus.mockResolvedValue(status({ state: "approved-edited-since" }));
    const { result } = renderHook((p: UseLifecycleInput) => useLifecycle(p), {
      initialProps: input({ errorCount: 2 }),
    });
    await settle();
    expect(result.current.nextMove?.gate).toBe("open-errors");
    expect(result.current.gateAfterErrors).toBe("stale-approval");
  });

  it("gateAfterErrors is the plain confirm on an approved site, and none when there are no errors", async () => {
    fetchReviewStatus.mockResolvedValue(status({ state: "approved" }));
    const { result, rerender } = renderHook((p: UseLifecycleInput) => useLifecycle(p), {
      initialProps: input({ errorCount: 2 }),
    });
    await settle();
    expect(result.current.gateAfterErrors).toBe("confirm");
    rerender(input({ errorCount: 0 }));
    expect(result.current.nextMove?.gate).toBe("confirm");
    expect(result.current.gateAfterErrors).toBe("none");
  });

  it("unsaved work counts as waiting to ship — the session's clock beats the server's snapshot", async () => {
    fetchReviewStatus.mockResolvedValue(status({ reviewsEnabled: false, editsRequireApproval: false }));
    const { result, rerender } = renderHook((p: UseLifecycleInput) => useLifecycle(p), {
      initialProps: input({ publishedUrl: "https://x.test", serverHasUnpublishedChanges: false }),
    });
    await settle();
    expect(result.current.nextMove).toBeNull();
    rerender(input({ publishedUrl: "https://x.test", serverHasUnpublishedChanges: false, isDirty: true }));
    expect(result.current.nextMove?.label).toBe("Publish changes");
  });
});
