/**
 * sites.authorizeCodeExport — the editor asks this before it builds the
 * "Download code (ZIP)". Site role first (EDITOR and up — viewers can't), then the
 * plan; the plan refusal is FORBIDDEN with a CODE_EXPORT_NOT_IN_PLAN-led
 * message so the editor can show the upgrade prompt for it alone.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const checkSiteRoleMock = vi.fn();
const assertCodeExportAllowedMock = vi.fn();

vi.mock("@/server/auth", () => ({ auth: vi.fn().mockResolvedValue(null) }));
vi.mock("@/server/services/api-token.service", () => ({
  extractBearer: () => null,
  verifyApiToken: vi.fn(),
}));
vi.mock("next/headers", () => ({
  cookies: () => Promise.resolve({ get: () => undefined, delete: vi.fn() }),
}));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/server/trpc/workspace-ctx", () => ({ resolveWorkspaceId: vi.fn().mockResolvedValue("ws_1") }));
vi.mock("@/server/services/permission.service", () => ({
  assertSiteAccess: vi.fn(),
  checkSiteRole: (...a: unknown[]) => checkSiteRoleMock(...a),
  checkWorkspaceRole: vi.fn(),
  PermissionError: class PermissionError extends Error {
    code: string;
    constructor(code: string, msg?: string) { super(msg ?? code); this.code = code; }
  },
}));
vi.mock("@/server/services/sites.service", () => ({
  assertCodeExportAllowed: (...a: unknown[]) => assertCodeExportAllowedMock(...a),
}));
vi.mock("@/server/services/folder.service", () => ({}));
vi.mock("@/server/services/publish.service", () => ({}));
vi.mock("@/server/services/activity-log.service", () => ({ recordForSite: vi.fn() }));
vi.mock("@/server/services/template.service", () => ({}));
vi.mock("@/server/services/ai-generation.service", () => ({}));

import { sitesRouter } from "@/server/trpc/routers/sites";
import { PermissionError } from "@/server/services/permission.service";
import { CODE_EXPORT_NOT_IN_PLAN } from "@buildrik/shared/schemas/sites";

const prisma = {};
const caller = () => sitesRouter.createCaller({ session: { user: { id: "u_1" } }, prisma } as never);

beforeEach(() => {
  checkSiteRoleMock.mockReset().mockResolvedValue(undefined);
  assertCodeExportAllowedMock.mockReset().mockResolvedValue(undefined);
});

describe("sites.authorizeCodeExport", () => {
  it("allows a member of a site whose plan has code export", async () => {
    await expect(caller().authorizeCodeExport({ siteId: "s1" })).resolves.toEqual({ allowed: true });
    expect(checkSiteRoleMock).toHaveBeenCalledWith(prisma, "u_1", "s1", "EDITOR");
    expect(assertCodeExportAllowedMock).toHaveBeenCalledWith("s1");
  });

  it("is FORBIDDEN with the plan reason when the plan has no code export", async () => {
    assertCodeExportAllowedMock.mockRejectedValueOnce(new Error(CODE_EXPORT_NOT_IN_PLAN));
    const err = await caller().authorizeCodeExport({ siteId: "s1" }).catch((e: unknown) => e);
    expect(err).toMatchObject({ code: "FORBIDDEN" });
    expect((err as Error).message.startsWith(CODE_EXPORT_NOT_IN_PLAN)).toBe(true);
  });

  it("refuses a viewer or non-member without reading the plan, and without the plan reason", async () => {
    checkSiteRoleMock.mockRejectedValueOnce(new PermissionError("FORBIDDEN" as never));
    const err = await caller().authorizeCodeExport({ siteId: "s1" }).catch((e: unknown) => e);
    expect(err).toMatchObject({ code: "FORBIDDEN" });
    expect((err as Error).message.startsWith(CODE_EXPORT_NOT_IN_PLAN)).toBe(false);
    expect(assertCodeExportAllowedMock).not.toHaveBeenCalled();
  });

  it("translates SITE_NOT_FOUND to NOT_FOUND", async () => {
    assertCodeExportAllowedMock.mockRejectedValueOnce(new Error("SITE_NOT_FOUND"));
    await expect(caller().authorizeCodeExport({ siteId: "s1" })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("rejects an empty siteId at the input boundary", async () => {
    await expect(caller().authorizeCodeExport({ siteId: "" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(checkSiteRoleMock).not.toHaveBeenCalled();
  });
});
