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

vi.mock("@lib/prisma", () => ({
  prisma: {
    scheduledPublish: {
      create: (...a: unknown[]) => create(...a),
      findFirst: (...a: unknown[]) => findFirst(...a),
      update: (...a: unknown[]) => update(...a),
      findMany: (...a: unknown[]) => findMany(...a),
    },
  },
}));

const {
  schedulePublish,
  cancelScheduledPublish,
  dueSchedules,
  ScheduledPublishError,
} = await import("../scheduled-publish.service");

const base = { siteId: "s1", workspaceId: "w1", userId: "u1" };
const inMinutes = (n: number) => new Date(Date.now() + n * 60_000);

beforeEach(() => {
  create.mockReset();
  findFirst.mockReset();
  update.mockReset();
  findMany.mockReset();
});

describe("schedulePublish — the time has to be a real one", () => {
  it("accepts a time comfortably in the future", async () => {
    create.mockResolvedValue({ id: "sp1" });
    await expect(schedulePublish({ ...base, scheduledFor: inMinutes(60) })).resolves.toEqual({ id: "sp1" });
  });

  // "In a minute" is not scheduling, it is publishing with extra steps — and a
  // schedule inside the sweep's own interval would fire immediately anyway.
  it("refuses a time inside the next minute", async () => {
    await expect(schedulePublish({ ...base, scheduledFor: inMinutes(0.2) }))
      .rejects.toThrow(/at least a minute/);
    expect(create).not.toHaveBeenCalled();
  });

  it("refuses a time beyond a year, which is a typo not a plan", async () => {
    await expect(schedulePublish({ ...base, scheduledFor: inMinutes(60 * 24 * 400) }))
      .rejects.toThrow(/within the next year/);
  });

  it("refuses an unparseable date rather than writing NaN", async () => {
    await expect(schedulePublish({ ...base, scheduledFor: new Date("nonsense") }))
      .rejects.toThrow(/not a valid date/);
    expect(create).not.toHaveBeenCalled();
  });

  /* The partial unique index is the real guard — two concurrent requests can
     both pass a findFirst check, and only the database can refuse the second.
     The service's job is to turn P2002 into a sentence, not to pre-empt it. */
  it("turns the database's uniqueness refusal into something a person can act on", async () => {
    create.mockRejectedValue(Object.assign(new Error("Unique constraint"), { code: "P2002" }));
    await expect(schedulePublish({ ...base, scheduledFor: inMinutes(60) }))
      .rejects.toThrow(/already has a publish scheduled/);
  });

  it("does not swallow an unrelated database error", async () => {
    create.mockRejectedValue(Object.assign(new Error("connection lost"), { code: "P1001" }));
    await expect(schedulePublish({ ...base, scheduledFor: inMinutes(60) })).rejects.toThrow(/connection lost/);
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
    await schedulePublish({ ...base, scheduledFor: inMinutes(0.1) }).catch((e) => {
      expect(e).toBeInstanceOf(ScheduledPublishError);
      expect(e.code).toBe("TOO_SOON");
    });
  });
});
