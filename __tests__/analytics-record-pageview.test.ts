import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    site: { findUnique: vi.fn() },
    analyticsEvent: { create: vi.fn() },
  },
}));

vi.mock("@/lib/constants/plan-limits", () => ({ PLAN_LIMITS: {} }));

import { prisma } from "@/lib/prisma";
import { recordPageView } from "@server/services/analytics.service";

const mockPrisma = prisma as typeof prisma & {
  site: { findUnique: ReturnType<typeof vi.fn> };
  analyticsEvent: { create: ReturnType<typeof vi.fn> };
};

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.analyticsEvent.create.mockResolvedValue({ id: "e1" });
});

describe("recordPageView (analytics write path)", () => {
  it("creates an event for an existing site", async () => {
    mockPrisma.site.findUnique.mockResolvedValue({ id: "site-1" });
    const ok = await recordPageView("site-1", { path: "/about", viewportWidth: 1280 });
    expect(ok).toBe(true);
    expect(mockPrisma.analyticsEvent.create).toHaveBeenCalledTimes(1);
    const arg = mockPrisma.analyticsEvent.create.mock.calls[0][0].data;
    expect(arg.siteId).toBe("site-1");
    expect(arg.path).toBe("/about");
    expect(arg.viewportWidth).toBe(1280);
  });

  it("no-ops (no row) for an unknown site", async () => {
    mockPrisma.site.findUnique.mockResolvedValue(null);
    const ok = await recordPageView("ghost", { path: "/" });
    expect(ok).toBe(false);
    expect(mockPrisma.analyticsEvent.create).not.toHaveBeenCalled();
  });

  it("caps long free-text fields and sanitizes viewport", async () => {
    mockPrisma.site.findUnique.mockResolvedValue({ id: "s" });
    await recordPageView("s", {
      path: "/" + "x".repeat(5000),
      referrer: "y".repeat(5000),
      sessionId: "z".repeat(500),
      viewportWidth: -5,
    });
    const arg = mockPrisma.analyticsEvent.create.mock.calls[0][0].data;
    expect(arg.path.length).toBeLessThanOrEqual(1024);
    expect(arg.referrer.length).toBeLessThanOrEqual(1024);
    expect(arg.sessionId.length).toBeLessThanOrEqual(128);
    expect(arg.viewportWidth).toBeNull();
  });

  it("falls back to '/' when path is empty", async () => {
    mockPrisma.site.findUnique.mockResolvedValue({ id: "s" });
    await recordPageView("s", { path: "" });
    expect(mockPrisma.analyticsEvent.create.mock.calls[0][0].data.path).toBe("/");
  });
});
