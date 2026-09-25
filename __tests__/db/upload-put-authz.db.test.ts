/**
 * S-3 (P0-3, A19-3 / A19-20) — the presign is no longer the only write gate.
 *
 * The presign role check landed in 2c7b7698c. What stayed open: the PUT route
 * re-checked only that the caller was the presigning user, so a role revoked
 * inside the 10-minute TTL still wrote; keys were fixed and overwritable
 * (`sites/<id>/favicon.png`, `allowOverwrite: true`); `fileName` went into the
 * key raw; and a siteId was stored for contexts that have no site.
 *
 * Real Postgres rows for the role decision. `@vercel/blob` is mocked — there
 * is no Blob store locally, so the live overwrite behaviour is NOT exercised
 * here; the assertions are on what the route asks Blob to do.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

const putMock = vi.fn();
vi.mock("@vercel/blob", () => ({ put: (...a: unknown[]) => putMock(...a) }));

let sessionUserId: string | null = null;
vi.mock("@server/auth", () => ({
  auth: async () => (sessionUserId ? { user: { id: sessionUserId } } : null),
}));

import { prisma } from "@/lib/prisma";
import { createPresignedUrl } from "@/server/services/upload.service";
import { PUT } from "@/packages/dashboard/app/api/upload/[fileId]/route";
import {
  createTestUser,
  createTestWorkspace,
  createTestWorkspaceMember,
  createTestSite,
  truncateTables,
} from "./helpers";

function putRequest(fileId: string, type: string, bytes = 16): [NextRequest, { params: Promise<{ fileId: string }> }] {
  const req = new NextRequest(`http://localhost/api/upload/${fileId}`, {
    method: "PUT",
    headers: { "content-type": type },
    body: new Uint8Array(bytes),
  });
  return [req, { params: Promise.resolve({ fileId }) }];
}

async function adminOnSite() {
  const user = await createTestUser();
  const ws = await createTestWorkspace({ ownerId: user.id });
  const member = await createTestWorkspaceMember({ userId: user.id, workspaceId: ws.id, role: "ADMIN" });
  const site = await createTestSite({ workspaceId: ws.id, createdBy: user.id });
  return { user, ws, member, site };
}

beforeEach(async () => {
  await truncateTables("pendingUpload", "sitePermission", "site", "workspaceMember", "workspace", "user");
  putMock.mockReset();
  putMock.mockImplementation(async (pathname: string) => ({
    url: `https://store.public.blob.vercel-storage.com/${pathname}-Rnd123`,
  }));
  sessionUserId = null;
});

describe("PUT /api/upload/[fileId] — S-3", () => {
  it("refuses the write when the role was revoked between presign and PUT", async () => {
    const { user, ws, member, site } = await adminOnSite();
    const { fileId } = await createPresignedUrl(
      { fileName: "fav.png", fileType: "image/png", context: "favicon", siteId: site.id },
      user.id,
      ws.id,
    );
    await prisma.workspaceMember.update({ where: { id: member.id }, data: { role: "EDITOR" } });

    sessionUserId = user.id;
    const res = await PUT(...putRequest(fileId, "image/png"));

    expect(res.status).toBe(403);
    expect(putMock).not.toHaveBeenCalled();
  });

  it("writes with a random suffix and never overwrites", async () => {
    const { user, ws, site } = await adminOnSite();
    const { fileId } = await createPresignedUrl(
      { fileName: "fav.png", fileType: "image/png", context: "favicon", siteId: site.id },
      user.id,
      ws.id,
    );

    sessionUserId = user.id;
    const res = await PUT(...putRequest(fileId, "image/png"));

    expect(res.status).toBe(200);
    expect(putMock).toHaveBeenCalledTimes(1);
    const [pathname, , opts] = putMock.mock.calls[0] as [string, unknown, Record<string, unknown>];
    expect(pathname).toBe(`sites/${site.id}/favicon.png`);
    expect(opts.addRandomSuffix).toBe(true);
    expect(opts.allowOverwrite).toBeUndefined();
  });

  it("neutralises a path-traversal fileName", async () => {
    const { user, ws, site } = await adminOnSite();
    const { fileId } = await createPresignedUrl(
      { fileName: "../../sites/victim/favicon.png", fileType: "image/png", context: "site_media", siteId: site.id },
      user.id,
      ws.id,
    );

    sessionUserId = user.id;
    const res = await PUT(...putRequest(fileId, "image/png"));

    expect(res.status).toBe(200);
    const [pathname] = putMock.mock.calls[0] as [string];
    expect(pathname).toBe(`media/${ws.id}/favicon.png`);
    expect(pathname).not.toContain("..");
  });
});

describe("createPresignedUrl — S-3 siteId only for site contexts", () => {
  it.each(["avatar", "workspace_icon", "ticket"] as const)("rejects a siteId on %s", async (context) => {
    const { user, ws, site } = await adminOnSite();
    await expect(
      createPresignedUrl({ fileName: "a.png", fileType: "image/png", context, siteId: site.id }, user.id, ws.id),
    ).rejects.toThrow("SITE_NOT_ALLOWED");
    expect(await prisma.pendingUpload.count()).toBe(0);
  });
});
