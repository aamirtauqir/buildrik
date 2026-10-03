/**
 * Q-B5: `canTransferSite` answers with transferSite's own rule — the site's
 * creator or the workspace OWNER (effective role); a non-creator ADMIN, a
 * non-member and a deleted site are refused. The editor's Danger zone enables
 * Transfer on this answer (`sites.myRole` → `canTransfer`).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: { site: { findFirst: vi.fn() } } }));
vi.mock("@/server/services/permission.service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/server/services/permission.service")>()),
  getEffectiveSiteRole: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { getEffectiveSiteRole, PermissionError } from "@/server/services/permission.service";
import { canTransferSite } from "@/server/services/sites.service";

const site = (createdBy: string | null) => vi.mocked(prisma.site.findFirst).mockResolvedValue({ createdBy } as never);
const role = (r: string) => vi.mocked(getEffectiveSiteRole).mockResolvedValue(r as never);

describe("canTransferSite (Q-B5)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("the creator, as ADMIN: allowed", async () => {
    site("u1");
    role("ADMIN");
    expect(await canTransferSite("s1", "u1")).toBe(true);
  });

  it("an ADMIN who did not create it: refused", async () => {
    site("someone-else");
    role("ADMIN");
    expect(await canTransferSite("s1", "u1")).toBe(false);
  });

  it("the OWNER, not the creator: allowed", async () => {
    site("someone-else");
    role("OWNER");
    expect(await canTransferSite("s1", "u1")).toBe(true);
  });

  it("a caller who cannot reach the site: refused", async () => {
    site("u1");
    vi.mocked(getEffectiveSiteRole).mockRejectedValue(new PermissionError("FORBIDDEN", "no"));
    expect(await canTransferSite("s1", "u1")).toBe(false);
  });

  it("a deleted or missing site: refused", async () => {
    vi.mocked(prisma.site.findFirst).mockResolvedValue(null as never);
    expect(await canTransferSite("s1", "u1")).toBe(false);
  });
});
