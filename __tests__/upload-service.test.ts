import { describe, it, expect, vi, beforeEach } from "vitest";

describe("Upload Service", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  describe("createPresignedUrl", () => {
    it("returns uploadUrl, fileId, and cdnUrl", async () => {
      const { createPresignedUrl } = await import("@/server/services/upload.service");
      const result = await createPresignedUrl({
        fileName: "avatar.jpg",
        fileType: "image/jpeg",
        context: "avatar",
      }, "u1", "ws1");
      expect(result.fileId).toBeDefined();
      expect(result.cdnUrl).toContain("cdn.buildrik.app");
      expect(result.uploadUrl).toContain("/api/upload/");
    });
  });

  describe("validateUpload", () => {
    it("validates format for context", async () => {
      const { validateUpload } = await import("@/server/services/upload.service");
      expect(() => validateUpload("avatar", "image/jpeg", 1)).not.toThrow();
      expect(() => validateUpload("avatar", "video/mp4", 1)).toThrow("INVALID_FORMAT");
    });

    it("validates file size", async () => {
      const { validateUpload } = await import("@/server/services/upload.service");
      expect(() => validateUpload("avatar", "image/jpeg", 6)).toThrow("FILE_TOO_LARGE");
    });

    it("validates favicon size limit", async () => {
      const { validateUpload } = await import("@/server/services/upload.service");
      expect(() => validateUpload("favicon", "image/png", 0.3)).not.toThrow();
      expect(() => validateUpload("favicon", "image/png", 0.6)).toThrow("FILE_TOO_LARGE");
    });
  });

  describe("confirmUpload", () => {
    it("marks upload as confirmed", async () => {
      const { confirmUpload, createPresignedUrl } = await import("@/server/services/upload.service");
      const presign = await createPresignedUrl({ fileName: "test.jpg", fileType: "image/jpeg", context: "avatar" }, "u1", "ws1");
      const result = await confirmUpload(presign.fileId);
      expect(result.confirmed).toBe(true);
    });
  });

  describe("getUploadLimits", () => {
    it("returns limits for all contexts", async () => {
      const { getUploadLimits } = await import("@/server/services/upload.service");
      const limits = getUploadLimits();
      expect(limits.avatar).toBeDefined();
      expect(limits.avatar.maxSizeMB).toBe(5);
      expect(limits.favicon.maxSizeMB).toBe(0.5);
      expect(limits.site_media.maxSizeMB).toBe(50);
    });
  });
});
