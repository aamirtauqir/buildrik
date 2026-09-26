import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    formBlock: { findFirst: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), upsert: vi.fn() },
    formSubmission: { create: vi.fn(), findMany: vi.fn(), count: vi.fn(), update: vi.fn(), delete: vi.fn() },
    site: { findUnique: vi.fn() },
    domain: { findFirst: vi.fn() },
    workspaceMember: { findFirst: vi.fn() },
  },
}));

vi.mock("@/server/services/email.service", () => ({
  sendFormSubmissionEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/server/services/webhook.service", () => ({
  deliverWebhook: vi.fn(),
}));

vi.mock("@/server/services/notification.trigger", () => ({
  notifyWorkspaceOwner: vi.fn().mockResolvedValue(undefined),
}));

import { prisma } from "@/lib/prisma";
import { sendFormSubmissionEmail } from "@/server/services/email.service";

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

    it("returns the block's after-submit settings so the route can redirect / show the message", async () => {
      const { submitForm } = await import("@/server/services/form-submission.service");
      vi.mocked(prisma.formBlock.findFirst).mockResolvedValue({
        id: "fb1", siteId: "s1", isActive: true,
        successAction: "REDIRECT", redirectUrl: "https://example.com/thanks", successMessage: "Thanks!",
      } as any);
      vi.mocked(prisma.formSubmission.count).mockResolvedValue(0);
      vi.mocked(prisma.site.findUnique).mockResolvedValue({ workspaceId: "ws1", name: "Site" } as any);
      vi.mocked(prisma.workspaceMember.findFirst).mockResolvedValue({ workspace: { plan: "FREE" } } as any);
      vi.mocked(prisma.formSubmission.create).mockResolvedValue({ id: "sub2" } as any);

      const result = await submitForm("s1", "fb1", { data: {} }, "1.2.3.4");
      expect(result).toMatchObject({
        id: "sub2",
        successAction: "REDIRECT",
        redirectUrl: "https://example.com/thanks",
        successMessage: "Thanks!",
      });
    });

    it("falls back to MESSAGE when a REDIRECT row somehow has no usable URL (defense in depth — the write path already validates it)", async () => {
      const { submitForm } = await import("@/server/services/form-submission.service");
      vi.mocked(prisma.formBlock.findFirst).mockResolvedValue({
        id: "fb1", siteId: "s1", isActive: true,
        successAction: "REDIRECT", redirectUrl: "/relative-not-absolute", successMessage: "Thanks!",
      } as any);
      vi.mocked(prisma.formSubmission.count).mockResolvedValue(0);
      vi.mocked(prisma.site.findUnique).mockResolvedValue({ workspaceId: "ws1", name: "Site" } as any);
      vi.mocked(prisma.workspaceMember.findFirst).mockResolvedValue({ workspace: { plan: "FREE" } } as any);
      vi.mocked(prisma.formSubmission.create).mockResolvedValue({ id: "sub2b" } as any);

      const result = await submitForm("s1", "fb1", { data: {} }, "1.2.3.4");
      expect(result.successAction).toBe("MESSAGE");
      expect(result.redirectUrl).toBeNull();
    });

    it("validates returnUrl against the site's own origin before trusting it", async () => {
      const { submitForm } = await import("@/server/services/form-submission.service");
      vi.mocked(prisma.formBlock.findFirst).mockResolvedValue({ id: "fb1", siteId: "s1", isActive: true } as any);
      vi.mocked(prisma.formSubmission.count).mockResolvedValue(0);
      vi.mocked(prisma.site.findUnique).mockResolvedValue({
        workspaceId: "ws1", name: "Site", canonicalUrl: "https://mysite.example.com", slug: "my-site",
      } as any);
      vi.mocked(prisma.domain.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.workspaceMember.findFirst).mockResolvedValue({ workspace: { plan: "FREE" } } as any);
      vi.mocked(prisma.formSubmission.create).mockResolvedValue({ id: "sub2c" } as any);

      const same = await submitForm(
        "s1", "fb1", { data: {}, returnUrl: "https://mysite.example.com/contact" }, "1.2.3.4",
      );
      expect(same.returnUrl).toBe("https://mysite.example.com/contact");

      const other = await submitForm(
        "s1", "fb1", { data: {}, returnUrl: "https://evil.example.com/phish" }, "1.2.3.4",
      );
      expect(other.returnUrl).toBeNull();
    });

    it("logs (not swallows) a failed notification email — the submission is already saved", async () => {
      const { submitForm } = await import("@/server/services/form-submission.service");
      vi.mocked(prisma.formBlock.findFirst).mockResolvedValue({
        id: "fb1", siteId: "s1", isActive: true, notifyEmail: "team@example.com",
      } as any);
      vi.mocked(prisma.formSubmission.count).mockResolvedValue(0);
      vi.mocked(prisma.site.findUnique).mockResolvedValue({ workspaceId: "ws1", name: "Site" } as any);
      vi.mocked(prisma.workspaceMember.findFirst).mockResolvedValue({ workspace: { plan: "FREE" } } as any);
      vi.mocked(prisma.formSubmission.create).mockResolvedValue({ id: "sub2d" } as any);
      vi.mocked(sendFormSubmissionEmail).mockRejectedValueOnce(new Error("SMTP down"));
      const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const result = await submitForm("s1", "fb1", { data: {} }, "1.2.3.4");
      await new Promise((r) => setTimeout(r, 0));

      expect(result.id).toBe("sub2d"); // submission itself is unaffected
      expect(errSpy).toHaveBeenCalledWith(
        expect.stringContaining("[form-submission] notify email failed"),
        expect.any(Error),
      );
      errSpy.mockRestore();
    });

    it("notifies BOTH the block's configured address and the workspace owner", async () => {
      const { submitForm } = await import("@/server/services/form-submission.service");
      vi.mocked(prisma.formBlock.findFirst).mockResolvedValue({
        id: "fb1", siteId: "s1", isActive: true, notifyEmail: "team@example.com",
      } as any);
      vi.mocked(prisma.formSubmission.count).mockResolvedValue(0);
      vi.mocked(prisma.site.findUnique).mockResolvedValue({ workspaceId: "ws1", name: "Site" } as any);
      // Two different findFirst calls share this mock (plan check, owner
      // lookup) — distinguish by the `select` shape each actually passes.
      vi.mocked(prisma.workspaceMember.findFirst).mockImplementation(((args: any) =>
        args?.select?.workspace
          ? Promise.resolve({ workspace: { plan: "FREE" } })
          : Promise.resolve({ user: { email: "owner@example.com" } })) as any);
      vi.mocked(prisma.formSubmission.create).mockResolvedValue({ id: "sub3", data: {} } as any);

      await submitForm("s1", "fb1", { data: { name: "A" } }, "1.2.3.4");
      // The notification is fire-and-forget (`.then().catch()`); flush microtasks.
      await new Promise((r) => setTimeout(r, 0));
      expect(sendFormSubmissionEmail).toHaveBeenCalledWith("team@example.com", "Site", expect.any(Array), "s1");
      expect(sendFormSubmissionEmail).toHaveBeenCalledWith("owner@example.com", "Site", expect.any(Array), "s1");
      expect(sendFormSubmissionEmail).toHaveBeenCalledTimes(2);
    });

    it("doesn't double-send when the owner IS the configured notify address", async () => {
      const { submitForm } = await import("@/server/services/form-submission.service");
      vi.mocked(prisma.formBlock.findFirst).mockResolvedValue({
        id: "fb1", siteId: "s1", isActive: true, notifyEmail: "same@example.com",
      } as any);
      vi.mocked(prisma.formSubmission.count).mockResolvedValue(0);
      vi.mocked(prisma.site.findUnique).mockResolvedValue({ workspaceId: "ws1", name: "Site" } as any);
      vi.mocked(prisma.workspaceMember.findFirst).mockImplementation(((args: any) =>
        args?.select?.workspace
          ? Promise.resolve({ workspace: { plan: "FREE" } })
          : Promise.resolve({ user: { email: "same@example.com" } })) as any);
      vi.mocked(prisma.formSubmission.create).mockResolvedValue({ id: "sub4", data: {} } as any);

      await submitForm("s1", "fb1", { data: { name: "A" } }, "1.2.3.4");
      await new Promise((r) => setTimeout(r, 0));
      expect(sendFormSubmissionEmail).toHaveBeenCalledTimes(1);
      expect(sendFormSubmissionEmail).toHaveBeenCalledWith("same@example.com", "Site", expect.any(Array), "s1");
    });

    it("Fix round 2 (finding 5): doesn't double-send when the owner and notifyEmail differ only by case", async () => {
      const { submitForm } = await import("@/server/services/form-submission.service");
      vi.mocked(prisma.formBlock.findFirst).mockResolvedValue({
        id: "fb1", siteId: "s1", isActive: true, notifyEmail: "Same@Example.com",
      } as any);
      vi.mocked(prisma.formSubmission.count).mockResolvedValue(0);
      vi.mocked(prisma.site.findUnique).mockResolvedValue({ workspaceId: "ws1", name: "Site" } as any);
      vi.mocked(prisma.workspaceMember.findFirst).mockImplementation(((args: any) =>
        args?.select?.workspace
          ? Promise.resolve({ workspace: { plan: "FREE" } })
          : Promise.resolve({ user: { email: "same@example.com" } })) as any);
      vi.mocked(prisma.formSubmission.create).mockResolvedValue({ id: "sub4b", data: {} } as any);

      await submitForm("s1", "fb1", { data: { name: "A" } }, "1.2.3.4");
      await new Promise((r) => setTimeout(r, 0));
      expect(sendFormSubmissionEmail).toHaveBeenCalledTimes(1);
    });

    it("still notifies the owner when the block has no notifyEmail configured", async () => {
      const { submitForm } = await import("@/server/services/form-submission.service");
      vi.mocked(prisma.formBlock.findFirst).mockResolvedValue({ id: "fb1", siteId: "s1", isActive: true } as any);
      vi.mocked(prisma.formSubmission.count).mockResolvedValue(0);
      vi.mocked(prisma.site.findUnique).mockResolvedValue({ workspaceId: "ws1", name: "Site" } as any);
      vi.mocked(prisma.workspaceMember.findFirst).mockImplementation(((args: any) =>
        args?.select?.workspace
          ? Promise.resolve({ workspace: { plan: "FREE" } })
          : Promise.resolve({ user: { email: "owner@example.com" } })) as any);
      vi.mocked(prisma.formSubmission.create).mockResolvedValue({ id: "sub5", data: {} } as any);

      await submitForm("s1", "fb1", { data: {} }, "1.2.3.4");
      await new Promise((r) => setTimeout(r, 0));
      expect(sendFormSubmissionEmail).toHaveBeenCalledWith("owner@example.com", "Site", expect.any(Array), "s1");
    });
  });

  describe("getFormBlockSettings", () => {
    it("returns defaults when the row doesn't exist yet (form never published)", async () => {
      const { getFormBlockSettings } = await import("@/server/services/form-submission.service");
      vi.mocked(prisma.formBlock.findFirst).mockResolvedValue(null);
      const settings = await getFormBlockSettings("s1", "el1");
      expect(settings).toEqual({
        successMessage: null, successAction: "MESSAGE", redirectUrl: null, notifyEmail: null, spamProtection: true,
      });
    });

    it("reads the existing row's settings", async () => {
      const { getFormBlockSettings } = await import("@/server/services/form-submission.service");
      vi.mocked(prisma.formBlock.findFirst).mockResolvedValue({
        successMessage: "Thanks", successAction: "REDIRECT", redirectUrl: "https://x.com",
        notifyEmail: "a@b.com", spamProtection: false,
      } as any);
      const settings = await getFormBlockSettings("s1", "el1");
      expect(settings.successAction).toBe("REDIRECT");
      expect(settings.spamProtection).toBe(false);
    });
  });

  describe("updateFormBlock", () => {
    it("creates a row when none exists yet", async () => {
      const { updateFormBlock } = await import("@/server/services/form-submission.service");
      vi.mocked(prisma.formBlock.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.formBlock.upsert).mockResolvedValue({ id: "el1" } as any);

      await updateFormBlock({ siteId: "s1", blockId: "el1", spamProtection: false });
      expect(prisma.formBlock.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "el1" },
          create: expect.objectContaining({ id: "el1", siteId: "s1", blockId: "el1", spamProtection: false }),
          update: { spamProtection: false },
        }),
      );
    });

    it("refuses to write a row that belongs to a different site", async () => {
      const { updateFormBlock } = await import("@/server/services/form-submission.service");
      vi.mocked(prisma.formBlock.findUnique).mockResolvedValue({ siteId: "other-site" } as any);

      await expect(updateFormBlock({ siteId: "s1", blockId: "el1", spamProtection: false })).rejects.toThrow(
        "FORM_NOT_FOUND",
      );
      expect(prisma.formBlock.upsert).not.toHaveBeenCalled();
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

    it("neutralizes spreadsheet formula payloads in values AND field names", async () => {
      const { exportSubmissions } = await import("@/server/services/form-submission.service");
      vi.mocked(prisma.formSubmission.findMany).mockResolvedValue([
        {
          id: "sub1",
          createdAt: new Date("2026-06-01"),
          data: { "=evil()": "=cmd|' /C calc'!A0", note: "+SUM(1)" },
          formBlock: { name: "Contact" },
        },
      ] as any);

      const csv = await exportSubmissions("s1", undefined, "csv");
      // formula-leading cells get an apostrophe prefix inside the quotes
      expect(csv).toContain(`"'=cmd|' /C calc'!A0"`);
      expect(csv).toContain(`"'+SUM(1)"`);
      expect(csv).toContain(`"'=evil()"`); // header row too
      expect(csv).not.toMatch(/(^|,)"=/m); // no cell starts with a live "="
    });
  });
});
