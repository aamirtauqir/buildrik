/**
 * theme.extractBrandFromUrl — behind dsAi, site EDITOR only, rate limited per
 * user and per workspace, and a BrandExtractError reaches the editor as
 * BAD_REQUEST with its code first (spec §9, test 28).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const checkSiteRoleMock = vi.fn();
const checkRateLimitMock = vi.fn();
const extractMock = vi.fn();

vi.mock("@/server/auth", () => ({ auth: vi.fn().mockResolvedValue(null) }));
vi.mock("@/server/services/api-token.service", () => ({ extractBearer: () => null, verifyApiToken: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: () => Promise.resolve({ get: () => undefined, delete: vi.fn() }) }));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/server/trpc/guards", () => ({ requireAgencyLayer: vi.fn(() => Promise.reject(new Error("agency gate must not run"))) }));
vi.mock("@/server/trpc/workspace-ctx", () => ({ resolveWorkspaceId: async () => "w1" }));
vi.mock("@/server/services/rate-limiter", () => ({ checkRateLimit: (...a: unknown[]) => checkRateLimitMock(...a) }));
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
vi.mock("@/server/services/theme.service", () => ({ ThemeError: class ThemeError extends Error {} }));
vi.mock("@/server/services/brand-extract.service", () => ({
  extractBrandFromUrl: (...a: unknown[]) => extractMock(...a),
  BrandExtractError: class BrandExtractError extends Error {
    constructor(public code: string, m: string) {
      super(m);
    }
  },
}));

import { themeRouter } from "@/server/trpc/routers/theme";
import { PermissionError } from "@/server/services/permission.service";
import { BrandExtractError as BrandExtractErrorMock } from "@/server/services/brand-extract.service";

const caller = () => themeRouter.createCaller({ session: { user: { id: "u_1" } }, prisma: {} } as never);

beforeEach(() => {
  checkSiteRoleMock.mockReset();
  checkRateLimitMock.mockReset();
  extractMock.mockReset();
});
afterEach(() => vi.unstubAllEnvs());

describe("theme.extractBrandFromUrl", () => {
  it("is NOT_FOUND unless the dsAi flag is on", async () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_DS_AI", "");
    await expect(caller().extractBrandFromUrl({ siteId: "s1", url: "https://acme.test" })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("refuses a VIEWER, then rate-limits per user and per workspace (spec test 28)", async () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_DS_AI", "true");
    checkSiteRoleMock.mockRejectedValueOnce(new PermissionError("FORBIDDEN", "viewer"));
    await expect(caller().extractBrandFromUrl({ siteId: "s1", url: "https://acme.test" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    checkSiteRoleMock.mockResolvedValue(undefined);
    checkRateLimitMock.mockResolvedValueOnce({ allowed: true }).mockResolvedValueOnce({ allowed: false });
    await expect(caller().extractBrandFromUrl({ siteId: "s1", url: "https://acme.test" })).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    expect(checkRateLimitMock.mock.calls.map((c) => c[0])).toEqual(["brand-extract:user:u_1", "brand-extract:ws:w1"]);
    expect(extractMock).not.toHaveBeenCalled();
  });

  it("translates a BrandExtractError to BAD_REQUEST with the code first", async () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_DS_AI", "true");
    checkSiteRoleMock.mockResolvedValue(undefined);
    checkRateLimitMock.mockResolvedValue({ allowed: true });
    extractMock.mockRejectedValueOnce(new BrandExtractErrorMock("TIMEOUT", "That site took too long to answer"));
    await expect(caller().extractBrandFromUrl({ siteId: "s1", url: "https://acme.test" }))
      .rejects.toMatchObject({ code: "BAD_REQUEST", message: "TIMEOUT: That site took too long to answer" });
  });
});
