import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    formBlock: { findFirst: vi.fn(), findMany: vi.fn() },
    formSubmission: { create: vi.fn(), findMany: vi.fn(), count: vi.fn(), update: vi.fn(), delete: vi.fn() },
    site: { findUnique: vi.fn() },
    workspaceMember: { findFirst: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";

describe("Form Submission Service", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  describe("submitForm", () => {
    it("creates submission for active form block", async () => {
      const { submitForm } = await import("@/server/services/form-submission.service");
      vi.mocked(prisma.formBlock.findFirst).mockResolvedValue({ id: "fb1", siteId: "s1", isActive: true } as any);
      vi.mocked(prisma.formSubmission.count).mockResolvedValue(5);
      vi.mocked(prisma.site.findUnique).mockResolvedValue({ workspaceId: "ws1" } as any);
      vi.mocked(prisma.workspaceMember.findFirst).mockResolvedValue({ workspace: { plan: "FREE" } } as any);
      vi.mocked(prisma.formSubmission.create).mockResolvedValue({ id: "sub1", data: { name: "John" } } as any);

      const result = await submitForm("s1", "fb1", { data: { name: "John" } }, "1.2.3.4");
      expect(result.id).toBe("sub1");
    });

    it("rejects silently when honeypot filled", async () => {
      const { submitForm } = await import("@/server/services/form-submission.service");
      const result = await submitForm("s1", "fb1", { data: { name: "Bot" }, honeypot: "gotcha" }, "1.2.3.4");
      expect(result.id).toBe("honeypot");
    });

    it("throws FORM_NOT_FOUND for inactive form", async () => {
      const { submitForm } = await import("@/server/services/form-submission.service");
      vi.mocked(prisma.formBlock.findFirst).mockResolvedValue(null);
      await expect(submitForm("s1", "fb1", { data: {} }, "1.2.3.4")).rejects.toThrow("FORM_NOT_FOUND");
    });

    it("throws FORM_SUBMISSION_LIMIT when monthly limit reached", async () => {
      const { submitForm } = await import("@/server/services/form-submission.service");
      vi.mocked(prisma.formBlock.findFirst).mockResolvedValue({ id: "fb1", siteId: "s1", isActive: true } as any);
      vi.mocked(prisma.formSubmission.count).mockResolvedValue(100);
      vi.mocked(prisma.site.findUnique).mockResolvedValue({ workspaceId: "ws1" } as any);
      vi.mocked(prisma.workspaceMember.findFirst).mockResolvedValue({ workspace: { plan: "FREE" } } as any);

      await expect(submitForm("s1", "fb1", { data: {} }, "1.2.3.4")).rejects.toThrow("FORM_SUBMISSION_LIMIT");
    });
  });

  describe("listSubmissions", () => {
    it("returns paginated submissions", async () => {
      const { listSubmissions } = await import("@/server/services/form-submission.service");
      vi.mocked(prisma.formSubmission.count).mockResolvedValue(5);
      vi.mocked(prisma.formSubmission.findMany).mockResolvedValue([
        { id: "sub1", data: { name: "John" }, isRead: false, createdAt: new Date() },
      ] as any);
      const result = await listSubmissions({ siteId: "s1", page: 1, perPage: 20 });
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(5);
    });
  });

  describe("updateSubmission", () => {
    it("toggles isRead flag", async () => {
      const { updateSubmission } = await import("@/server/services/form-submission.service");
      vi.mocked(prisma.formSubmission.update).mockResolvedValue({ id: "sub1", isRead: true } as any);
      const result = await updateSubmission({ id: "sub1", isRead: true });
      expect(result.isRead).toBe(true);
    });
  });

  describe("deleteSubmission", () => {
    it("hard deletes submission", async () => {
      const { deleteSubmission } = await import("@/server/services/form-submission.service");
      vi.mocked(prisma.formSubmission.delete).mockResolvedValue({ id: "sub1" } as any);
      await deleteSubmission("sub1");
      expect(prisma.formSubmission.delete).toHaveBeenCalledWith({ where: { id: "sub1" } });
    });
  });

  describe("listFormBlocks", () => {
    it("returns form blocks for site", async () => {
      const { listFormBlocks } = await import("@/server/services/form-submission.service");
      vi.mocked(prisma.formBlock.findMany).mockResolvedValue([
        { id: "fb1", name: "Contact Form", isActive: true, _count: { submissions: 10 } },
      ] as any);
      const result = await listFormBlocks("s1");
      expect(result).toHaveLength(1);
    });
  });

  describe("exportSubmissions", () => {
    // Regression: W1.3 — overview "Export CSV" must export the full
    // site-wide dataset (formBlockId omitted), not one form / one page.
    // Found by /codex audit on 2026-06-12.
    it("queries all forms on the site when formBlockId is omitted", async () => {
      const { exportSubmissions } = await import("@/server/services/form-submission.service");
      vi.mocked(prisma.formSubmission.findMany).mockResolvedValue([
        { id: "s1sub", createdAt: new Date("2026-06-01"), data: { email: "a@b.com" }, formBlock: { name: "Contact" } },
      ] as any);

      const csv = await exportSubmissions("s1", undefined, "csv");

      expect(prisma.formSubmission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { siteId: "s1" } }),
      );
      expect(csv).toContain("form");
      expect(csv).toContain("Contact");
      expect(csv).toContain("a@b.com");
    });

    it("scopes to one form block when formBlockId is provided", async () => {
      const { exportSubmissions } = await import("@/server/services/form-submission.service");
      vi.mocked(prisma.formSubmission.findMany).mockResolvedValue([] as any);
      await exportSubmissions("s1", "fb1", "csv");
      expect(prisma.formSubmission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { siteId: "s1", formBlockId: "fb1" } }),
      );
    });
  });
});
