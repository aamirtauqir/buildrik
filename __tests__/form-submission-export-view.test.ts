/**
 * exportSubmissions — the editor's view filter (2L9 GAP-FM-Export-*): the
 * Spam / Archived view exports only its own rows; with no view the export
 * stays whole-site (the dashboard's Export CSV, covered in
 * form-submission-service.test.ts).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const prismaMock = vi.hoisted(() => ({ formSubmission: { findMany: vi.fn() } }));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import { exportSubmissions } from "@/server/services/form-submission.service";

beforeEach(() => prismaMock.formSubmission.findMany.mockReset().mockResolvedValue([]));

describe("exportSubmissions — view filter", () => {
  it("narrows to the view when isSpam / isArchived are given", async () => {
    await exportSubmissions("s1", "fb1", "csv", { technical: false }, { isSpam: true, isArchived: false });
    expect(prismaMock.formSubmission.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { siteId: "s1", formBlockId: "fb1", isSpam: true, isArchived: false } }),
    );
  });

  it("leaves both states in when no view is given", async () => {
    await exportSubmissions("s1", undefined, "csv", { technical: false });
    expect(prismaMock.formSubmission.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { siteId: "s1" } }));
  });
});
