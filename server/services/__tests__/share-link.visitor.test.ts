/**
 * /share/<token> visitor side: token states, the signed unlock cookie, and
 * what draft data leaves the server.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    shareLink: { findUnique: vi.fn(), update: vi.fn() },
    site: { findUnique: vi.fn() },
    mediaAsset: { findMany: vi.fn().mockResolvedValue([]) },
  },
}));

import { prisma } from "@/lib/prisma";
import {
  getShareDraftRows,
  resolveShareLink,
  shareUnlockProof,
} from "@/server/services/share-link.service";

const link = (over: Record<string, unknown> = {}) => ({
  id: "l1",
  isActive: true,
  expiresAt: null,
  passwordHash: null,
  site: { id: "s1", name: "Bella", deletedAt: null },
  ...over,
});

describe("resolveShareLink", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXTAUTH_SECRET = "test-secret";
  });

  it("open link → open with the site", async () => {
    vi.mocked(prisma.shareLink.findUnique).mockResolvedValue(link() as never);
    await expect(resolveShareLink("t", undefined)).resolves.toEqual({
      state: "open",
      linkId: "l1",
      siteId: "s1",
      siteName: "Bella",
    });
  });

  it.each([
    ["missing", null, "unknown"],
    ["revoked", link({ isActive: false }), "revoked"],
    ["expired", link({ expiresAt: new Date(Date.now() - 1000) }), "expired"],
    ["deleted site", link({ site: { id: "s1", name: "Bella", deletedAt: new Date() } }), "revoked"],
    ["expired AND password", link({ expiresAt: new Date(Date.now() - 1000), passwordHash: "$2a$h" }), "expired"],
  ])("%s → unavailable (%s)", async (_label, row, reason) => {
    vi.mocked(prisma.shareLink.findUnique).mockResolvedValue(row as never);
    await expect(resolveShareLink("t", undefined)).resolves.toEqual({ state: "unavailable", reason });
  });

  it("an unexpired link with a future expiry is still open", async () => {
    vi.mocked(prisma.shareLink.findUnique).mockResolvedValue(
      link({ expiresAt: new Date(Date.now() + 60_000) }) as never,
    );
    await expect(resolveShareLink("t", undefined)).resolves.toMatchObject({ state: "open" });
  });

  it("password link: locked without proof, locked with the old forgeable '1', open with the signed proof", async () => {
    vi.mocked(prisma.shareLink.findUnique).mockResolvedValue(link({ passwordHash: "$2a$hash" }) as never);
    await expect(resolveShareLink("t", undefined)).resolves.toEqual({ state: "locked" });
    await expect(resolveShareLink("t", "1")).resolves.toEqual({ state: "locked" });
    await expect(resolveShareLink("t", shareUnlockProof("other-token"))).resolves.toEqual({ state: "locked" });
    await expect(resolveShareLink("t", shareUnlockProof("t"))).resolves.toMatchObject({ state: "open" });
  });
});

describe("getShareDraftRows", () => {
  it("drops hidden pages and never selects publishedPassword", async () => {
    vi.mocked(prisma.site.findUnique).mockResolvedValue({
      name: "Bella",
      publishedUrl: null,
      projectStyles: [],
      projectSettings: {},
      dsSchemaVersion: 2,
      favicon: null,
      metaTitle: "Bella",
      sitePages: [
        { id: "p1", name: "Home", settings: null },
        { id: "p2", name: "Menu", settings: { visibility: "live" } },
        { id: "p3", name: "Secret", settings: { visibility: "hidden" } },
        { id: "p4", name: "Old pw page", settings: { visibility: "password" } },
      ],
    } as never);

    const rows = await getShareDraftRows("s1");

    expect(rows.pages.map((p) => p.id)).toEqual(["p1", "p2"]);
    expect(rows.siteColumns).toMatchObject({ name: "Bella", metaTitle: "Bella" });
    const select = vi.mocked(prisma.site.findUnique).mock.calls[0][0].select as Record<string, unknown>;
    expect(select.publishedPassword).toBeUndefined();
  });

  it("carries the site's ADDED fonts, and only those", async () => {
    vi.mocked(prisma.site.findUnique).mockResolvedValue({ name: "Bella", sitePages: [] } as never);
    vi.mocked(prisma.mediaAsset.findMany).mockResolvedValue([
      { filename: "Inter-Var.woff2", url: "https://x.public.blob.vercel-storage.com/Inter-Var.woff2" },
    ] as never);
    const rows = await getShareDraftRows("s1");
    expect(rows.siteFonts).toEqual([
      { filename: "Inter-Var.woff2", url: "https://x.public.blob.vercel-storage.com/Inter-Var.woff2" },
    ]);
    const where = vi.mocked(prisma.mediaAsset.findMany).mock.calls.at(-1)![0]!.where;
    expect(where).toEqual({ siteId: "s1", type: "font", userMetadata: { path: ["siteFont"], equals: true } });
  });
});
