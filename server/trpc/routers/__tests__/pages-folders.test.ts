/**
 * pages.folders.* — domain errors reach the client as tRPC codes.
 */
import { describe, it, expect, vi } from "vitest";

const svc = vi.hoisted(() => ({
  listPageFolders: vi.fn(),
  createPageFolder: vi.fn(),
  updatePageFolder: vi.fn(),
  deletePageFolder: vi.fn(),
  movePageToFolder: vi.fn(),
}));
vi.mock("@/server/auth", () => ({ auth: vi.fn().mockResolvedValue(null) }));
vi.mock("@/server/services/api-token.service", () => ({ extractBearer: () => null, verifyApiToken: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: () => Promise.resolve({ get: () => undefined, delete: vi.fn() }) }));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/server/services/page-folder.service", () => svc);
vi.mock("@/server/services/page.service", () => ({}));
vi.mock("@/server/services/permission.service", () => ({
  checkSiteRole: vi.fn(),
  PermissionError: class PermissionError extends Error {
    constructor(public code: "NOT_FOUND" | "FORBIDDEN", message?: string) {
      super(message ?? code);
    }
  },
}));

import { pagesRouter } from "@/server/trpc/routers/pages";
import { PermissionError } from "@/server/services/permission.service";

const caller = () => pagesRouter.createCaller({ session: { user: { id: "u1" } }, prisma: {} } as never);

describe("pages.folders", () => {
  it("VIEWER → FORBIDDEN", async () => {
    svc.createPageFolder.mockRejectedValueOnce(new PermissionError("FORBIDDEN", "Insufficient permissions"));
    await expect(caller().folders.create({ siteId: "s1", name: "Legal" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("a folder that is not yours → NOT_FOUND; a foreign page → NOT_FOUND", async () => {
    svc.deletePageFolder.mockRejectedValueOnce(new Error("FOLDER_NOT_FOUND"));
    await expect(caller().folders.delete({ folderId: "f" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    svc.movePageToFolder.mockRejectedValueOnce(new Error("PAGE_NOT_FOUND"));
    await expect(caller().folders.movePage({ siteId: "s1", pageId: "p", folderId: null })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("EDITOR → the service's answer, with the caller's id", async () => {
    svc.listPageFolders.mockResolvedValueOnce([{ id: "f1", name: "A", collapsed: false, pageIds: [] }]);
    await expect(caller().folders.list({ siteId: "s1" })).resolves.toHaveLength(1);
    expect(svc.listPageFolders).toHaveBeenCalledWith("u1", "s1");
  });

  it("rejects an empty update and a blank name before the service", async () => {
    await expect(caller().folders.update({ folderId: "f1" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller().folders.create({ siteId: "s1", name: "   " })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(svc.updatePageFolder).not.toHaveBeenCalled();
  });
});
