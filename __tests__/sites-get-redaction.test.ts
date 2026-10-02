import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    site: { findFirst: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import { getSite } from "@/server/services/sites.service";

describe("getSite redaction (SA-02)", () => {
  beforeEach(() => vi.clearAllMocks());
  it("never returns publishedPassword, exposes hasPublishedPassword", async () => {
    vi.mocked(prisma.site.findFirst).mockResolvedValue({
      id: "s1", name: "A", publishedPassword: "v1:ciphertext", folder: null, sourceTemplate: null,
    } as never);
    const site = await getSite("s1");
    expect(site).not.toBeNull();
    expect(site).not.toHaveProperty("publishedPassword");
    expect(site?.hasPublishedPassword).toBe(true);
  });
  it("returns null for a missing site", async () => {
    vi.mocked(prisma.site.findFirst).mockResolvedValue(null);
    expect(await getSite("nope")).toBeNull();
  });
});
