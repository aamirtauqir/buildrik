import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import {
  getProfile, updateProfile, changePassword, getActiveSessions, revokeSession,
  revokeAllOtherSessions, getLoginHistory, getNotificationPrefs,
  updateNotificationPref, requestAccountDeletion, requestDataExport, getAICreditsInfo,
  getPreferences, updatePreferences,
} from "@/server/services/account.service";
import { getWorkspaceSettings, updateWorkspaceSettings, updateSharingSettings } from "@/server/services/workspace-settings.service";
import { listIntegrations, addIntegration, removeIntegration } from "@/server/services/integrations.service";
import { updateProfileSchema, changePasswordSchema, updateWorkspaceSchema, workspaceSharingSettingsSchema, addIntegrationSchema, notificationPrefSchema, updatePreferencesSchema } from "@/lib/validations/account";

async function getWorkspaceCtx(ctx: any): Promise<{ workspaceId: string; plan: string }> {
  const member = await ctx.prisma.workspaceMember.findFirst({
    where: { userId: ctx.session.user.id },
    include: { workspace: { select: { plan: true } } },
  });
  if (!member) throw new TRPCError({ code: "NOT_FOUND", message: "No workspace found" });
  return { workspaceId: member.workspaceId, plan: member.workspace.plan };
}

export const accountRouter = router({
  profile: router({
    get: protectedProcedure.query(({ ctx }) => getProfile(ctx.session.user.id)),
    update: protectedProcedure.input(updateProfileSchema).mutation(({ ctx, input }) => updateProfile(ctx.session.user.id, input)),
  }),
  changePassword: protectedProcedure.input(changePasswordSchema).mutation(async ({ ctx, input }) => {
    try {
      await changePassword(ctx.session.user.id, input.currentPassword, input.newPassword);
      return { ok: true };
    } catch (e: unknown) {
      if (e instanceof Error && e.message === "NO_PASSWORD") throw new TRPCError({ code: "BAD_REQUEST", message: "Account has no password set. Use social login." });
      if (e instanceof Error && e.message === "WRONG_PASSWORD") throw new TRPCError({ code: "UNAUTHORIZED", message: "Current password is incorrect." });
      throw e;
    }
  }),
  sessions: router({
    list: protectedProcedure.query(({ ctx }) => getActiveSessions(ctx.session.user.id)),
    revoke: protectedProcedure.input(z.object({ sessionId: z.string() })).mutation(({ input }) => revokeSession(input.sessionId)),
    revokeAll: protectedProcedure.input(z.object({ currentSessionId: z.string() })).mutation(({ ctx, input }) => revokeAllOtherSessions(ctx.session.user.id, input.currentSessionId)),
  }),
  loginHistory: protectedProcedure.query(({ ctx }) => getLoginHistory(ctx.session.user.id)),
  notifications: router({
    list: protectedProcedure.query(({ ctx }) => getNotificationPrefs(ctx.session.user.id)),
    update: protectedProcedure.input(notificationPrefSchema).mutation(({ ctx, input }) => updateNotificationPref(ctx.session.user.id, input)),
  }),
  preferences: router({
    get: protectedProcedure.query(({ ctx }) => getPreferences(ctx.session.user.id)),
    update: protectedProcedure
      .input(updatePreferencesSchema)
      .mutation(({ ctx, input }) => updatePreferences(ctx.session.user.id, input)),
  }),
  workspace: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const { workspaceId } = await getWorkspaceCtx(ctx);
      return getWorkspaceSettings(workspaceId);
    }),
    update: protectedProcedure.input(updateWorkspaceSchema).mutation(async ({ ctx, input }) => {
      const { workspaceId } = await getWorkspaceCtx(ctx);
      return updateWorkspaceSettings(workspaceId, input);
    }),
    sharing: protectedProcedure.input(workspaceSharingSettingsSchema).mutation(async ({ ctx, input }) => {
      const { workspaceId } = await getWorkspaceCtx(ctx);
      return updateSharingSettings(workspaceId, input);
    }),
  }),
  integrations: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const { workspaceId } = await getWorkspaceCtx(ctx);
      return listIntegrations(workspaceId);
    }),
    add: protectedProcedure.input(addIntegrationSchema).mutation(async ({ ctx, input }) => {
      const { workspaceId, plan } = await getWorkspaceCtx(ctx);
      try { return await addIntegration(workspaceId, input, plan); }
      catch (e: unknown) {
        if (e instanceof Error && e.message === "INTEGRATION_LIMIT") throw new TRPCError({ code: "FORBIDDEN", message: "Integration limit reached." });
        throw e;
      }
    }),
    remove: protectedProcedure.input(z.object({ id: z.string() })).mutation(({ input }) => removeIntegration(input.id)),
  }),
  aiCredits: protectedProcedure.query(async ({ ctx }) => {
    const { workspaceId, plan } = await getWorkspaceCtx(ctx);
    return getAICreditsInfo(workspaceId, plan);
  }),
  dangerZone: router({
    exportData: protectedProcedure.mutation(({ ctx }) => requestDataExport(ctx.session.user.id)),
    deleteAccount: protectedProcedure.input(z.object({ reason: z.string().max(500).optional() })).mutation(({ ctx, input }) => requestAccountDeletion(ctx.session.user.id, input.reason)),
  }),
});
