import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import {
  getProfile, updateProfile, changePassword, requestEmailChange, getActiveSessions, revokeSession,
  revokeAllOtherSessions, getLoginHistory, getNotificationPrefs,
  updateNotificationPref, requestAccountDeletion, requestDataExport, getAICreditsInfo,
  getPreferences, updatePreferences, enable2FA, confirm2FA, disable2FA,
} from "@/server/services/account.service";
import { getWorkspaceSettings, updateWorkspaceSettings, updateSharingSettings, deleteWorkspace, cancelWorkspaceDeletion } from "@/server/services/workspace-settings.service";
import { initiateTransfer, acceptTransfer, cancelTransfer, getPendingTransfer } from "@/server/services/workspace-transfer.service";
import { listIntegrations, addIntegration, removeIntegration } from "@/server/services/integrations.service";
import { updateProfileSchema, changePasswordSchema, changeEmailSchema, updateWorkspaceSchema, workspaceSharingSettingsSchema, addIntegrationSchema, notificationPrefSchema, updatePreferencesSchema } from "@/lib/validations/account";
import { type PlanName } from "@/lib/constants/plan-limits";

async function getWorkspaceCtx(ctx: any): Promise<{ workspaceId: string; plan: PlanName }> {
  const member = await ctx.prisma.workspaceMember.findFirst({
    where: { userId: ctx.session.user.id },
    include: { workspace: { select: { plan: true } } },
  });
  if (!member) throw new TRPCError({ code: "NOT_FOUND", message: "No workspace found" });
  return { workspaceId: member.workspaceId, plan: member.workspace.plan as PlanName };
}

export const accountRouter = router({
  profile: router({
    get: protectedProcedure.query(({ ctx }) => getProfile(ctx.session.user.id)),
    update: protectedProcedure.input(updateProfileSchema).mutation(({ ctx, input }) => updateProfile(ctx.session.user.id, input)),
  }),
  changeEmail: protectedProcedure.input(changeEmailSchema).mutation(async ({ ctx, input }) => {
    try {
      await requestEmailChange(ctx.session.user.id, input.newEmail, input.password);
      return { ok: true };
    } catch (e: unknown) {
      if (e instanceof Error && e.message === "WRONG_PASSWORD") throw new TRPCError({ code: "UNAUTHORIZED", message: "Password is incorrect." });
      if (e instanceof Error && e.message === "EMAIL_TAKEN") throw new TRPCError({ code: "CONFLICT", message: "Email already in use." });
      throw e;
    }
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
  twoFactor: router({
    enable: protectedProcedure.mutation(({ ctx }) => enable2FA(ctx.session.user.id)),
    confirm: protectedProcedure
      .input(z.object({ code: z.string().length(6) }))
      .mutation(({ ctx, input }) => confirm2FA(ctx.session.user.id, input.code)),
    disable: protectedProcedure
      .input(z.object({ password: z.string().optional().default("") }))
      .mutation(async ({ ctx, input }) => {
        try {
          return await disable2FA(ctx.session.user.id, input.password);
        } catch (e: unknown) {
          if (e instanceof Error && e.message === "WRONG_PASSWORD") throw new TRPCError({ code: "UNAUTHORIZED", message: "Password is incorrect." });
          if (e instanceof Error && e.message === "USER_NOT_FOUND") throw new TRPCError({ code: "NOT_FOUND", message: "User not found." });
          throw e;
        }
      }),
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
    delete: protectedProcedure
      .input(z.object({ confirmName: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const { workspaceId } = await getWorkspaceCtx(ctx);
        const ws = await ctx.prisma.workspace.findUnique({ where: { id: workspaceId } });
        if (!ws || ws.name !== input.confirmName) throw new TRPCError({ code: "BAD_REQUEST", message: "Name does not match" });
        if (ws.ownerId !== ctx.session.user.id) throw new TRPCError({ code: "FORBIDDEN", message: "Only the owner can delete" });
        return deleteWorkspace(workspaceId);
      }),
    cancelDelete: protectedProcedure.mutation(async ({ ctx }) => {
      const { workspaceId } = await getWorkspaceCtx(ctx);
      return cancelWorkspaceDeletion(workspaceId);
    }),
    transfer: router({
      pending: protectedProcedure.query(async ({ ctx }) => {
        const { workspaceId } = await getWorkspaceCtx(ctx);
        return getPendingTransfer(workspaceId);
      }),
      initiate: protectedProcedure
        .input(z.object({ toEmail: z.string().email() }))
        .mutation(async ({ ctx, input }) => {
          const { workspaceId } = await getWorkspaceCtx(ctx);
          try {
            return await initiateTransfer(workspaceId, ctx.session.user.id, input.toEmail);
          } catch (e: unknown) {
            if (e instanceof Error && e.message === "NOT_OWNER") throw new TRPCError({ code: "FORBIDDEN", message: "Only the owner can transfer the workspace." });
            if (e instanceof Error && e.message === "TRANSFER_PENDING") throw new TRPCError({ code: "CONFLICT", message: "A transfer is already pending." });
            throw e;
          }
        }),
      accept: protectedProcedure
        .input(z.object({ token: z.string() }))
        .mutation(async ({ ctx, input }) => {
          try {
            return await acceptTransfer(input.token, ctx.session.user.id);
          } catch (e: unknown) {
            if (e instanceof Error && e.message === "TRANSFER_NOT_FOUND") throw new TRPCError({ code: "NOT_FOUND", message: "Transfer not found or already completed." });
            if (e instanceof Error && e.message === "TRANSFER_EXPIRED") throw new TRPCError({ code: "BAD_REQUEST", message: "Transfer invitation has expired." });
            if (e instanceof Error && e.message === "EMAIL_MISMATCH") throw new TRPCError({ code: "FORBIDDEN", message: "This transfer was not sent to your email address." });
            throw e;
          }
        }),
      cancel: protectedProcedure.mutation(async ({ ctx }) => {
        const { workspaceId } = await getWorkspaceCtx(ctx);
        try {
          return await cancelTransfer(workspaceId, ctx.session.user.id);
        } catch (e: unknown) {
          if (e instanceof Error && e.message === "NOT_OWNER") throw new TRPCError({ code: "FORBIDDEN", message: "Only the owner can cancel the transfer." });
          throw e;
        }
      }),
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
    pendingDeletion: protectedProcedure.query(({ ctx }) => {
      return ctx.prisma.accountDeletionReq.findFirst({
        where: { userId: ctx.session.user.id, processedAt: null, cancelledAt: null },
        select: { id: true, scheduledAt: true },
      });
    }),
    exportData: protectedProcedure.mutation(({ ctx }) => requestDataExport(ctx.session.user.id)),
    deleteAccount: protectedProcedure.input(z.object({ reason: z.string().max(500).optional() })).mutation(({ ctx, input }) => requestAccountDeletion(ctx.session.user.id, input.reason)),
    cancelAccountDeletion: protectedProcedure.mutation(({ ctx }) => {
      return ctx.prisma.accountDeletionReq.updateMany({
        where: { userId: ctx.session.user.id, processedAt: null, cancelledAt: null },
        data: { cancelledAt: new Date() },
      });
    }),
  }),
});
