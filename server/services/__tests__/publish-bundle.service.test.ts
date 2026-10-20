/**
 * D11 (bundle) and A3/O3/O4/O5 (forms switch over only once live).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const db = vi.hoisted(() => ({
  publishBuildJob: { findUnique: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), update: vi.fn() },
  site: { update: vi.fn() },
}));
const pw = vi.hoisted(() => ({ applyPublishedPassword: vi.fn() }));
const forms = vi.hoisted(() => ({ recordPublishedForms: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: db }));
vi.mock("@/server/services/form-submission.service", () => forms);
vi.mock("@/server/services/publish.service", () => pw);
vi.mock("@/server/services/site-settings.service", () => ({ decryptPublishedPassword: () => null }));

import {
  activatePublishedForms,
  bundleContext,
  bundleHash,
  bundleStillEntitled,
  checkBundle,
  recoverPendingForms,
  retryFormsActivation,
  retryPostDeployStep,
} from "../publish-bundle.service";

const PLAN = { forms: [{ blockId: "f1", path: "/", name: "Contact", fields: [] }], deactivateMissing: true };
const job = (over: Record<string, unknown> = {}) => ({
  id: "j2",
  siteId: "s1",
  status: "COMPLETED",
  formsPlan: PLAN,
  formsAttempts: 0,
  ...over,
});

beforeEach(() => {
  Object.values(db.publishBuildJob).forEach((m) => m.mockReset());
  db.site.update.mockReset();
  pw.applyPublishedPassword.mockReset();
  forms.recordPublishedForms.mockReset();
});

describe("bundle (D11)", () => {
  it("the hash depends on the bytes, not the order", () => {
    const a = [
      { file: "index.html", data: "<p>1</p>" },
      { file: "about.html", data: "<p>2</p>" },
    ];
    expect(bundleHash(a)).toBe(bundleHash([...a].reverse()));
    expect(bundleHash(a)).not.toBe(bundleHash([{ ...a[0], data: "<p>changed</p>" }, a[1]]));
  });

  it("checks read the shipped files: a home page, and no session-only images", () => {
    expect(checkBundle([{ file: "index.html", data: "<p>ok</p>" }])).toEqual([]);
    expect(checkBundle([])).toEqual(["There are no pages to publish."]);
    expect(checkBundle([{ file: "about.html", data: "x" }])[0]).toMatch(/home page/);
    expect(checkBundle([{ file: "index.html", data: '<img src="blob:https://app/1">' }])[0]).toMatch(/never uploaded/);
    expect(checkBundle([{ file: "index.html", data: '<div style="background:url(blob:https://app/2)">' }])[0]).toMatch(/never uploaded/);
    // The word in page text is not an image.
    expect(checkBundle([{ file: "index.html", data: "<p>Azure blob: storage tiers</p>" }])).toEqual([]);
  });
});

describe("a stored bundle ships only under today's entitlements", () => {
  const files = [{ file: "index.html", data: "<p>ok</p>" }];
  it("same plan and same app scripts → the stored bytes ship", () => {
    expect(bundleStillEntitled({ files, context: bundleContext(false, "<s>") }, bundleContext(false, "<s>"))).toBe(true);
  });
  it("a paid-era bundle (no badge) never ships on FREE", () => {
    expect(bundleStillEntitled({ files, context: bundleContext(false, "") }, bundleContext(true, ""))).toBe(false);
  });
  it("an uninstalled app's script never ships", () => {
    expect(bundleStillEntitled({ files, context: bundleContext(false, "<chat>") }, bundleContext(false, ""))).toBe(false);
  });
  it("a bundle from before contexts were recorded rebuilds", () => {
    expect(bundleStillEntitled({ files }, bundleContext(false, ""))).toBe(false);
  });
});

describe("forms switch over after the deploy (A3/O3)", () => {
  it("the live job's plan is applied and marked ACTIVE", async () => {
    db.publishBuildJob.findUnique.mockResolvedValue(job());
    db.publishBuildJob.findFirst.mockResolvedValue({ id: "j2" });
    expect(await activatePublishedForms("j2")).toBe("ACTIVE");
    expect(forms.recordPublishedForms).toHaveBeenCalledWith("s1", PLAN.forms, true);
    expect(db.publishBuildJob.update.mock.calls.at(-1)![0].data).toMatchObject({ formsStatus: "ACTIVE", formsError: null });
  });

  it("an older job (A → B → retry A) never switches the live one's forms off (O3)", async () => {
    db.publishBuildJob.findUnique.mockResolvedValue(job({ id: "jA" }));
    db.publishBuildJob.findFirst.mockResolvedValue({ id: "jB" });
    expect(await activatePublishedForms("jA")).toBe("SUPERSEDED");
    expect(forms.recordPublishedForms).not.toHaveBeenCalled();
  });

  it("removing the last form is recorded too (O4: empty plan that deactivates)", async () => {
    db.publishBuildJob.findUnique.mockResolvedValue(job({ formsPlan: { forms: [], deactivateMissing: true } }));
    db.publishBuildJob.findFirst.mockResolvedValue({ id: "j2" });
    await activatePublishedForms("j2");
    expect(forms.recordPublishedForms).toHaveBeenCalledWith("s1", [], true);
  });

  it("a failure stays PENDING for the cron, and is FAILED with its error on the third (O5)", async () => {
    db.publishBuildJob.findFirst.mockResolvedValue({ id: "j2" });
    forms.recordPublishedForms.mockRejectedValue(new Error("db down"));
    db.publishBuildJob.findUnique.mockResolvedValue(job({ formsAttempts: 0 }));
    expect(await activatePublishedForms("j2")).toBe("PENDING");
    db.publishBuildJob.findUnique.mockResolvedValue(job({ formsAttempts: 2 }));
    expect(await activatePublishedForms("j2")).toBe("FAILED");
    expect(db.publishBuildJob.update.mock.calls.at(-1)![0].data).toMatchObject({ formsStatus: "FAILED", formsError: "db down" });
  });

  it("a job that is not COMPLETED never activates anything", async () => {
    db.publishBuildJob.findUnique.mockResolvedValue(job({ status: "FAILED" }));
    expect(await activatePublishedForms("j2")).toBeNull();
    expect(forms.recordPublishedForms).not.toHaveBeenCalled();
  });

  it("the cron picks up PENDING older than the cutoff", async () => {
    db.publishBuildJob.findMany.mockResolvedValue([{ id: "j2" }]);
    db.publishBuildJob.findUnique.mockResolvedValue(job());
    db.publishBuildJob.findFirst.mockResolvedValue({ id: "j2" });
    expect(await recoverPendingForms(120_000)).toBe(1);
    expect(db.publishBuildJob.findMany.mock.calls[0][0].where).toMatchObject({ status: "COMPLETED", formsStatus: "PENDING" });
    expect(db.publishBuildJob.findMany.mock.calls[0][0].orderBy).toEqual({ completedAt: "asc" });
    expect(forms.recordPublishedForms).toHaveBeenCalledTimes(1);
  });
});

describe("the user's retries never redeploy", () => {
  it("Retry form update only touches a live job whose switch-over has not landed", async () => {
    db.publishBuildJob.findFirst.mockResolvedValueOnce(null);
    await expect(retryFormsActivation("s1", "j2")).rejects.toThrow("NOT_FOUND");
    expect(db.publishBuildJob.findFirst.mock.calls[0][0].where).toEqual({
      id: "j2",
      siteId: "s1",
      status: "COMPLETED",
      formsStatus: { in: ["FAILED", "PENDING"] },
    });
    expect(db.publishBuildJob.update).not.toHaveBeenCalled();
  });

  it("Retry form update resets the attempts and switches the forms over", async () => {
    db.publishBuildJob.findFirst.mockResolvedValueOnce({ id: "j2" }).mockResolvedValueOnce({ id: "j2" });
    db.publishBuildJob.findUnique.mockResolvedValue(job({ formsAttempts: 0 }));
    expect(await retryFormsActivation("s1", "j2")).toBe("ACTIVE");
    expect(db.publishBuildJob.update.mock.calls[0][0].data).toEqual({ formsAttempts: 0 });
  });

  it("the post-deploy retry re-runs the pin and the password, then clears the step", async () => {
    db.publishBuildJob.findFirst.mockResolvedValue({
      id: "j2",
      workspaceId: "w1",
      site: { slug: "my-site", vercelProjectName: null, name: "My site", publishedPassword: null },
    });
    await retryPostDeployStep("s1", "j2");
    expect(db.publishBuildJob.findFirst.mock.calls[0][0].where).toEqual({ id: "j2", siteId: "s1", status: "COMPLETED", failedPhase: "post-deploy" });
    expect(db.site.update.mock.calls[0][0]).toMatchObject({ where: { id: "s1" }, data: { vercelProjectName: expect.any(String) } });
    expect(pw.applyPublishedPassword).toHaveBeenCalledWith("w1", expect.any(String), null);
    expect(db.publishBuildJob.update.mock.calls.at(-1)![0].data).toEqual({ failedPhase: null, error: null });
  });

  it("the post-deploy retry leaves the step recorded when it fails again", async () => {
    db.publishBuildJob.findFirst.mockResolvedValue({
      id: "j2",
      workspaceId: "w1",
      site: { slug: "my-site", vercelProjectName: "pinned", name: "My site", publishedPassword: null },
    });
    pw.applyPublishedPassword.mockRejectedValue(new Error("vercel 500"));
    await expect(retryPostDeployStep("s1", "j2")).rejects.toThrow("vercel 500");
    expect(db.site.update).not.toHaveBeenCalled();
    expect(db.publishBuildJob.update).not.toHaveBeenCalled();
  });

  it("a retry on a job without a post-deploy failure is NOT_FOUND", async () => {
    db.publishBuildJob.findFirst.mockResolvedValue(null);
    await expect(retryPostDeployStep("s1", "j2")).rejects.toThrow("NOT_FOUND");
    expect(pw.applyPublishedPassword).not.toHaveBeenCalled();
  });
});
