/**
 * A-21: a trashed page is a row with `deletedAt` set. Every read of a site's
 * live pages filters it out — the editor's load, the pages API, folders and
 * the share preview here; the rest of the list is in the A-21 commit body.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/server/services/permission.service", () => ({ checkSiteRole: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    page: { findMany: vi.fn(async () => []), findFirst: vi.fn(async () => null) },
    pageFolder: { findMany: vi.fn(async () => []) },
    site: { findUnique: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import { listPages, getPage } from "@/server/services/page.service";
import { listPageFolders } from "@/server/services/page-folder.service";
import { getProjectData } from "@/server/services/sites.service";

beforeEach(() => vi.clearAllMocks());

describe("live-page reads skip the trash", () => {
  it("pages.list", async () => {
    await listPages("s_1");
    expect(vi.mocked(prisma.page.findMany).mock.calls[0][0]!.where).toEqual({ siteId: "s_1", deletedAt: null });
  });

  it("pages.get", async () => {
    await getPage("p_1");
    expect(vi.mocked(prisma.page.findFirst).mock.calls[0][0]!.where).toEqual({ id: "p_1", deletedAt: null });
  });

  it("folders drop trashed pages", async () => {
    await listPageFolders("u_1", "s_1");
    expect(vi.mocked(prisma.page.findMany).mock.calls[0][0]!.where).toEqual({ siteId: "s_1", deletedAt: null });
  });

  it("the editor's project load", async () => {
    vi.mocked(prisma.site.findUnique).mockResolvedValue({ id: "s_1", deletedAt: null, sitePages: [] } as never);
    await getProjectData("s_1");
    const select = vi.mocked(prisma.site.findUnique).mock.calls[0][0]!.select as { sitePages: { where: unknown } };
    expect(select.sitePages.where).toEqual({ deletedAt: null });
  });
});
