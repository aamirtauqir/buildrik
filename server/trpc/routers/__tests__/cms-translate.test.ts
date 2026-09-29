import { describe, expect, it } from "vitest";
import { TRPCError } from "@trpc/server";
import { translateCms } from "@/server/trpc/routers/__internal__/translateCms";
import { CmsError } from "@/server/services/cms.service";

/**
 * cmsRouter.translateCms — round-trip test (P0-A audit 2026-09-30).
 *
 * Before this fix, `translateCms` mapped CONFLICT/GONE to tRPC BAD_REQUEST but
 * dropped the discriminator. The client sync layer (`cmsSync.classify`) string-
 * matches the message prefix to branch — without the prefix, classify never
 * matched, and a stale CONFLICT retried forever while a GONE write resurrected
 * a tombstoned row.
 */
describe("cmsRouter.translateCms", () => {
  it("prepends CMS_CONFLICT: to CONFLICT CmsError messages", () => {
    let caught: unknown;
    try {
      translateCms(new CmsError("CONFLICT", "2026-09-30T10:00:00.000Z"));
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(TRPCError);
    const trpcErr = caught as TRPCError;
    expect(trpcErr.code).toBe("BAD_REQUEST");
    expect(trpcErr.message).toMatch(/^CMS_CONFLICT:2026-09-30T10:00:00\.000Z$/);
  });

  it("prepends CMS_GONE: to GONE CmsError messages", () => {
    let caught: unknown;
    try {
      translateCms(new CmsError("GONE", "This record was deleted."));
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(TRPCError);
    const trpcErr = caught as TRPCError;
    expect(trpcErr.code).toBe("BAD_REQUEST");
    expect(trpcErr.message).toMatch(/^CMS_GONE:This record was deleted\.$/);
  });

  it("preserves NOT_FOUND as a tRPC error", () => {
    let caught: unknown;
    try {
      translateCms(new CmsError("NOT_FOUND", "Collection not found"));
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(TRPCError);
    const trpcErr = caught as TRPCError;
    expect(trpcErr.code).toBe("NOT_FOUND");
    expect(trpcErr.message).toBe("Collection not found");
  });

  it("re-throws non-CmsError as-is", () => {
    const other = new Error("boom");
    expect(() => translateCms(other)).toThrow(other);
  });
});
