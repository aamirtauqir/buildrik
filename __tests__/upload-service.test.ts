import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    site: { findUnique: vi.fn() },
    workspaceMember: { findFirst: vi.fn() },
    sitePermission: { findUnique: vi.fn() },
    pendingUpload: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import {
  createPresignedUrl,
  validateUpload,
  confirmUpload,
  getPendingUpload,
  getUploadLimits,
} from "@/server/services/upload.service";

const p = prisma as unknown as {
  pendingUpload: {
    create: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    updateMany: ReturnType<typeof vi.fn>;
  };
};

beforeEach(() => { vi.clearAllMocks(); });

describe("Upload Service", () => {
  describe("createPresignedUrl", () => {
    it("persists a pending row and returns uploadUrl + fileId", async () => {
      p.pendingUpload.create.mockResolvedValue({});
      const result = await createPresignedUrl({
        fileName: "avatar.jpg",
        fileType: "image/jpeg",
        context: "avatar",
      }, "u1", "ws1");
      expect(result.fileId).toBeDefined();
      expect(result.uploadUrl).toContain("/api/upload/");
      // DB-backed (serverless-safe), not the old in-memory Map
      expect(p.pendingUpload.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: "u1", wsId: "ws1", context: "avatar" }),
        })
      );
    });
  });

  describe("validateUpload", () => {
    it("validates format for context", () => {
      expect(() => validateUpload("avatar", "image/jpeg", 1)).not.toThrow();
      expect(() => validateUpload("avatar", "video/mp4", 1)).toThrow("INVALID_FORMAT");
    });

    it("validates file size", () => {
      expect(() => validateUpload("avatar", "image/jpeg", 6)).toThrow("FILE_TOO_LARGE");
    });

    it("skips the size check when size is unknown (presign time)", () => {
      expect(() => validateUpload("avatar", "image/jpeg")).not.toThrow();
    });

    it("validates favicon size limit", () => {
      expect(() => validateUpload("favicon", "image/png", 0.3)).not.toThrow();
      expect(() => validateUpload("favicon", "image/png", 0.6)).toThrow("FILE_TOO_LARGE");
    });
  });

  describe("getPendingUpload", () => {
    it("only returns rows younger than the 10-minute TTL", async () => {
      p.pendingUpload.findFirst.mockResolvedValue(null);
      await getPendingUpload("f1");
      const where = p.pendingUpload.findFirst.mock.calls[0][0].where;
      expect(where.id).toBe("f1");
      expect(where.createdAt.gte).toBeInstanceOf(Date);
    });
  });

  describe("confirmUpload", () => {
    it("marks the upload confirmed and returns the stored URL", async () => {
      p.pendingUpload.findFirst.mockResolvedValue({
        id: "f1", userId: "u1", storedUrl: "https://blob/x.jpg", confirmed: false,
      });
      p.pendingUpload.update.mockResolvedValue({});
      const result = await confirmUpload("f1", "u1");
      expect(result).toEqual({ confirmed: true, cdnUrl: "https://blob/x.jpg" });
      // scoped to the presigning user — another account can't confirm it
      expect(p.pendingUpload.findFirst.mock.calls[0][0].where).toMatchObject({ id: "f1", userId: "u1" });
    });

    it("rejects before the PUT body landed", async () => {
      p.pendingUpload.findFirst.mockResolvedValue({ id: "f1", userId: "u1", storedUrl: null });
      await expect(confirmUpload("f1", "u1")).rejects.toThrow("NOT_UPLOADED");
    });

    it("rejects when the row belongs to a different user", async () => {
      p.pendingUpload.findFirst.mockResolvedValue(null); // where-clause excludes it
      await expect(confirmUpload("f1", "intruder")).rejects.toThrow("NOT_FOUND");
    });
  });

  describe("getUploadLimits", () => {
    it("returns limits for all contexts", () => {
      const limits = getUploadLimits();
      expect(limits.avatar).toBeDefined();
      expect(limits.avatar.maxSizeMB).toBe(5);
      expect(limits.favicon.maxSizeMB).toBe(0.5);
      expect(limits.site_media.maxSizeMB).toBe(50);
    });
  });
});

/* Presign is the write authorisation for a PUT that overwrites a fixed path
   (sites/<id>/favicon…, workspaces/<id>/icon). It used to check nothing. */
describe("createPresignedUrl — role gate", () => {
  function asRole(role: string) {
    vi.mocked(prisma.site.findUnique).mockResolvedValue({ workspaceId: "ws" } as never);
    vi.mocked(prisma.workspaceMember.findFirst).mockResolvedValue({
      id: "m", role, _count: { sitePermissions: 0 },
    } as never);
    vi.mocked(prisma.sitePermission.findUnique).mockResolvedValue(null as never);
    p.pendingUpload.create.mockResolvedValue({});
  }
  const favicon = { fileName: "f.png", fileType: "image/png", context: "favicon" as const, siteId: "s1" };

  it("VIEWER cannot presign a site favicon", async () => {
    asRole("VIEWER");
    await expect(createPresignedUrl(favicon, "u", "ws")).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(p.pendingUpload.create).not.toHaveBeenCalled();
  });

  it("EDITOR cannot either — site assets are settings, which are ADMIN", async () => {
    asRole("EDITOR");
    await expect(createPresignedUrl(favicon, "u", "ws")).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("ADMIN can", async () => {
    asRole("ADMIN");
    await expect(createPresignedUrl(favicon, "u", "ws")).resolves.toMatchObject({ uploadUrl: expect.any(String) });
  });

  it("a site asset without a siteId is refused (it used to land on sites/global/)", async () => {
    asRole("OWNER");
    await expect(createPresignedUrl({ ...favicon, siteId: undefined }, "u", "ws")).rejects.toThrow("SITE_REQUIRED");
  });

  it("VIEWER cannot presign workspace media or the workspace icon; EDITOR can do media", async () => {
    asRole("VIEWER");
    const media = { fileName: "a.png", fileType: "image/png", context: "site_media" as const };
    await expect(createPresignedUrl(media, "u", "ws")).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      createPresignedUrl({ fileName: "i.png", fileType: "image/png", context: "workspace_icon" }, "u", "ws"),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    asRole("EDITOR");
    await expect(createPresignedUrl(media, "u", "ws")).resolves.toMatchObject({ uploadUrl: expect.any(String) });
  });
});
