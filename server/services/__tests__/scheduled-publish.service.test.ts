/**
 * Scheduled publish — the guards, and why each exists.
 *
 * E2 (docs/design-jobs/BLOCKERS.md): four boards drew this feature and nothing
 * in `server/`, `prisma/` or the editor produced it. Built 2026-09-08, so these
 * are the first tests it has ever had.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const create = vi.fn();
const findFirst = vi.fn();
const update = vi.fn();
const findMany = vi.fn();
const siteFindUnique = vi.fn();

vi.mock("@lib/prisma", () => ({
  prisma: {
    scheduledPublish: {
      create: (...a: unknown[]) => create(...a),
      findFirst: (...a: unknown[]) => findFirst(...a),
      update: (...a: unknown[]) => update(...a),
      findMany: (...a: unknown[]) => findMany(...a),
    },
    site: { findUnique: (...a: unknown[]) => siteFindUnique(...a) },
  },
}));

const {
  schedulePublish,
  cancelScheduledPublish,
  dueSchedules,
  markScheduleCancelled,
  ScheduledPublishError,
} = await import("../scheduled-publish.service");

const base = { siteId: "s1", workspaceId: "w1", userId: "u1" };
const inMinutes = (n: number) => new Date(Date.now() + n * 60_000);

beforeEach(() => {
  create.mockReset();
  findFirst.mockReset();
  update.mockReset();
  findMany.mockReset();
  siteFindUnique.mockReset().mockResolvedValue({ workspace: { deletionScheduledAt: null } });
});

/**
 * A-16 / PD-18: dueSchedules → startPublish → the worker refuses any job
 * with no page-HTML payload, and nothing captures one at schedule time — a
 * schedule created today is guaranteed to fail later, silently (no UI
 * caller exists to warn anyone). schedulePublish now refuses unconditionally
 * until a server-side renderer exists, rather than letting a promise get
 * made that cannot be kept. The prior lead-time-bounds / ALREADY_SCHEDULED
 * behavior this replaced is in git history.
 */
describe("schedulePublish — refuses until a renderer exists (A-16 / PD-18)", () => {
  it("always throws NO_RENDERER and never creates a row", async () => {
    await expect(schedulePublish({ ...base, scheduledFor: inMinutes(60) })).rejects.toMatchObject({
      code: "NO_RENDERER",
    });
    expect(create).not.toHaveBeenCalled();
  });
});

describe("schedulePublish — workspace scheduled for deletion (SA-04 / D6)", () => {
  it("refuses with WORKSPACE_DELETION_SCHEDULED before anything else", async () => {
    siteFindUnique.mockResolvedValue({ workspace: { deletionScheduledAt: new Date("2026-10-27") } });
    await expect(schedulePublish({ ...base, scheduledFor: inMinutes(60) })).rejects.toThrow("WORKSPACE_DELETION_SCHEDULED");
    expect(siteFindUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "s1" } }));
    expect(create).not.toHaveBeenCalled();
  });
});

describe("markScheduleCancelled", () => {
  it("records CANCELLED with the reason, never deleting the row", async () => {
    update.mockResolvedValue({});
    await markScheduleCancelled("sp1", "WORKSPACE_DELETION_SCHEDULED");
    expect(update).toHaveBeenCalledWith({
      where: { id: "sp1" },
      data: { status: "CANCELLED", error: "WORKSPACE_DELETION_SCHEDULED" },
    });
  });
});

describe("cancelScheduledPublish", () => {
  // Cancelling RECORDS the cancellation. Deleting the row would erase the fact
  // that a publish was ever scheduled, which is the thing someone asks about.
  it("marks the row CANCELLED rather than deleting it", async () => {
    findFirst.mockResolvedValue({ id: "sp1" });
    update.mockResolvedValue({ id: "sp1", status: "CANCELLED" });
    await cancelScheduledPublish("s1");
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ data: { status: "CANCELLED" } }));
  });

  it("says so when there is nothing scheduled", async () => {
    findFirst.mockResolvedValue(null);
    await expect(cancelScheduledPublish("s1")).rejects.toThrow(/no scheduled publish/);
  });
});

describe("dueSchedules", () => {
  /* `lte: now`, never a window. A sweep that missed its slot — a deploy, an
     outage — must still fire late rather than skip the schedule entirely.
     Late is a delay; skipped is a promise broken silently. */
  it("claims everything already due, not just this interval", async () => {
    findMany.mockResolvedValue([]);
    const now = new Date("2026-09-09T10:00:00Z");
    await dueSchedules(now);
    const where = findMany.mock.calls[0][0].where;
    expect(where).toEqual({ status: "PENDING", scheduledFor: { lte: now } });
  });

  it("takes the earliest first, so a backlog drains in order", async () => {
    findMany.mockResolvedValue([]);
    await dueSchedules(new Date());
    expect(findMany.mock.calls[0][0].orderBy).toEqual({ scheduledFor: "asc" });
  });
});

describe("ScheduledPublishError", () => {
  it("carries a machine-readable code beside the sentence", async () => {
    await schedulePublish({ ...base, scheduledFor: inMinutes(60) }).catch((e) => {
      expect(e).toBeInstanceOf(ScheduledPublishError);
      expect(e.code).toBe("NO_RENDERER");
    });
  });
});
