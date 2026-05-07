import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    site: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/server/services/email.service", () => ({
  sendSiteTransferredEmail: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { getProjectData } from "@/server/services/sites.service";

describe("getProjectData · dsSchemaVersion exposure", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns dsSchemaVersion=0 when site is fresh", async () => {
    vi.mocked(prisma.site.findUnique).mockResolvedValue({
      id: "site-1",
      name: "test",
      projectStyles: [],
      projectAssets: [],
      projectSettings: {},
      dsSchemaVersion: 0,
      sitePages: [],
    } as any);

    const data = await getProjectData("site-1");
    expect(data.dsSchemaVersion).toBe(0);
  });

  it("returns the stored dsSchemaVersion when set", async () => {
    vi.mocked(prisma.site.findUnique).mockResolvedValue({
      id: "site-1",
      name: "test",
      projectStyles: [],
      projectAssets: [],
      projectSettings: {},
      dsSchemaVersion: 1,
      sitePages: [],
    } as any);

    const data = await getProjectData("site-1");
    expect(data.dsSchemaVersion).toBe(1);
  });

  it("propagates dsSchemaVersion=true to the Prisma select", async () => {
    vi.mocked(prisma.site.findUnique).mockResolvedValue({
      id: "site-1",
      name: "test",
      projectStyles: [],
      projectAssets: [],
      projectSettings: {},
      dsSchemaVersion: 0,
      sitePages: [],
    } as any);

    await getProjectData("site-1");
    const callArg = vi.mocked(prisma.site.findUnique).mock.calls[0][0] as any;
    expect(callArg.select.dsSchemaVersion).toBe(true);
  });
});
