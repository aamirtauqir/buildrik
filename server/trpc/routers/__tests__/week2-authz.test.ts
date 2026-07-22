/**
 * Regression: Week-2 authorization gates (app-audit 2026-07-22).
 * Found by /qa. Report: docs/audits/2026-07-22-app-audit-excluding-editor.md
 *
 * Covers the two Critical routers that were mutating/reading without a role gate:
 *  - C1: templates.applyToSite wiped every page of any site for ANY member incl.
 *        VIEWER — now ADMIN. Service must never run when the gate fails.
 *  - C4: templates.get did an unscoped findUnique (cross-tenant IDOR) — the
 *        router must pass the caller's workspaceId to getTemplate for scoping.
 *  - C2: billing.* mutations were member-open — now OWNER. Service must never
 *        run when the gate fails.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod";

const checkSiteRoleMock = vi.fn();
const checkWorkspaceRoleMock = vi.fn();
const applyTemplateToSiteMock = vi.fn();
const getTemplateMock = vi.fn();
const createCheckoutSessionMock = vi.fn();
const cancelSubscriptionMock = vi.fn();

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
  checkSiteRole: (...a: unknown[]) => checkSiteRoleMock(...a),
  checkWorkspaceRole: (...a: unknown[]) => checkWorkspaceRoleMock(...a),
  PermissionError: class PermissionError extends Error {
    code: string;
    constructor(code: string, msg?: string) { super(msg ?? code); this.code = code; }
  },
}));

// Resolve always yields the caller's workspace so we can assert scoping.
vi.mock("@/server/trpc/workspace-ctx", () => ({
  resolveWorkspaceId: vi.fn().mockResolvedValue("ws_1"),
}));

vi.mock("@/server/services/template.service", () => ({
  listTemplates: vi.fn(),
  getTemplate: (...a: unknown[]) => getTemplateMock(...a),
  useTemplate: vi.fn(),
  cloneSiteAsTemplate: vi.fn(),
  applyTemplateToSite: (...a: unknown[]) => applyTemplateToSiteMock(...a),
  TemplateError: class TemplateError extends Error {
    code: string;
    constructor(code: string, msg?: string) { super(msg ?? code); this.code = code; }
  },
}));
vi.mock("@/server/services/ai-generation.service", () => ({
  createGenerationJob: vi.fn(), getJobStatus: vi.fn(), cancelJob: vi.fn(),
}));

vi.mock("@/server/services/billing.service", () => ({
  getBillingOverview: vi.fn(), getUsageDetails: vi.fn(), listInvoices: vi.fn(),
  createCheckoutSession: (...a: unknown[]) => createCheckoutSessionMock(...a),
  createPortalSession: vi.fn(),
  cancelSubscription: (...a: unknown[]) => cancelSubscriptionMock(...a),
  reactivateSubscription: vi.fn(), getPlans: vi.fn(),
}));

// Passthrough schemas so input validation never masks the authz assertion.
vi.mock("@buildrik/shared/schemas/templates", () => {
  const any = z.any();
  return { listTemplatesSchema: any, generateSiteSchema: any, applyTemplateToSiteSchema: any };
});
vi.mock("@buildrik/shared/schemas/billing", () => {
  const any = z.any();
  return { upgradeSchema: any, cancelSchema: any };
});

import { templatesRouter } from "@/server/trpc/routers/templates";
import { billingRouter } from "@/server/trpc/routers/billing";

// Local error class for constructing rejections in test bodies (the mocked
// PermissionError lives inside the hoisted factory and is not importable here).
class PermissionErrorMock extends Error {
  code: string;
  constructor(code: string, msg?: string) { super(msg ?? code); this.code = code; }
}

function makeCtx() {
  return { session: { user: { id: "u_1", workspaceId: "ws_1" } }, prisma: {} as never };
}

beforeEach(() => {
  [checkSiteRoleMock, checkWorkspaceRoleMock, applyTemplateToSiteMock, getTemplateMock,
    createCheckoutSessionMock, cancelSubscriptionMock].forEach((m) => m.mockReset());
});

describe("templates.applyToSite authz (C1)", () => {
  it("non-admin is blocked and the destructive service never runs", async () => {
    checkSiteRoleMock.mockRejectedValueOnce(new PermissionErrorMock("FORBIDDEN", "Insufficient permissions"));
    const caller = templatesRouter.createCaller(makeCtx() as never);
    await expect(caller.applyToSite({ siteId: "s_1", templateId: "t_1" })).rejects.toThrow(/permission|forbidden/i);
    expect(applyTemplateToSiteMock).not.toHaveBeenCalled();
    expect(checkSiteRoleMock).toHaveBeenCalledWith(expect.anything(), "u_1", "s_1", "ADMIN");
  });

  it("admin passes through to the service", async () => {
    checkSiteRoleMock.mockResolvedValueOnce(undefined);
    applyTemplateToSiteMock.mockResolvedValueOnce({ id: "s_1" });
    const caller = templatesRouter.createCaller(makeCtx() as never);
    await caller.applyToSite({ siteId: "s_1", templateId: "t_1" });
    expect(applyTemplateToSiteMock).toHaveBeenCalledOnce();
  });
});

describe("templates.get scoping (C4)", () => {
  it("passes the caller's workspaceId so the read is workspace-scoped", async () => {
    getTemplateMock.mockResolvedValueOnce({ id: "t_1" });
    const caller = templatesRouter.createCaller(makeCtx() as never);
    await caller.get({ id: "t_1" });
    expect(getTemplateMock).toHaveBeenCalledWith("t_1", "ws_1");
  });
});

describe("billing mutations authz (C2)", () => {
  it("createCheckoutSession: non-owner is blocked, service never runs", async () => {
    checkWorkspaceRoleMock.mockRejectedValueOnce(new PermissionErrorMock("FORBIDDEN"));
    const caller = billingRouter.createCaller(makeCtx() as never);
    await expect(caller.createCheckoutSession({ planId: "PRO", interval: "MONTHLY" })).rejects.toThrow();
    expect(createCheckoutSessionMock).not.toHaveBeenCalled();
    expect(checkWorkspaceRoleMock).toHaveBeenCalledWith(expect.anything(), "u_1", "ws_1", "OWNER");
  });

  it("cancel: non-owner is blocked, service never runs", async () => {
    checkWorkspaceRoleMock.mockRejectedValueOnce(new PermissionErrorMock("FORBIDDEN"));
    const caller = billingRouter.createCaller(makeCtx() as never);
    await expect(caller.cancel({ reason: "x" })).rejects.toThrow();
    expect(cancelSubscriptionMock).not.toHaveBeenCalled();
  });

  it("createCheckoutSession: owner passes through", async () => {
    checkWorkspaceRoleMock.mockResolvedValueOnce(undefined);
    createCheckoutSessionMock.mockResolvedValueOnce({ url: "https://stripe" });
    const caller = billingRouter.createCaller(makeCtx() as never);
    await caller.createCheckoutSession({ planId: "PRO", interval: "MONTHLY" });
    expect(createCheckoutSessionMock).toHaveBeenCalledOnce();
  });
});
