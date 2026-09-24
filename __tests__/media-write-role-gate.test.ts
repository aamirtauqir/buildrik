/**
 * Media writes are role-gated, not just ownership-gated.
 *
 * Walk 2026-09-24: a VIEWER's `media.createFolder({ siteId })` returned 200.
 * The services only ever checked `row.userId === userId`, so any member — and
 * any EDITOR later demoted to VIEWER — could write site-scoped media.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    site: { findUnique: vi.fn() },
    workspaceMember: { findFirst: vi.fn() },
    sitePermission: { findUnique: vi.fn() },
    mediaFolder: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    mediaAsset: { findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import { PermissionError } from "@/server/services/permission.service";
import { createFolder, renameFolder } from "@/server/services/media-folder.service";
import { deleteAsset, updateAsset } from "@/server/services/media.service";

function memberWithRole(role: string) {
  vi.mocked(prisma.site.findUnique).mockResolvedValue({ workspaceId: "w1" } as never);
  vi.mocked(prisma.workspaceMember.findFirst).mockResolvedValue({
    id: "m1",
    role,
    _count: { sitePermissions: 0 },
  } as never);
  vi.mocked(prisma.sitePermission.findUnique).mockResolvedValue(null as never);
}

describe("media writes — site role gate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.mediaFolder.create).mockResolvedValue({ id: "f1" } as never);
    vi.mocked(prisma.mediaFolder.update).mockResolvedValue({ id: "f1" } as never);
    vi.mocked(prisma.mediaAsset.update).mockResolvedValue({ id: "a1" } as never);
    vi.mocked(prisma.mediaAsset.delete).mockResolvedValue({ id: "a1" } as never);
  });

  it("VIEWER cannot create a site folder", async () => {
    memberWithRole("VIEWER");
    await expect(createFolder("u1", { name: "x", siteId: "s1" })).rejects.toMatchObject({
      name: "PermissionError",
      code: "FORBIDDEN",
    });
    expect(prisma.mediaFolder.create).not.toHaveBeenCalled();
  });

  it("EDITOR can create a site folder", async () => {
    memberWithRole("EDITOR");
    await expect(createFolder("u1", { name: "x", siteId: "s1" })).resolves.toEqual({ id: "f1" });
  });

  it("a per-site VIEWER override beats the workspace EDITOR role", async () => {
    memberWithRole("EDITOR");
    vi.mocked(prisma.sitePermission.findUnique).mockResolvedValue({ roleOverride: "VIEWER" } as never);
    await expect(createFolder("u1", { name: "x", siteId: "s1" })).rejects.toBeInstanceOf(PermissionError);
  });

  it("the personal library (no site) stays ownership-only", async () => {
    await expect(createFolder("u1", { name: "x", siteId: null })).resolves.toEqual({ id: "f1" });
    expect(prisma.site.findUnique).not.toHaveBeenCalled();
  });

  it("a demoted VIEWER cannot rename a site folder they own", async () => {
    memberWithRole("VIEWER");
    vi.mocked(prisma.mediaFolder.findUnique).mockResolvedValue({ userId: "u1", siteId: "s1" } as never);
    await expect(renameFolder("u1", { folderId: "f1", name: "y" })).rejects.toBeInstanceOf(PermissionError);
    expect(prisma.mediaFolder.update).not.toHaveBeenCalled();
  });

  it("VIEWER cannot delete or edit a site asset they own; EDITOR can", async () => {
    vi.mocked(prisma.mediaAsset.findUnique).mockResolvedValue({ userId: "u1", siteId: "s1", url: null } as never);
    memberWithRole("VIEWER");
    await expect(deleteAsset("u1", { assetId: "a1" })).rejects.toBeInstanceOf(PermissionError);
    await expect(updateAsset("u1", { assetId: "a1", altText: "t" })).rejects.toBeInstanceOf(PermissionError);
    expect(prisma.mediaAsset.delete).not.toHaveBeenCalled();
    expect(prisma.mediaAsset.update).not.toHaveBeenCalled();

    memberWithRole("EDITOR");
    await expect(deleteAsset("u1", { assetId: "a1" })).resolves.toEqual({ success: true });
    await expect(updateAsset("u1", { assetId: "a1", altText: "t" })).resolves.toEqual({ id: "a1" });
  });
});
