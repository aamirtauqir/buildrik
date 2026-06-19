import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../trpc";
import { resolveWorkspaceId } from "@/server/trpc/workspace-ctx";
import { isFeatureEnabled } from "@/server/services/feature-flag.service";
import {
  checkWorkspaceRole,
  PermissionError,
} from "@/server/services/permission.service";
import {
  listClients,
  createClient,
  updateClient,
  deleteClient,
  ClientError,
} from "@/server/services/clients.service";
import {
  createClientInput,
  updateClientInput,
} from "@buildrik/shared/schemas/clients";

// The agency layer ships dark behind the E0 `agency_layer` flag (runtime
// kill-switch). Mutations hard-fail when it's off; list collapses to empty so a
// solo workspace renders a flat Sites view, never empty agency chrome.
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

function translateClientError(e: unknown): never {
  if (e instanceof ClientError) throw new TRPCError({ code: e.code, message: e.message });
  throw e;
}

export const clientsRouter = router({
  // Any member reads the client list (drives the agency dashboard). Flag off →
  // [] so the UI collapses to flat sites without erroring.
  list: protectedProcedure.query(async ({ ctx }) => {
    const workspaceId = await resolveWorkspaceId(ctx);
    if (!(await isFeatureEnabled(workspaceId, "agency_layer"))) return [];
    return listClients(workspaceId);
  }),

  create: protectedProcedure
    .input(createClientInput)
    .mutation(async ({ ctx, input }) => {
      const workspaceId = await resolveWorkspaceId(ctx);
      await requireAgencyLayer(workspaceId);
      await requireAdmin(ctx, workspaceId);
      return createClient(workspaceId, input);
    }),

  update: protectedProcedure
    .input(updateClientInput)
    .mutation(async ({ ctx, input }) => {
      const workspaceId = await resolveWorkspaceId(ctx);
      await requireAgencyLayer(workspaceId);
      await requireAdmin(ctx, workspaceId);
      try {
        return await updateClient(workspaceId, input);
      } catch (e) {
        translateClientError(e);
      }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const workspaceId = await resolveWorkspaceId(ctx);
      await requireAgencyLayer(workspaceId);
      await requireAdmin(ctx, workspaceId);
      try {
        await deleteClient(workspaceId, input.id);
        return { ok: true as const };
      } catch (e) {
        translateClientError(e);
      }
    }),
});
