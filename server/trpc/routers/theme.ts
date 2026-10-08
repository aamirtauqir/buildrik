import { TRPCError } from "@trpc/server";
import { requireAgencyLayer } from "@/server/trpc/guards";
import { protectedProcedure, router } from "../trpc";
import { resolveWorkspaceId } from "@/server/trpc/workspace-ctx";
import { checkRateLimit } from "@/server/services/rate-limiter";
import { extractBrandFromUrl, BrandExtractError } from "@/server/services/brand-extract.service";
import { isFeatureEnabled } from "@/server/services/feature-flag.service";
import {
  checkSiteRole,
  checkWorkspaceRole,
  PermissionError,
} from "@/server/services/permission.service";
import {
  getSharedTheme,
  captureSharedTheme,
  listThemeTargets,
  setSiteThemeLock,
  pushSharedTheme,
  previewSharedThemePush,
  rollbackSiteTheme,
  listSiteThemeSnapshots,
  listBrandRestorePoints,
  createBrandRestorePoint,
  getBrandRestorePoint,
  saveWorkspacePreset,
  listWorkspacePresets,
  deleteWorkspacePreset,
  applyWorkspacePreset,
  ThemeError,
} from "@/server/services/theme.service";
import {
  captureSharedThemeInput,
  pushSharedThemeInput,
  setSiteThemeLockInput,
  createBrandRestorePointInput,
  brandRestorePointInput,
  extractBrandFromUrlInput,
  previewSharedThemeInput,
  siteThemeSnapshotInput,
  saveWorkspacePresetInput,
  workspacePresetIdInput,
} from "@buildrik/shared/schemas/theme";

// Shared-theme push is part of the agency layer — gated behind the E0
// `agency_layer` flag (runtime kill-switch), same as clients/reviews.

async function requireAdmin(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctx: any,
  workspaceId: string,
): Promise<void> {
  try {
    await checkWorkspaceRole(ctx.prisma, ctx.session.user.id, workspaceId, "ADMIN");
  } catch (e) {
    if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
    throw e;
  }
}

function translateThemeError(e: unknown): never {
  if (e instanceof ThemeError) {
    const code = e.code === "NOT_FOUND" ? "NOT_FOUND" : e.code === "CONFLICT" ? "CONFLICT" : "BAD_REQUEST";
    throw new TRPCError({ code, message: e.message });
  }
  throw e;
}

export const themeRouter = router({
  // The captured workspace theme (or null). Any member may read; agency-gated.
  getShared: protectedProcedure.query(async ({ ctx }) => {
    const workspaceId = await resolveWorkspaceId(ctx);
    await requireAgencyLayer(workspaceId);
    return getSharedTheme(workspaceId);
  }),

  // Every site in the workspace + its push state (lock, schema version).
  targets: protectedProcedure.query(async ({ ctx }) => {
    const workspaceId = await resolveWorkspaceId(ctx);
    await requireAgencyLayer(workspaceId);
    return listThemeTargets(workspaceId);
  }),

  // Capture one site's tokens as the workspace shared theme. Admin-gated.
  capture: protectedProcedure
    .input(captureSharedThemeInput)
    .mutation(async ({ ctx, input }) => {
      const workspaceId = await resolveWorkspaceId(ctx);
      await requireAgencyLayer(workspaceId);
      await requireAdmin(ctx, workspaceId);
      try {
        return await captureSharedTheme(workspaceId, input.sourceSiteId);
      } catch (e) {
        translateThemeError(e);
      }
    }),

  // Per-site override toggle (locked = excluded from pushes). Admin-gated.
  setLock: protectedProcedure
    .input(setSiteThemeLockInput)
    .mutation(async ({ ctx, input }) => {
      const workspaceId = await resolveWorkspaceId(ctx);
      await requireAgencyLayer(workspaceId);
      await requireAdmin(ctx, workspaceId);
      try {
        await setSiteThemeLock(workspaceId, input.siteId, input.locked);
        return { ok: true as const };
      } catch (e) {
        translateThemeError(e);
      }
    }),

  // Push the shared theme onto sites. Returns a per-site result list (push is
  // partial-fail tolerant — a single site error never aborts the rest).
  push: protectedProcedure
    .input(pushSharedThemeInput)
    .mutation(async ({ ctx, input }) => {
      const workspaceId = await resolveWorkspaceId(ctx);
      await requireAgencyLayer(workspaceId);
      await requireAdmin(ctx, workspaceId);
      try {
        return await pushSharedTheme(workspaceId, input.siteIds);
      } catch (e) {
        translateThemeError(e);
      }
    }),

  // D1: dry-run preview — per-site whether the push would change tokens. Read-only.
  previewPush: protectedProcedure
    .input(previewSharedThemeInput)
    .mutation(async ({ ctx, input }) => {
      const workspaceId = await resolveWorkspaceId(ctx);
      await requireAgencyLayer(workspaceId);
      await requireAdmin(ctx, workspaceId);
      try {
        return await previewSharedThemePush(workspaceId, input.siteIds);
      } catch (e) {
        translateThemeError(e);
      }
    }),

  // D2: roll a site back to its pre-push tokens. Admin-gated.
  rollback: protectedProcedure
    .input(siteThemeSnapshotInput)
    .mutation(async ({ ctx, input }) => {
      const workspaceId = await resolveWorkspaceId(ctx);
      await requireAgencyLayer(workspaceId);
      await requireAdmin(ctx, workspaceId);
      try {
        return await rollbackSiteTheme(workspaceId, input.siteId);
      } catch (e) {
        translateThemeError(e);
      }
    }),

  // D2: a site's rollback history.
  snapshots: protectedProcedure
    .input(siteThemeSnapshotInput)
    .query(async ({ ctx, input }) => {
      const workspaceId = await resolveWorkspaceId(ctx);
      await requireAgencyLayer(workspaceId);
      try {
        return await listSiteThemeSnapshots(workspaceId, input.siteId);
      } catch (e) {
        translateThemeError(e);
      }
    }),

  // Brand panel restore points: any site editor (not VIEWER), no agency gate.
  brandRestorePoints: protectedProcedure
    .input(siteThemeSnapshotInput)
    .query(async ({ ctx, input }) => {
      try {
        await checkSiteRole(ctx.prisma, ctx.session.user.id, input.siteId, "EDITOR");
      } catch (e) {
        if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
        throw e;
      }
      return listBrandRestorePoints(input.siteId);
    }),

  // A restore point taken before a generator, Dark-Auto or logo apply.
  createBrandRestorePoint: protectedProcedure
    .input(createBrandRestorePointInput)
    .mutation(async ({ ctx, input }) => {
      try {
        await checkSiteRole(ctx.prisma, ctx.session.user.id, input.siteId, "EDITOR");
      } catch (e) {
        if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
        throw e;
      }
      try {
        return await createBrandRestorePoint(input);
      } catch (e) {
        translateThemeError(e);
      }
    }),

  // One restore point's tokens, for the editor to restore.
  brandRestorePoint: protectedProcedure
    .input(brandRestorePointInput)
    .query(async ({ ctx, input }) => {
      try {
        await checkSiteRole(ctx.prisma, ctx.session.user.id, input.siteId, "EDITOR");
      } catch (e) {
        if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
        throw e;
      }
      try {
        return await getBrandRestorePoint(input.siteId, input.id);
      } catch (e) {
        translateThemeError(e);
      }
    }),

  // Brand Part 1c (spec §9): colours and fonts from a website, behind dsAi (spec §9 last line).
  extractBrandFromUrl: protectedProcedure
    .input(extractBrandFromUrlInput)
    .mutation(async ({ ctx, input }) => {
      if (process.env.NEXT_PUBLIC_FEATURE_DS_AI !== "true") throw new TRPCError({ code: "NOT_FOUND" });
      try {
        await checkSiteRole(ctx.prisma, ctx.session.user.id, input.siteId, "EDITOR");
      } catch (e) {
        if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
        throw e;
      }
      const workspaceId = await resolveWorkspaceId(ctx);
      for (const [key, max] of [[`brand-extract:user:${ctx.session.user.id}`, 10], [`brand-extract:ws:${workspaceId}`, 30]] as const) {
        if (!(await checkRateLimit(key, max, 10 * 60_000)).allowed) {
          throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many brand imports — try again in a few minutes." });
        }
      }
      try {
        return await extractBrandFromUrl(input.url);
      } catch (e) {
        if (e instanceof BrandExtractError) {
          console.warn("[brand-extract] failed", { kind: e.code, siteId: input.siteId });
          throw new TRPCError({ code: "BAD_REQUEST", message: `${e.code}: ${e.message}` });
        }
        throw e;
      }
    }),

  // D4: the agency's named brand preset library.
  presets: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const workspaceId = await resolveWorkspaceId(ctx);
      await requireAgencyLayer(workspaceId);
      return listWorkspacePresets(workspaceId);
    }),
    save: protectedProcedure
      .input(saveWorkspacePresetInput)
      .mutation(async ({ ctx, input }) => {
        const workspaceId = await resolveWorkspaceId(ctx);
        await requireAgencyLayer(workspaceId);
        await requireAdmin(ctx, workspaceId);
        try {
          return await saveWorkspacePreset(workspaceId, input.name, input.sourceSiteId, ctx.session.user.id);
        } catch (e) {
          translateThemeError(e);
        }
      }),
    delete: protectedProcedure
      .input(workspacePresetIdInput)
      .mutation(async ({ ctx, input }) => {
        const workspaceId = await resolveWorkspaceId(ctx);
        await requireAgencyLayer(workspaceId);
        await requireAdmin(ctx, workspaceId);
        return deleteWorkspacePreset(workspaceId, input.presetId);
      }),
    applyPreset: protectedProcedure
      .input(workspacePresetIdInput)
      .mutation(async ({ ctx, input }) => {
        const workspaceId = await resolveWorkspaceId(ctx);
        await requireAgencyLayer(workspaceId);
        await requireAdmin(ctx, workspaceId);
        try {
          return await applyWorkspacePreset(workspaceId, input.presetId);
        } catch (e) {
          translateThemeError(e);
        }
      }),
  }),
});
