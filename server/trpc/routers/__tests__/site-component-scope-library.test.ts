/**
 * siteComponents — scope + FROM LIBRARY at the router: writes are EDITOR+
 * (guardSiteRole), library reads any member (guardSiteAccess), and a foreign
 * page scope is a BAD_REQUEST.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";

const svc = vi.hoisted(() => ({
  upsertSiteComponent: vi.fn(),
  listSiteComponents: vi.fn(),
  getSiteComponent: vi.fn(),
  deleteSiteComponent: vi.fn(),
  listWorkspaceComponents: vi.fn(),
  getComponentUsage: vi.fn(),
  renameWorkspaceComponent: vi.fn(),
  deleteWorkspaceComponent: vi.fn(),
  listComponentLibrary: vi.fn(),
  getLibraryComponent: vi.fn(),
}));
const guards = vi.hoisted(() => ({ guardSiteAccess: vi.fn(), guardSiteRole: vi.fn() }));
vi.mock("@/server/auth", () => ({ auth: vi.fn().mockResolvedValue(null) }));
vi.mock("@/server/services/api-token.service", () => ({ extractBearer: () => null, verifyApiToken: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: () => Promise.resolve({ get: () => undefined, delete: vi.fn() }) }));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/server/services/site-component.service", () => svc);
vi.mock("@/server/trpc/guards", () => guards);
vi.mock("@/server/trpc/workspace-ctx", () => ({ resolveWorkspaceId: vi.fn() }));

import { siteComponentsRouter } from "@/server/trpc/routers/site-component";

const caller = () => siteComponentsRouter.createCaller({ session: { user: { id: "u1" } }, prisma: {} } as never);
const upsertInput = { siteId: "s1", componentId: "c1", name: "Hero", payload: {}, pageId: "p1" };

beforeEach(() => {
  Object.values(svc).forEach((m) => m.mockReset());
  guards.guardSiteAccess.mockReset().mockResolvedValue(undefined);
  guards.guardSiteRole.mockReset().mockResolvedValue(undefined);
});

describe("siteComponents — scope", () => {
  it("VIEWER cannot save a component (EDITOR gate), service untouched", async () => {
    guards.guardSiteRole.mockRejectedValueOnce(new TRPCError({ code: "FORBIDDEN" }));
    await expect(caller().upsert(upsertInput)).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(svc.upsertSiteComponent).not.toHaveBeenCalled();
  });

  it("EDITOR saves with the page scope and the caller stamped", async () => {
    svc.upsertSiteComponent.mockResolvedValueOnce({ componentId: "c1" });
    await caller().upsert(upsertInput);
    expect(svc.upsertSiteComponent).toHaveBeenCalledWith({ ...upsertInput, createdBy: "u1" });
  });

  it("a page of another site → BAD_REQUEST", async () => {
    svc.upsertSiteComponent.mockRejectedValueOnce(new Error("PAGE_NOT_FOUND"));
    await expect(caller().upsert(upsertInput)).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});

describe("siteComponents — FROM LIBRARY", () => {
  it("any member of the site reads it; a non-member is refused before the service", async () => {
    svc.listComponentLibrary.mockResolvedValueOnce([]);
    await expect(caller().library({ siteId: "s1" })).resolves.toEqual([]);
    guards.guardSiteAccess.mockRejectedValueOnce(new TRPCError({ code: "FORBIDDEN" }));
    await expect(caller().libraryGet({ siteId: "s1", componentId: "c" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(svc.getLibraryComponent).not.toHaveBeenCalled();
  });
});
