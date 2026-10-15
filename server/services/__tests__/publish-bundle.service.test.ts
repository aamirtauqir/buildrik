/**
 * D11 (bundle) and A3/O3/O4/O5 (forms switch over only once live).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const db = vi.hoisted(() => ({
  publishBuildJob: { findUnique: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), update: vi.fn() },
}));
const forms = vi.hoisted(() => ({ recordPublishedForms: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: db }));
vi.mock("@/server/services/form-submission.service", () => forms);
vi.mock("@/server/services/publish.service", () => ({ applyPublishedPassword: vi.fn() }));
vi.mock("@/server/services/site-settings.service", () => ({ decryptPublishedPassword: () => null }));

import { activatePublishedForms, bundleHash, checkBundle, recoverPendingForms } from "../publish-bundle.service";

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
    expect(db.publishBuildJob.findMany.mock.calls[0][0].where.formsStatus).toBe("PENDING");
    expect(forms.recordPublishedForms).toHaveBeenCalledTimes(1);
  });
});
