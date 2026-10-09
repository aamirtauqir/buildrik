/**
 * cms router — what the public tRPC surface must NOT offer.
 *
 * EDT-022: `cms.generateDynamicPages` rendered and sanitized one page per
 * published record for any VIEWER, with a 2 MB template, no rate limit and no
 * UI caller. Publish calls the service function directly, so the procedure
 * is gone.
 *
 * EDT-021: `_skipTouchCmsEdited` sat in the transport schema, so an EDITOR
 * could write a record without moving `site.cmsEditedAt` — an APPROVED site
 * stayed "fresh" and the changed content published without APPROVAL_STALE.
 * Only the CSV importer may skip the per-row bump, through a service option.
 */
import { describe, it, expect, vi } from "vitest";

const upsertEntryMock = vi.hoisted(() => vi.fn());

vi.mock("@/server/auth", () => ({ auth: vi.fn().mockResolvedValue(null) }));
vi.mock("@/server/services/api-token.service", () => ({
  extractBearer: () => null,
  verifyApiToken: vi.fn(),
}));
vi.mock("next/headers", () => ({
  cookies: () => Promise.resolve({ get: () => undefined, delete: vi.fn() }),
}));
vi.mock("@/server/services/permission.service", () => ({
  assertSiteAccess: vi.fn(),
  checkSiteRole: vi.fn(),
  PermissionError: class PermissionError extends Error {},
}));
vi.mock("@/server/services/cms.service", async () => {
  const actual = await vi.importActual<typeof import("@/server/services/cms.service")>("@/server/services/cms.service");
  return { ...actual, upsertEntry: upsertEntryMock };
});
vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import { cmsRouter } from "@/server/trpc/routers/cms";
import { upsertEntryInput } from "@buildrik/shared/schemas/cms";

describe("cms router — public surface", () => {
  it("does not expose generateDynamicPages (EDT-022)", () => {
    expect(Object.keys(cmsRouter._def.procedures)).not.toContain("generateDynamicPages");
  });
});

describe("cms router — entries.upsert cannot skip the cmsEditedAt bump (EDT-021)", () => {
  const raw = { siteId: "s1", collectionId: "c1", data: { title: "x" }, _skipTouchCmsEdited: true };

  it("the transport schema strips the internal flag", () => {
    expect(upsertEntryInput.parse(raw)).not.toHaveProperty("_skipTouchCmsEdited");
  });

  it("the router hands the service no skip option", async () => {
    upsertEntryMock.mockResolvedValueOnce({ id: "e1" });
    const caller = cmsRouter.createCaller({ session: { user: { id: "u_1" } }, prisma: {} } as never);
    await caller.entries.upsert(raw as never);
    expect(upsertEntryMock).toHaveBeenCalledOnce();
    const args = upsertEntryMock.mock.calls[0];
    expect(args[1]).not.toHaveProperty("_skipTouchCmsEdited");
    expect(args[2]?.skipTouchCmsEdited).not.toBe(true);
  });
});
