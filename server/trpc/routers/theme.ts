import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../trpc";
import { resolveWorkspaceId } from "@/server/trpc/workspace-ctx";
import { isFeatureEnabled } from "@/server/services/feature-flag.service";
import {
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
  ThemeError,
} from "@/server/services/theme.service";
import {
  captureSharedThemeInput,
  pushSharedThemeInput,
  setSiteThemeLockInput,
  previewSharedThemeInput,
  siteThemeSnapshotInput,
} from "@buildrik/shared/schemas/theme";

// Shared-theme push is part of the agency layer — gated behind the E0
// `agency_layer` flag (runtime kill-switch), same as clients/reviews.
async function requireAgencyLayer(workspaceId: string): Promise<void> {
  if (!(await isFeatureEnabled(workspaceId, "agency_layer"))) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Agency layer is not enabled for this workspace",
    });
  }
}

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
    const code = e.code === "NOT_FOUND" ? "NOT_FOUND" : "BAD_REQUEST";
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
});
