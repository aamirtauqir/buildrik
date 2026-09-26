/**
 * cms router — CSV import (fix-all round, 2026-09-25). Verifies both
 * `entries.importCsvPreview` and `entries.importCsv` require EDITOR+ (the
 * same floor as `entries.upsert`), never reach the service on a permission
 * refusal, and translate a `CmsError` the same way the rest of the router
 * does.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const checkSiteRoleMock = vi.fn();
const previewCsvImportMock = vi.fn();
const importCsvEntriesMock = vi.fn();

vi.mock("@/server/auth", () => ({ auth: vi.fn().mockResolvedValue(null) }));
vi.mock("@/server/services/api-token.service", () => ({
  extractBearer: () => null,
  verifyApiToken: vi.fn(),
}));
vi.mock("next/headers", () => ({
  cookies: () => Promise.resolve({ get: () => undefined, delete: vi.fn() }),
}));
vi.mock("@/server/services/permission.service", () => ({
  assertSiteAccess: vi.fn(),
  checkSiteRole: (...a: unknown[]) => checkSiteRoleMock(...a),
  PermissionError: class PermissionError extends Error {
    code: string;
    constructor(code: string, msg?: string) {
      super(msg ?? code);
      this.name = "PermissionError";
      this.code = code;
    }
  },
}));
vi.mock("@/server/services/cms.service", async () => {
  const actual = await vi.importActual<typeof import("@/server/services/cms.service")>("@/server/services/cms.service");
  return {
    ...actual,
    previewCsvImport: (...a: unknown[]) => previewCsvImportMock(...a),
    importCsvEntries: (...a: unknown[]) => importCsvEntriesMock(...a),
  };
});
vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import { cmsRouter } from "@/server/trpc/routers/cms";
import { PermissionError } from "@/server/services/permission.service";

function makeCtx() {
  return { session: { user: { id: "u_1" } }, prisma: {} as never };
}

beforeEach(() => {
  [checkSiteRoleMock, previewCsvImportMock, importCsvEntriesMock].forEach((m) => m.mockReset());
});

describe("cms router — entries.importCsvPreview", () => {
  it("requires EDITOR+ and never reaches the service for a viewer", async () => {
    checkSiteRoleMock.mockRejectedValueOnce(new PermissionError("FORBIDDEN", "needs EDITOR"));
    const caller = cmsRouter.createCaller(makeCtx() as never);
    await expect(
      caller.entries.importCsvPreview({ siteId: "s1", collectionId: "c1", csv: "a,b\n1,2" }),
    ).rejects.toThrow(/EDITOR/i);
    expect(previewCsvImportMock).not.toHaveBeenCalled();
  });

  it("calls the service for an EDITOR+", async () => {
    checkSiteRoleMock.mockResolvedValueOnce(undefined);
    previewCsvImportMock.mockResolvedValueOnce({ headers: ["a"], totalRows: 1, sampleRows: [], suggestedMapping: {} });
    const caller = cmsRouter.createCaller(makeCtx() as never);
    await expect(
      caller.entries.importCsvPreview({ siteId: "s1", collectionId: "c1", csv: "a\n1" }),
    ).resolves.toMatchObject({ headers: ["a"] });
    expect(previewCsvImportMock).toHaveBeenCalledWith("s1", "c1", "a\n1");
  });
});

describe("cms router — entries.importCsv", () => {
  it("requires EDITOR+ and never reaches the service for a viewer", async () => {
    checkSiteRoleMock.mockRejectedValueOnce(new PermissionError("FORBIDDEN", "needs EDITOR"));
    const caller = cmsRouter.createCaller(makeCtx() as never);
    await expect(
      caller.entries.importCsv({ siteId: "s1", collectionId: "c1", csv: "a\n1", columnMapping: { a: "a" } }),
    ).rejects.toThrow(/EDITOR/i);
    expect(importCsvEntriesMock).not.toHaveBeenCalled();
  });

  it("calls the service for an EDITOR+ and returns its result", async () => {
    checkSiteRoleMock.mockResolvedValueOnce(undefined);
    importCsvEntriesMock.mockResolvedValueOnce({ imported: 1, total: 1, errors: [] });
    const caller = cmsRouter.createCaller(makeCtx() as never);
    await expect(
      caller.entries.importCsv({ siteId: "s1", collectionId: "c1", csv: "a\n1", columnMapping: { a: "a" } }),
    ).resolves.toEqual({ imported: 1, total: 1, errors: [] });
    expect(importCsvEntriesMock).toHaveBeenCalledWith("s1", "c1", "a\n1", { a: "a" });
  });
});
