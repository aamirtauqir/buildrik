/**
 * C1 residual — `assertProjectNameFree`: before an unpinned site deploys, the
 * project its slug derives must not be pinned by another site, or the deploy
 * lands on that site's live project.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: { site: { findFirst: vi.fn() } } }));

import { prisma } from "@/lib/prisma";
import { assertProjectNameFree } from "@/server/services/publish.service";

beforeEach(() => vi.clearAllMocks());

describe("assertProjectNameFree", () => {
  it("throws the clash message when another site is pinned to the name", async () => {
    vi.mocked(prisma.site.findFirst).mockResolvedValue({ id: "other" } as never);
    await expect(assertProjectNameFree("s1", "buildrik-site-old")).rejects.toThrow(
      "This site's address clashes with another site. Change its URL slug in Settings and publish again.",
    );
    expect(prisma.site.findFirst).toHaveBeenCalledWith({
      where: { vercelProjectName: "buildrik-site-old", id: { not: "s1" } },
      select: { id: true },
    });
  });

  it("passes when no other site holds the name", async () => {
    vi.mocked(prisma.site.findFirst).mockResolvedValue(null);
    await expect(assertProjectNameFree("s1", "buildrik-site-old")).resolves.toBeUndefined();
  });
});
