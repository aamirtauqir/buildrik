/**
 * sites.publishedSnapshot — the pages one published version shipped, for the
 * editor's Compare (post-Oct-1 R3). EDITOR-gated like publishHistory; an
 * unknown or non-completed job is NOT_FOUND; a pruned payload is null.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const checkSiteRoleMock = vi.fn();
const getPublishedSnapshotMock = vi.fn();

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
vi.mock("@/server/services/sites.service", () => ({}));
vi.mock("@/server/services/folder.service", () => ({}));
vi.mock("@/server/services/publish.service", () => ({
  getPublishedSnapshot: (...a: unknown[]) => getPublishedSnapshotMock(...a),
}));
vi.mock("@/server/services/activity-log.service", () => ({ recordForSite: vi.fn() }));
vi.mock("@/server/services/template.service", () => ({}));
vi.mock("@/server/services/ai-generation.service", () => ({}));

import { sitesRouter } from "@/server/trpc/routers/sites";
import { PermissionError } from "@/server/services/permission.service";

const prisma = {};
const caller = () => sitesRouter.createCaller({ session: { user: { id: "u_1" } }, prisma } as never);

beforeEach(() => {
  checkSiteRoleMock.mockReset();
  getPublishedSnapshotMock.mockReset();
});

describe("sites.publishedSnapshot", () => {
  it("returns the version's pages for an EDITOR of the site", async () => {
    checkSiteRoleMock.mockResolvedValueOnce(undefined);
    getPublishedSnapshotMock.mockResolvedValueOnce([{ path: "index.html", html: "<h1>v3</h1>" }]);

    await expect(caller().publishedSnapshot({ siteId: "s1", jobId: "j3" })).resolves.toEqual([
      { path: "index.html", html: "<h1>v3</h1>" },
    ]);
    expect(checkSiteRoleMock).toHaveBeenCalledWith(prisma, "u_1", "s1", "EDITOR");
    expect(getPublishedSnapshotMock).toHaveBeenCalledWith("s1", "j3");
  });

  it("passes a pruned payload through as null", async () => {
    checkSiteRoleMock.mockResolvedValueOnce(undefined);
    getPublishedSnapshotMock.mockResolvedValueOnce(null);
    await expect(caller().publishedSnapshot({ siteId: "s1", jobId: "j1" })).resolves.toBeNull();
  });

  it("is FORBIDDEN below EDITOR and never reads the payload", async () => {
    checkSiteRoleMock.mockRejectedValueOnce(new PermissionError("FORBIDDEN", "Insufficient permissions"));
    await expect(caller().publishedSnapshot({ siteId: "s1", jobId: "j1" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(getPublishedSnapshotMock).not.toHaveBeenCalled();
  });

  it("translates the service's NOT_FOUND", async () => {
    checkSiteRoleMock.mockResolvedValueOnce(undefined);
    getPublishedSnapshotMock.mockRejectedValueOnce(new Error("NOT_FOUND"));
    await expect(caller().publishedSnapshot({ siteId: "s1", jobId: "nope" })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("rejects a missing jobId before touching access", async () => {
    await expect(caller().publishedSnapshot({ siteId: "s1" } as never)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(checkSiteRoleMock).not.toHaveBeenCalled();
  });
});
