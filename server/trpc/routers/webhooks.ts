import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../trpc";
import { resolveWorkspaceId } from "@/server/trpc/workspace-ctx";
import { checkWorkspaceRole, PermissionError } from "@/server/services/permission.service";
import { connectWebhookInput } from "@buildrik/shared/schemas/webhooks";
import {
  connectWebhook,
  disconnectWebhook,
  getWebhookStatus,
  regenerateWebhookSecret,
} from "@/server/services/webhook.service";

/**
 * Workspace webhooks (P6). A workspace-level connection — "every site stops
 * sending" on disconnect — so every operation is ADMIN-gated, matching the
 * other workspace-blast-radius controls (contracts §2).
 */

export const webhooksRouter = router({
  status: protectedProcedure.query(async ({ ctx }) => {
    const workspaceId = await resolveWorkspaceId(ctx);
    try {
      await checkWorkspaceRole(ctx.prisma, ctx.session.user.id, workspaceId, "ADMIN");
    } catch (e) {
      if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
      throw e;
    }
    return getWebhookStatus(workspaceId);
  }),

  connect: protectedProcedure.input(connectWebhookInput).mutation(async ({ ctx, input }) => {
    const workspaceId = await resolveWorkspaceId(ctx);
    try {
      await checkWorkspaceRole(ctx.prisma, ctx.session.user.id, workspaceId, "ADMIN");
    } catch (e) {
      if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
      throw e;
    }
    try {
      return await connectWebhook(workspaceId, input);
    } catch (e) {
      if (e instanceof Error && e.message === "WEBHOOK_URL_UNSAFE")
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "That URL can't receive webhooks — use a public https endpoint.",
        });
      throw e;
    }
  }),

  disconnect: protectedProcedure.mutation(async ({ ctx }) => {
    const workspaceId = await resolveWorkspaceId(ctx);
    try {
      await checkWorkspaceRole(ctx.prisma, ctx.session.user.id, workspaceId, "ADMIN");
    } catch (e) {
      if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
      throw e;
    }
    await disconnectWebhook(workspaceId);
    return { ok: true };
  }),

  regenerateSecret: protectedProcedure.mutation(async ({ ctx }) => {
    const workspaceId = await resolveWorkspaceId(ctx);
    try {
      await checkWorkspaceRole(ctx.prisma, ctx.session.user.id, workspaceId, "ADMIN");
    } catch (e) {
      if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
      throw e;
    }
    return regenerateWebhookSecret(workspaceId);
  }),
});
