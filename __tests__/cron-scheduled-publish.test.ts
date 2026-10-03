/**
 * C-2 — route test for the scheduled-publish cron: 401 without the bearer,
 * the due-schedule selection, and that a per-schedule failure is recorded
 * (not thrown) so one bad schedule can't strand the sweep.
 *
 * A-16 / PD-18 note: schedulePublish itself now unconditionally refuses
 * with NO_RENDERER, so in production `dueSchedules` will find nothing (no
 * schedule can be created any more) — this route's own logic (dispatch a
 * due row to startPublish, record success/failure) is unchanged and still
 * exercised here against rows a test seeds directly.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { type NextRequest } from "next/server";

const startPublishMock = vi.fn();
const dueSchedulesMock = vi.fn();
const markScheduleStartedMock = vi.fn();
const markScheduleFailedMock = vi.fn();
const markScheduleCancelledMock = vi.fn();

vi.mock("@server/services/publish.service", () => ({
  startPublish: (...a: unknown[]) => startPublishMock(...a),
}));
vi.mock("@server/services/scheduled-publish.service", () => ({
  dueSchedules: (...a: unknown[]) => dueSchedulesMock(...a),
  markScheduleStarted: (...a: unknown[]) => markScheduleStartedMock(...a),
  markScheduleFailed: (...a: unknown[]) => markScheduleFailedMock(...a),
  markScheduleCancelled: (...a: unknown[]) => markScheduleCancelledMock(...a),
}));

import { GET } from "@/app/api/cron/scheduled-publish/route";

function makeReq(authHeader?: string): NextRequest {
  return new Request("http://localhost/api/cron/scheduled-publish", {
    headers: authHeader ? { authorization: authHeader } : {},
  }) as NextRequest;
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.CRON_SECRET = "test-secret";
});

describe("scheduled-publish cron", () => {
  it("returns 401 without the bearer", async () => {
    const res = await GET(makeReq());
    expect(res.status).toBe(401);
  });

  it("returns 401 with the wrong bearer", async () => {
    const res = await GET(makeReq("Bearer wrong"));
    expect(res.status).toBe(401);
  });

  it("no due schedules → { due: 0, started: 0, failed: 0, skipped: 0 }, never calls startPublish", async () => {
    dueSchedulesMock.mockResolvedValueOnce([]);
    const res = await GET(makeReq("Bearer test-secret"));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ due: 0, started: 0, failed: 0, skipped: 0 });
    expect(startPublishMock).not.toHaveBeenCalled();
  });

  it("starts a due schedule and records it, with no pages argument", async () => {
    dueSchedulesMock.mockResolvedValueOnce([{ id: "sp1", siteId: "s1", workspaceId: "ws1", createdBy: "u1" }]);
    startPublishMock.mockResolvedValueOnce({ id: "job1" });
    const res = await GET(makeReq("Bearer test-secret"));
    await expect(res.json()).resolves.toEqual({ due: 1, started: 1, failed: 0, skipped: 0 });
    expect(startPublishMock).toHaveBeenCalledWith("s1", "ws1", "u1");
    expect(markScheduleStartedMock).toHaveBeenCalledWith("sp1", "job1");
  });

  it("one failing schedule doesn't strand the rest of the sweep", async () => {
    dueSchedulesMock.mockResolvedValueOnce([
      { id: "sp1", siteId: "s1", workspaceId: "ws1", createdBy: "u1" },
      { id: "sp2", siteId: "s2", workspaceId: "ws1", createdBy: "u1" },
    ]);
    startPublishMock
      .mockRejectedValueOnce(new Error("NO_RENDERER"))
      .mockResolvedValueOnce({ id: "job2" });
    const res = await GET(makeReq("Bearer test-secret"));
    await expect(res.json()).resolves.toEqual({ due: 2, started: 1, failed: 1, skipped: 0 });
    expect(markScheduleFailedMock).toHaveBeenCalledWith("sp1", "NO_RENDERER");
    expect(markScheduleStartedMock).toHaveBeenCalledWith("sp2", "job2");
  });

  /* SA-04 (D6): a schedule in a workspace scheduled for deletion is skipped
     and closed as CANCELLED — it is not a publish failure. */
  it("skips a schedule whose workspace is scheduled for deletion, recording it CANCELLED", async () => {
    dueSchedulesMock.mockResolvedValueOnce([{ id: "sp1", siteId: "s1", workspaceId: "ws1", createdBy: "u1" }]);
    startPublishMock.mockRejectedValueOnce(new Error("WORKSPACE_DELETION_SCHEDULED"));
    const res = await GET(makeReq("Bearer test-secret"));
    await expect(res.json()).resolves.toEqual({ due: 1, started: 0, failed: 0, skipped: 1 });
    expect(markScheduleCancelledMock).toHaveBeenCalledWith("sp1", "WORKSPACE_DELETION_SCHEDULED");
    expect(markScheduleFailedMock).not.toHaveBeenCalled();
  });
});
