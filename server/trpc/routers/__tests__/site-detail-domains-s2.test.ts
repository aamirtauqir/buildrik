/**
 * siteDetail.domains — the S2 surface (Clone 3397:32206, 3737:43669).
 *
 * `connect` forwards the dialog's type / provider / Force HTTPS to the
 * service; `checkAvailability` is a signed-in read with no site gate;
 * `update` is ADMIN on the row's own site like `remove`, NOT_FOUND for an
 * unknown row, and the service is never reached when the gate refuses.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const checkSiteRoleMock = vi.fn();
const connectDomainMock = vi.fn();
const checkAvailabilityMock = vi.fn();
const updateDomainMock = vi.fn();
const recordForSiteMock = vi.fn();
const domainFindUnique = vi.fn();
const checkDnsMock = vi.fn();

vi.mock("@/server/auth", () => ({ auth: vi.fn().mockResolvedValue(null) }));
vi.mock("@/server/services/api-token.service", () => ({
  extractBearer: () => null,
  verifyApiToken: vi.fn(),
}));
vi.mock("next/headers", () => ({
  cookies: () => Promise.resolve({ get: () => undefined, delete: vi.fn() }),
}));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/server/services/permission.service", () => ({
  assertSiteAccess: vi.fn(),
  checkSiteRole: (...a: unknown[]) => checkSiteRoleMock(...a),
  PermissionError: class PermissionError extends Error {
    constructor(public code: "NOT_FOUND" | "FORBIDDEN", message?: string) {
      super(message ?? code);
      this.name = "PermissionError";
    }
  },
}));
vi.mock("@/server/services/domain.service", () => ({
  checkDomainDns: (...a: unknown[]) => checkDnsMock(...a),
  listDomains: vi.fn(),
  connectDomain: (...a: unknown[]) => connectDomainMock(...a),
  removeDomain: vi.fn(),
  setPrimaryDomain: vi.fn(),
  listWorkspaceDomains: vi.fn(),
  checkDomainAvailability: (...a: unknown[]) => checkAvailabilityMock(...a),
  updateDomain: (...a: unknown[]) => updateDomainMock(...a),
}));
vi.mock("@/server/services/activity-log.service", () => ({
  recordForSite: (...a: unknown[]) => recordForSiteMock(...a),
}));

import { siteDetailRouter } from "@/server/trpc/routers/site-detail";
import { PermissionError } from "@/server/services/permission.service";

const prisma = { domain: { findUnique: domainFindUnique } };
function caller() {
  return siteDetailRouter.createCaller({ session: { user: { id: "u_1" } }, prisma } as never);
}

beforeEach(() => {
  [checkSiteRoleMock, checkDnsMock, connectDomainMock, checkAvailabilityMock, updateDomainMock, recordForSiteMock, domainFindUnique].forEach((m) =>
    m.mockReset(),
  );
  recordForSiteMock.mockResolvedValue(undefined);
});

describe("siteDetail.domains.connect", () => {
  it("forwards kind, dnsProvider and forceHttps to the service", async () => {
    checkSiteRoleMock.mockResolvedValueOnce(undefined);
    connectDomainMock.mockResolvedValueOnce({ id: "dom1", domain: "bellacucina.com" });

    await caller().domains.connect({
      siteId: "s1",
      domain: "bellacucina.com",
      kind: "SUBDOMAIN",
      dnsProvider: "cloudflare",
      forceHttps: false,
    });

    expect(checkSiteRoleMock).toHaveBeenCalledWith(prisma, "u_1", "s1", "ADMIN");
    expect(connectDomainMock).toHaveBeenCalledWith("s1", {
      domain: "bellacucina.com",
      kind: "SUBDOMAIN",
      dnsProvider: "cloudflare",
      forceHttps: false,
    });
  });

  it("rejects a kind the schema does not know before touching access", async () => {
    await expect(
      caller().domains.connect({ siteId: "s1", domain: "bellacucina.com", kind: "ALIAS" } as never),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(checkSiteRoleMock).not.toHaveBeenCalled();
  });
});

describe("siteDetail.domains.checkAvailability", () => {
  it("returns the service's answer for a signed-in caller", async () => {
    checkAvailabilityMock.mockResolvedValueOnce({ available: false, reason: "connected" });
    await expect(caller().domains.checkAvailability({ domain: "bellacucina.com" })).resolves.toEqual({
      available: false,
      reason: "connected",
    });
    expect(checkAvailabilityMock).toHaveBeenCalledWith("bellacucina.com");
  });
});

describe("siteDetail.domains.update", () => {
  it("is ADMIN on the row's site and writes the flag", async () => {
    domainFindUnique.mockResolvedValueOnce({ siteId: "s1" });
    checkSiteRoleMock.mockResolvedValueOnce(undefined);
    updateDomainMock.mockResolvedValueOnce({ id: "dom1", forceHttps: false });

    await expect(caller().domains.update({ id: "dom1", forceHttps: false })).resolves.toEqual({ id: "dom1", forceHttps: false });

    expect(checkSiteRoleMock).toHaveBeenCalledWith(prisma, "u_1", "s1", "ADMIN");
    expect(updateDomainMock).toHaveBeenCalledWith("dom1", { forceHttps: false });
  });

  it("is NOT_FOUND for an unknown row and never reaches the gate or the service", async () => {
    domainFindUnique.mockResolvedValueOnce(null);
    await expect(caller().domains.update({ id: "missing", forceHttps: true })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(checkSiteRoleMock).not.toHaveBeenCalled();
    expect(updateDomainMock).not.toHaveBeenCalled();
  });

  it("is FORBIDDEN for an editor and never reaches the service", async () => {
    domainFindUnique.mockResolvedValueOnce({ siteId: "s1" });
    checkSiteRoleMock.mockRejectedValueOnce(new PermissionError("FORBIDDEN"));
    await expect(caller().domains.update({ id: "dom1", forceHttps: true })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(updateDomainMock).not.toHaveBeenCalled();
  });
});

/* `check` rewrites DnsRecord.verified + Domain.status — a write, so VIEWER is
   refused and the service is never reached (audit 2026-09-24). */
describe("siteDetail.domains.check", () => {
  it("VIEWER → FORBIDDEN, service untouched", async () => {
    checkSiteRoleMock.mockRejectedValueOnce(new PermissionError("FORBIDDEN", "Insufficient permissions"));
    await expect(caller().domains.check({ id: "dom1", siteId: "s1" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(checkDnsMock).not.toHaveBeenCalled();
  });

  it("EDITOR → runs the check bound to the gated site", async () => {
    checkSiteRoleMock.mockResolvedValueOnce(undefined);
    checkDnsMock.mockResolvedValueOnce({ id: "dom1", siteId: "s1", status: "VERIFIED" });
    await expect(caller().domains.check({ id: "dom1", siteId: "s1" })).resolves.toMatchObject({ status: "VERIFIED" });
    expect(checkSiteRoleMock).toHaveBeenCalledWith(prisma, "u_1", "s1", "EDITOR");
    expect(checkDnsMock).toHaveBeenCalledWith("dom1", "s1");
  });
});
