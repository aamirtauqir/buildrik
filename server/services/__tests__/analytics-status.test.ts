/**
 * getAnalyticsStatus — Settings → Analytics "Last received data" (Clone
 * 3397:32295) and the Connection-verified dialog's "<n> events arrived in the
 * last 24 hours" (4256:26844).
 *
 * The numbers are OUR beacon's `AnalyticsEvent` rows: the newest row's time,
 * and a count over a rolling 24-hour window. The output is run through the
 * shared contract — the editor reads exactly that shape, with the date as an
 * ISO string.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { analyticsStatusSchema } from "@buildrik/shared/schemas/site-detail";

const { db } = vi.hoisted(() => ({
  db: { analyticsEvent: { findFirst: vi.fn(), count: vi.fn() } },
}));

vi.mock("@/lib/prisma", () => ({ prisma: db }));

import { getAnalyticsStatus } from "@server/services/analytics.service";

beforeEach(() => {
  db.analyticsEvent.findFirst.mockReset();
  db.analyticsEvent.count.mockReset();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-09-14T12:00:00.000Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("getAnalyticsStatus", () => {
  it("reports the newest event as an ISO string and the count inside the last 24 hours", async () => {
    db.analyticsEvent.findFirst.mockResolvedValue({ createdAt: new Date("2026-09-14T11:38:00.000Z") });
    db.analyticsEvent.count.mockResolvedValue(1284);

    const status = await getAnalyticsStatus("s1");

    expect(analyticsStatusSchema.parse(status)).toEqual({ lastEventAt: "2026-09-14T11:38:00.000Z", events24h: 1284 });
    expect(db.analyticsEvent.findFirst).toHaveBeenCalledWith({
      where: { siteId: "s1" },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });
    expect(db.analyticsEvent.count).toHaveBeenCalledWith({
      where: { siteId: "s1", createdAt: { gte: new Date("2026-09-13T12:00:00.000Z") } },
    });
  });

  it("is null / 0 for a site that has never received an event", async () => {
    db.analyticsEvent.findFirst.mockResolvedValue(null);
    db.analyticsEvent.count.mockResolvedValue(0);

    await expect(getAnalyticsStatus("s1")).resolves.toEqual({ lastEventAt: null, events24h: 0 });
  });

  it("keeps the last event when every event is older than the window", async () => {
    db.analyticsEvent.findFirst.mockResolvedValue({ createdAt: new Date("2026-07-02T19:38:00.000Z") });
    db.analyticsEvent.count.mockResolvedValue(0);

    await expect(getAnalyticsStatus("s1")).resolves.toEqual({ lastEventAt: "2026-07-02T19:38:00.000Z", events24h: 0 });
  });
});
