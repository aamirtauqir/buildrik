/**
 * siteDetail.redirects — the S3 surface (Clone 4254:75736 Add redirect,
 * 4254:75747 Edit redirect, 3397:32517 the 404 suggester).
 *
 * `create` / `update` carry the dialog's `matchQuery` + `notes` to the
 * service; a second rule for the same path is the service's REDIRECT_EXISTS,
 * surfaced as CONFLICT with the copy the dialog shows inline;
 * `suggestions` is a read gated like `list`, and the service is never reached
 * when the gate refuses.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const assertSiteAccessMock = vi.fn();
const checkSiteRoleMock = vi.fn();
const createRedirectMock = vi.fn();
const updateRedirectMock = vi.fn();
const listRedirectsMock = vi.fn();
const getRedirectSuggestionsMock = vi.fn();
const redirectFindUnique = vi.fn();
const memberFindFirst = vi.fn();

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
  assertSiteAccess: (...a: unknown[]) => assertSiteAccessMock(...a),
  checkSiteRole: (...a: unknown[]) => checkSiteRoleMock(...a),
  PermissionError: class PermissionError extends Error {
    constructor(public code: "NOT_FOUND" | "FORBIDDEN", message?: string) {
      super(message ?? code);
      this.name = "PermissionError";
    }
  },
}));
vi.mock("@/server/services/redirect.service", () => ({
  listRedirects: (...a: unknown[]) => listRedirectsMock(...a),
  createRedirect: (...a: unknown[]) => createRedirectMock(...a),
  updateRedirect: (...a: unknown[]) => updateRedirectMock(...a),
  deleteRedirect: vi.fn(),
  importRedirects: vi.fn(),
  exportRedirects: vi.fn(),
}));
vi.mock("@/server/services/site-detail.service", () => ({
  getSiteOverview: vi.fn(),
  getSettingsOverview: vi.fn(),
  getLocales: vi.fn(),
  getRedirectSuggestions: (...a: unknown[]) => getRedirectSuggestionsMock(...a),
}));

import { siteDetailRouter } from "@/server/trpc/routers/site-detail";
import { PermissionError } from "@/server/services/permission.service";

const prisma = {
  redirect: { findUnique: redirectFindUnique },
  workspaceMember: { findFirst: memberFindFirst },
};
function caller() {
  return siteDetailRouter.createCaller({ session: { user: { id: "u_1" } }, prisma } as never);
}

beforeEach(() => {
  [
    assertSiteAccessMock, checkSiteRoleMock, createRedirectMock, updateRedirectMock,
    listRedirectsMock, getRedirectSuggestionsMock, redirectFindUnique, memberFindFirst,
  ].forEach((m) => m.mockReset());
  memberFindFirst.mockResolvedValue({ workspace: { plan: "PRO" } });
});

describe("siteDetail.redirects.create", () => {
  it("forwards matchQuery and notes to the service with the workspace plan", async () => {
    checkSiteRoleMock.mockResolvedValueOnce(undefined);
    createRedirectMock.mockResolvedValueOnce({ id: "r1" });

    await caller().redirects.create({
      siteId: "s1",
      fromPath: "/old-menu",
      toUrl: "/menu",
      type: "301",
      matchQuery: true,
      notes: "Old menu page retired in March",
    });

    expect(checkSiteRoleMock).toHaveBeenCalledWith(prisma, "u_1", "s1", "EDITOR");
    expect(createRedirectMock).toHaveBeenCalledWith(
      "s1",
      { fromPath: "/old-menu", toUrl: "/menu", type: "301", matchQuery: true, notes: "Old menu page retired in March" },
      "PRO",
    );
  });

  it("still accepts the older callers' four fields", async () => {
    checkSiteRoleMock.mockResolvedValueOnce(undefined);
    createRedirectMock.mockResolvedValueOnce({ id: "r1" });

    await caller().redirects.create({ siteId: "s1", fromPath: "/a", toUrl: "https://example.com/b", type: "302" });

    expect(createRedirectMock).toHaveBeenCalledWith("s1", { fromPath: "/a", toUrl: "https://example.com/b", type: "302" }, "PRO");
  });

  it("is CONFLICT with the dialog's copy when the path already has a rule", async () => {
    checkSiteRoleMock.mockResolvedValueOnce(undefined);
    createRedirectMock.mockRejectedValueOnce(new Error("REDIRECT_EXISTS"));

    await expect(
      caller().redirects.create({ siteId: "s1", fromPath: "/old-menu", toUrl: "/menu", type: "301" }),
    ).rejects.toMatchObject({ code: "CONFLICT", message: "A redirect from /old-menu already exists." });
  });

  it("refuses a To URL that is neither a path nor an http(s) URL before touching access", async () => {
    await expect(
      caller().redirects.create({ siteId: "s1", fromPath: "/old", toUrl: "new-page", type: "301" }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      caller().redirects.create({ siteId: "s1", fromPath: "/old", toUrl: "//evil.example", type: "301" }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(checkSiteRoleMock).not.toHaveBeenCalled();
  });

  it("is FORBIDDEN for a viewer and never reaches the service", async () => {
    checkSiteRoleMock.mockRejectedValueOnce(new PermissionError("FORBIDDEN"));
    await expect(
      caller().redirects.create({ siteId: "s1", fromPath: "/a", toUrl: "/b", type: "301" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(createRedirectMock).not.toHaveBeenCalled();
  });
});

describe("siteDetail.redirects.update", () => {
  it("passes the row's own site and the widened fields to the service", async () => {
    redirectFindUnique.mockResolvedValueOnce({ siteId: "s1" });
    checkSiteRoleMock.mockResolvedValueOnce(undefined);
    updateRedirectMock.mockResolvedValueOnce({ id: "r1" });

    await caller().redirects.update({ id: "r1", type: "302", matchQuery: false, notes: null });

    expect(checkSiteRoleMock).toHaveBeenCalledWith(prisma, "u_1", "s1", "EDITOR");
    expect(updateRedirectMock).toHaveBeenCalledWith("r1", "s1", { type: "302", matchQuery: false, notes: null });
  });

  it("is CONFLICT when the rename lands on another rule's path", async () => {
    redirectFindUnique.mockResolvedValueOnce({ siteId: "s1" });
    checkSiteRoleMock.mockResolvedValueOnce(undefined);
    updateRedirectMock.mockRejectedValueOnce(new Error("REDIRECT_EXISTS"));

    await expect(caller().redirects.update({ id: "r1", fromPath: "/about-us" })).rejects.toMatchObject({
      code: "CONFLICT",
      message: "A redirect from /about-us already exists.",
    });
  });

  it("is NOT_FOUND for an unknown row and never checks the role", async () => {
    redirectFindUnique.mockResolvedValueOnce(null);
    await expect(caller().redirects.update({ id: "nope", notes: "x" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(checkSiteRoleMock).not.toHaveBeenCalled();
  });
});

describe("siteDetail.redirects.suggestions", () => {
  it("returns the service's rows for a member of the site's workspace", async () => {
    assertSiteAccessMock.mockResolvedValueOnce(undefined);
    const rows = [{ fromPath: "/pizza-menu", toUrl: "/menu", pageId: "p1", pageName: "Menu", changedAt: "2026-09-12T10:00:00.000Z" }];
    getRedirectSuggestionsMock.mockResolvedValueOnce(rows);

    await expect(caller().redirects.suggestions({ siteId: "s1" })).resolves.toEqual(rows);

    expect(assertSiteAccessMock).toHaveBeenCalledWith(prisma, "u_1", "s1");
    expect(getRedirectSuggestionsMock).toHaveBeenCalledWith("s1");
  });

  it("is FORBIDDEN for a non-member and never reaches the service", async () => {
    assertSiteAccessMock.mockRejectedValueOnce(new PermissionError("FORBIDDEN"));
    await expect(caller().redirects.suggestions({ siteId: "s1" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(getRedirectSuggestionsMock).not.toHaveBeenCalled();
  });

  it("is NOT_FOUND for an unknown site", async () => {
    assertSiteAccessMock.mockRejectedValueOnce(new PermissionError("NOT_FOUND"));
    await expect(caller().redirects.suggestions({ siteId: "missing" })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
