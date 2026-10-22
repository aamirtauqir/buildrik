/**
 * servesCleanUrls — whether the site's LIVE deploy carries vercel.json
 * `cleanUrls: true` (BD-39 (4)). Read from the bundle the last completed
 * publish shipped, so a site published before REA #26 — or rolled back to a
 * bundle from then — keeps handing out `.html` links until it is republished.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const jobFindFirstMock = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: { publishBuildJob: { findFirst: (...a: unknown[]) => jobFindFirstMock(...a) } },
}));

import { servesCleanUrls } from "@server/services/publish.service";

const bundleWith = (vercelJson: object | null) => ({
  files: [
    { file: "index.html", data: "<html></html>" },
    ...(vercelJson ? [{ file: "vercel.json", data: JSON.stringify(vercelJson) }] : []),
  ],
});

beforeEach(() => jobFindFirstMock.mockReset());

describe("servesCleanUrls", () => {
  it("is true when the last completed publish shipped cleanUrls", async () => {
    jobFindFirstMock.mockResolvedValue({ bundle: bundleWith({ cleanUrls: true, redirects: [] }) });
    await expect(servesCleanUrls("s1")).resolves.toBe(true);
    expect(jobFindFirstMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { siteId: "s1", status: "COMPLETED" },
        orderBy: { completedAt: "desc" },
      }),
    );
  });

  it("is false when the live deploy's vercel.json predates cleanUrls", async () => {
    jobFindFirstMock.mockResolvedValue({ bundle: bundleWith({ redirects: [] }) });
    await expect(servesCleanUrls("s1")).resolves.toBe(false);
  });

  it("is false when the bundle has no vercel.json, or no bundle was kept", async () => {
    jobFindFirstMock.mockResolvedValueOnce({ bundle: bundleWith(null) });
    await expect(servesCleanUrls("s1")).resolves.toBe(false);
    jobFindFirstMock.mockResolvedValueOnce({ bundle: null });
    await expect(servesCleanUrls("s1")).resolves.toBe(false);
  });

  it("is false for a never-published site", async () => {
    jobFindFirstMock.mockResolvedValue(null);
    await expect(servesCleanUrls("s1")).resolves.toBe(false);
  });

});
