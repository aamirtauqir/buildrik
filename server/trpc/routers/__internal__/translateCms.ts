import { TRPCError } from "@trpc/server";
import { CmsError } from "@/server/services/cms.service";

/**
 * Map a `CmsError` to a tRPC error. CONFLICT and GONE are not part of tRPC's
 * TRPCErrorCode union, so both translate to BAD_REQUEST — but the message gets
 * a `CMS_CONFLICT:` / `CMS_GONE:` prefix so the client sync layer
 * (`cmsSync.classify`) can branch on the discriminator. INVALID (the shared
 * validator refused the write, DM-09) is `CMS_INVALID:` + the reason. Without the prefix,
 * classify never matches and stale CONFLICTs retry forever while stale GONE
 * writes resurrect tombstoned rows (P0-A audit 2026-09-30).
 *
 * Extracted to its own module so it can be unit-tested without pulling the
 * NextAuth / Next-server module graph through the router file.
 */
export function translateCms(e: unknown): never {
  if (e instanceof CmsError) {
    const code: TRPCError["code"] =
      e.code === "CONFLICT" || e.code === "GONE" || e.code === "INVALID" ? "BAD_REQUEST" :
      e.code;
    const prefix =
      e.code === "CONFLICT" ? "CMS_CONFLICT:" :
      e.code === "GONE" ? "CMS_GONE:" :
      e.code === "INVALID" ? "CMS_INVALID:" :
      "";
    throw new TRPCError({ code, message: prefix + e.message });
  }
  throw e;
}
