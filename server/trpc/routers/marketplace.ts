import { z, ZodError } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../trpc";
import { requireWorkspace, type SessionCtx } from "../require-workspace";
import { prisma } from "@/lib/prisma";
import { checkWorkspaceRole, PermissionError } from "@/server/services/permission.service";
import {
  listInstalledApps,
  installApp,
  uninstallApp,
  configureApp,
  getAppConfig,
  AppNotInstallableError,
  AppNotConfigurableError,
} from "@/server/services/marketplace.service";
import { configureAppInput } from "@buildrik/shared/schemas/marketplace";

const appIdInput = z.object({ appId: z.string().min(1).max(64) });

/** Installing an app changes workspace-wide behaviour, so it is Admin-gated —
 *  same bar as the feature flags. Reading what's installed is open to members
 *  because it drives the marketplace UI everyone sees. */
async function requireAdmin(ctx: SessionCtx, workspaceId: string): Promise<void> {
  try {
    await checkWorkspaceRole(prisma, ctx.session!.user.id, workspaceId, "ADMIN");
  } catch (e) {
    if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
    throw e;
  }
}

function toTrpcError(e: unknown): never {
  if (e instanceof AppNotInstallableError) throw new TRPCError({ code: "BAD_REQUEST", message: e.message });
  if (e instanceof AppNotConfigurableError) throw new TRPCError({ code: "BAD_REQUEST", message: e.message });
  // Zod validation failure on the app config → surface the first field message.
  if (e instanceof ZodError) {
    throw new TRPCError({ code: "BAD_REQUEST", message: e.issues[0]?.message ?? "Invalid configuration" });
  }
  throw e;
}

export const marketplaceRouter = router({
  listInstalled: protectedProcedure.query(async ({ ctx }) => {
    const workspaceId = await requireWorkspace(ctx as unknown as SessionCtx);
    return listInstalledApps(workspaceId);
  }),

  install: protectedProcedure.input(appIdInput).mutation(async ({ ctx, input }) => {
    const c = ctx as unknown as SessionCtx;
    const workspaceId = await requireWorkspace(c);
    await requireAdmin(c, workspaceId);
    try {
      await installApp(workspaceId, input.appId);
    } catch (e) {
      toTrpcError(e);
    }
    return { ok: true as const };
  }),

  uninstall: protectedProcedure.input(appIdInput).mutation(async ({ ctx, input }) => {
    const c = ctx as unknown as SessionCtx;
    const workspaceId = await requireWorkspace(c);
    await requireAdmin(c, workspaceId);
    try {
      await uninstallApp(workspaceId, input.appId);
    } catch (e) {
      toTrpcError(e);
    }
    return { ok: true as const };
  }),

  // Stored config for one app, to pre-fill the Configure dialog. Members may
  // read (drives the UI); writing stays Admin-gated below.
  getConfig: protectedProcedure.input(appIdInput).query(async ({ ctx, input }) => {
    const workspaceId = await requireWorkspace(ctx as unknown as SessionCtx);
    return getAppConfig(workspaceId, input.appId);
  }),

  // Validate + save an app's config (installs it if needed). Admin-gated, same
  // bar as install — it changes what ships on every published site.
  configure: protectedProcedure.input(configureAppInput).mutation(async ({ ctx, input }) => {
    const c = ctx as unknown as SessionCtx;
    const workspaceId = await requireWorkspace(c);
    await requireAdmin(c, workspaceId);
    try {
      await configureApp(workspaceId, input.appId, input.config);
    } catch (e) {
      toTrpcError(e);
    }
    return { ok: true as const };
  }),
});
