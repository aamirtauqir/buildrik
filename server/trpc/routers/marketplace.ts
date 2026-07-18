import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../trpc";
import { requireWorkspace, type SessionCtx } from "../require-workspace";
import { prisma } from "@/lib/prisma";
import { checkWorkspaceRole, PermissionError } from "@/server/services/permission.service";
import {
  listInstalledApps,
  installApp,
  uninstallApp,
  AppNotInstallableError,
} from "@/server/services/marketplace.service";

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
});
