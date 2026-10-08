/**
 * theme.brandRestorePoints — site editors read their own restore points with
 * no agency gate; a VIEWER is refused before the service is reached.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const checkSiteRoleMock = vi.fn();
const listBrandRestorePointsMock = vi.fn();
const createBrandRestorePointMock = vi.fn();
const getBrandRestorePointMock = vi.fn();

vi.mock("@/server/auth", () => ({ auth: vi.fn().mockResolvedValue(null) }));
vi.mock("@/server/services/api-token.service", () => ({ extractBearer: () => null, verifyApiToken: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: () => Promise.resolve({ get: () => undefined, delete: vi.fn() }) }));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/server/trpc/guards", () => ({ requireAgencyLayer: vi.fn(() => Promise.reject(new Error("agency gate must not run"))) }));
vi.mock("@/server/services/permission.service", () => ({
  checkSiteRole: (...a: unknown[]) => checkSiteRoleMock(...a),
  checkWorkspaceRole: vi.fn(),
  PermissionError: class PermissionError extends Error {
    constructor(public code: "NOT_FOUND" | "FORBIDDEN", message?: string) {
      super(message ?? code);
      this.name = "PermissionError";
    }
  },
}));
vi.mock("@/server/services/theme.service", () => ({
  listBrandRestorePoints: (...a: unknown[]) => listBrandRestorePointsMock(...a),
  createBrandRestorePoint: (...a: unknown[]) => createBrandRestorePointMock(...a),
  getBrandRestorePoint: (...a: unknown[]) => getBrandRestorePointMock(...a),
  ThemeError: class ThemeError extends Error {},
}));

import { themeRouter } from "@/server/trpc/routers/theme";
import { PermissionError } from "@/server/services/permission.service";

const caller = () => themeRouter.createCaller({ session: { user: { id: "u_1" } }, prisma: {} } as never);

beforeEach(() => {
  checkSiteRoleMock.mockReset();
  listBrandRestorePointsMock.mockReset();
  createBrandRestorePointMock.mockReset();
  getBrandRestorePointMock.mockReset();
});

describe("theme.brandRestorePoints", () => {
  it("returns the restore points for an editor, without the agency layer", async () => {
    checkSiteRoleMock.mockResolvedValueOnce(undefined);
    listBrandRestorePointsMock.mockResolvedValueOnce([{ id: "a", reason: "generator", createdAt: new Date(1) }]);
    await expect(caller().brandRestorePoints({ siteId: "s1" })).resolves.toHaveLength(1);
    expect(checkSiteRoleMock.mock.calls[0].slice(1)).toEqual(["u_1", "s1", "EDITOR"]);
  });

  it("refuses a VIEWER as FORBIDDEN and never lists", async () => {
    checkSiteRoleMock.mockRejectedValueOnce(new PermissionError("FORBIDDEN", "viewer"));
    await expect(caller().brandRestorePoints({ siteId: "s1" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(listBrandRestorePointsMock).not.toHaveBeenCalled();
  });
});

describe("theme.createBrandRestorePoint / brandRestorePoint (spec test 27)", () => {
  const input = { siteId: "s1", reason: "generator" as const, designTokens: [], darkMode: "off" as const };

  it("lets an editor create and read, with no agency gate", async () => {
    checkSiteRoleMock.mockResolvedValue(undefined);
    createBrandRestorePointMock.mockResolvedValueOnce({ id: "r1", createdAt: new Date(1) });
    getBrandRestorePointMock.mockResolvedValueOnce({ id: "r1", designTokens: [], tokensSchemaVersion: 6, darkMode: "off" });
    await expect(caller().createBrandRestorePoint(input)).resolves.toMatchObject({ id: "r1" });
    await expect(caller().brandRestorePoint({ siteId: "s1", id: "r1" })).resolves.toMatchObject({ id: "r1" });
    expect(checkSiteRoleMock.mock.calls.every((c) => c[3] === "EDITOR")).toBe(true);
  });

  it("refuses a VIEWER before the service is reached", async () => {
    checkSiteRoleMock.mockRejectedValue(new PermissionError("FORBIDDEN", "viewer"));
    await expect(caller().createBrandRestorePoint(input)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller().brandRestorePoint({ siteId: "s1", id: "r1" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(createBrandRestorePointMock).not.toHaveBeenCalled();
    expect(getBrandRestorePointMock).not.toHaveBeenCalled();
  });

  it("refuses server-only reasons at the schema", async () => {
    checkSiteRoleMock.mockResolvedValue(undefined);
    await expect(caller().createBrandRestorePoint({ ...input, reason: "migration" as never })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
