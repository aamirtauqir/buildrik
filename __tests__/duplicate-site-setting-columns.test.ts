/**
 * SA-01 follow-up (final-fix-report.md I2: "a duplicated site does not
 * inherit canonicalUrl") — `duplicatedSettingColumns` in sites.service.ts
 * copies the source site's column-backed settings onto a duplicate, except
 * the site's own identity (name, slug), its password, and canonicalUrl (the
 * source's own address, which would mislabel the copy as a duplicate of
 * itself). NULL columns are left out entirely. None of this had a unit test:
 * the existing `duplicateSite` describe block in sites-service.test.ts only
 * asserts page/form/style copying, never a setting column.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => {
  const tx: any = {
    site: { create: vi.fn(), update: vi.fn() },
    page: { createMany: vi.fn().mockResolvedValue({ count: 0 }) },
    formBlock: { createMany: vi.fn().mockResolvedValue({ count: 0 }) },
  };
  const prismaMock: any = {
    site: { findUnique: vi.fn(), findFirst: vi.fn(), findMany: vi.fn() },
    page: { findMany: vi.fn() },
    formBlock: { findMany: vi.fn() },
    workspaceMember: { findFirst: vi.fn() },
    $transaction: vi.fn((fn: any) => fn(tx)),
  };
  return { prisma: prismaMock, __tx: tx };
});

vi.mock("@/server/services/site-quota", () => ({ assertSiteQuota: vi.fn() }));

import { prisma } from "@/lib/prisma";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { __tx } from "@/lib/prisma";
import { duplicateSite } from "@/server/services/sites.service";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const tx = (__tx as any).site;

function baseOriginal(overrides: Record<string, unknown> = {}) {
  return {
    id: "s1",
    name: "Bella Cucina",
    slug: "bella-cucina",
    deletedAt: null,
    projectStyles: null,
    projectAssets: null,
    projectSettings: null,
    projectCmsBindings: null,
    metaTitle: "Bella Cucina — Home",
    metaDescription: "Great food",
    metaTitleTemplate: null,
    ogImage: "https://x/og.png",
    canonicalUrl: "https://bellacucina.com",
    allowIndexing: false,
    robotsTxt: null,
    headCode: "<script>1</script>",
    bodyCode: null,
    socialLinks: { twitter: "https://x.com/a" },
    publishedPassword: "v1:ciphertext",
    touchIcon: null,
    favicon: "https://x/fav.ico",
    cspPolicy: null,
    hstsMaxAge: null,
    xFrameOptions: null,
    referrerPolicy: null,
    permissionsPolicy: null,
    defaultLocale: "en",
    enabledLocales: ["en"],
    localeAutoRedirect: false,
    ...overrides,
  };
}

describe("duplicateSite — setting-column inheritance (SA-01 I2)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.workspaceMember.findFirst).mockResolvedValue({ workspace: { plan: "PRO" } } as never);
    vi.mocked(prisma.site.findFirst).mockResolvedValue(null); // slug is free
    vi.mocked(prisma.site.findMany).mockResolvedValue([]);
    vi.mocked(prisma.page.findMany).mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    vi.mocked(prisma.formBlock.findMany).mockResolvedValue([]);
    tx.create.mockResolvedValue({ id: "s2", name: "Bella Cucina (Copy)", publishedPassword: null });
  });

  it("copies non-excluded, non-null setting columns onto the duplicate", async () => {
    vi.mocked(prisma.site.findUnique).mockResolvedValue(baseOriginal() as never);

    await duplicateSite("s1", "ws1", "u1");

    const createData = tx.create.mock.calls[0][0].data;
    expect(createData.metaTitle).toBe("Bella Cucina — Home");
    expect(createData.metaDescription).toBe("Great food");
    expect(createData.ogImage).toBe("https://x/og.png");
    expect(createData.allowIndexing).toBe(false);
    expect(createData.headCode).toBe("<script>1</script>");
    expect(createData.socialLinks).toEqual({ twitter: "https://x.com/a" });
    expect(createData.favicon).toBe("https://x/fav.ico");
    expect(createData.defaultLocale).toBe("en");
    expect(createData.enabledLocales).toEqual(["en"]);
  });

  it("never copies name, slug, publishedPassword or canonicalUrl from the source", async () => {
    vi.mocked(prisma.site.findUnique).mockResolvedValue(baseOriginal() as never);

    await duplicateSite("s1", "ws1", "u1");

    const createData = tx.create.mock.calls[0][0].data;
    expect(createData.name).toBe("Bella Cucina (Copy)");
    expect(createData.slug).not.toBe("bella-cucina");
    expect(createData).not.toHaveProperty("publishedPassword");
    expect(createData).not.toHaveProperty("canonicalUrl");
  });

  it("omits a NULL source column instead of writing an explicit null", async () => {
    vi.mocked(prisma.site.findUnique).mockResolvedValue(
      baseOriginal({ metaTitle: null, robotsTxt: null, socialLinks: null }) as never
    );

    await duplicateSite("s1", "ws1", "u1");

    const createData = tx.create.mock.calls[0][0].data;
    expect(createData).not.toHaveProperty("metaTitle");
    expect(createData).not.toHaveProperty("robotsTxt");
    expect(createData).not.toHaveProperty("socialLinks");
  });

  it("the returned duplicate is redacted (never carries the copied publishedPassword back to the client)", async () => {
    vi.mocked(prisma.site.findUnique).mockResolvedValue(baseOriginal() as never);

    const result = await duplicateSite("s1", "ws1", "u1");

    expect(result).not.toHaveProperty("publishedPassword");
  });
});
