import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import type { PrismaClient } from "@prisma/client";

/** Minimal context shape WorkspaceCtx helpers need. Wider than `{user:{id}}`
 *  to accept both cookie-session (has `expires`) + bearer-session (has
 *  `apiToken`) branches without forcing exhaustive narrowing at the
 *  router boundary. */
/** Loose session shape — accepts both cookie-session (with `expires`) and
 *  bearer-session (with `apiToken`) branches from createTRPCContext without
 *  forcing exhaustive narrowing here. PrismaClient typed for real safety. */
interface WorkspaceCtx {
  prisma: PrismaClient;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session: { user: any } | null;
}
import {
  getProfile, updateProfile, changePassword, setPassword, requestEmailChange, getActiveSessions, revokeSession,
  disconnectProvider, revokeAllOtherSessions, getLoginHistory, getNotificationPrefs,
  updateNotificationPref, requestAccountDeletion, requestDataExport, getAICreditsInfo,
  getPreferences, updatePreferences, enable2FA, confirm2FA, disable2FA,
} from "@/server/services/account.service";
import { getWorkspaceSettings, updateWorkspaceSettings, updateSharingSettings, deleteWorkspace, cancelWorkspaceDeletion, listUserWorkspaces, createWorkspace, WorkspaceLimitError } from "@/server/services/workspace-settings.service";
import { checkWorkspaceRole } from "@/server/services/permission.service";
import { initiateTransfer, acceptTransfer, cancelTransfer, getPendingTransfer } from "@/server/services/workspace-transfer.service";
import { listIntegrations, addIntegration, removeIntegration, updateIntegration, sendIntegrationTestEvent } from "@/server/services/integrations.service";
import { updateProfileSchema, changePasswordSchema, setPasswordSchema, changeEmailSchema, updateWorkspaceSchema, createWorkspaceSchema, workspaceSharingSettingsSchema, addIntegrationSchema, notificationPrefSchema, updatePreferencesSchema, deleteAccountSchema } from "@buildrik/shared/schemas/account";
import { type PlanName } from "@/lib/constants/plan-limits";

async function getWorkspaceCtx(ctx: WorkspaceCtx): Promise<{ workspaceId: string; plan: PlanName }> {
  if (!ctx.session?.user) throw new TRPCError({ code: "UNAUTHORIZED" });
  const userId = ctx.session.user.id;
  // Honor the active workspace from the session (set on switch), but only if it
  // is still one of the user's ACTIVE memberships — never trust it blindly.
  // Fall back to the first membership for single-workspace users / stale tokens.
  const activeId = ctx.session.user.workspaceId as string | null | undefined;
  const member = await ctx.prisma.workspaceMember.findFirst({
    where: activeId ? { userId, workspaceId: activeId, status: "ACTIVE" } : { userId },
    include: { workspace: { select: { plan: true } } },
  }) ?? (activeId
    ? await ctx.prisma.workspaceMember.findFirst({ where: { userId }, include: { workspace: { select: { plan: true } } } })
    : null);
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
  setPassword: protectedProcedure.input(setPasswordSchema).mutation(async ({ ctx, input }) => {
    try {
      await setPassword(ctx.session.user.id, input.newPassword);
      return { ok: true };
    } catch (e: unknown) {
      if (e instanceof Error && e.message === "PASSWORD_ALREADY_SET") throw new TRPCError({ code: "BAD_REQUEST", message: "A password is already set. Use Change password." });
      throw e;
    }
  }),
  disconnectProvider: protectedProcedure
    .input(z.object({ provider: z.enum(["google", "github"]) }))
    .mutation(async ({ ctx, input }) => {
      try {
        return await disconnectProvider(ctx.session.user.id, input.provider);
      } catch (e: unknown) {
        if (e instanceof Error && e.message === "LAST_LOGIN_METHOD") throw new TRPCError({ code: "BAD_REQUEST", message: "Set a password before disconnecting your only login method." });
        if (e instanceof Error && e.message === "NOT_CONNECTED") throw new TRPCError({ code: "BAD_REQUEST", message: "That provider is not connected." });
        throw e;
      }
    }),
  twoFactor: router({
    enable: protectedProcedure.mutation(({ ctx }) => enable2FA(ctx.session.user.id)),
    confirm: protectedProcedure
      .input(z.object({ code: z.string().length(6) }))
      .mutation(({ ctx, input }) => confirm2FA(ctx.session.user.id, input.code)),
    disable: protectedProcedure
      .input(z.object({ password: z.string().optional().default(""), code: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        try {
          return await disable2FA(ctx.session.user.id, input.password, input.code);
        } catch (e: unknown) {
          if (e instanceof Error && e.message === "WRONG_PASSWORD") throw new TRPCError({ code: "UNAUTHORIZED", message: "Password is incorrect." });
          if (e instanceof Error && e.message === "CODE_REQUIRED") throw new TRPCError({ code: "BAD_REQUEST", message: "Enter your 6-digit authenticator code to disable 2FA." });
          if (e instanceof Error && e.message === "INVALID_CODE") throw new TRPCError({ code: "UNAUTHORIZED", message: "Authenticator code is incorrect." });
          if (e instanceof Error && e.message === "2FA_NOT_SETUP") throw new TRPCError({ code: "BAD_REQUEST", message: "Two-factor authentication is not set up." });
          if (e instanceof Error && e.message === "USER_NOT_FOUND") throw new TRPCError({ code: "NOT_FOUND", message: "User not found." });
          throw e;
        }
      }),
  }),
  sessions: router({
    list: protectedProcedure.query(({ ctx }) => getActiveSessions(ctx.session.user.id)),
    revoke: protectedProcedure.input(z.object({ sessionId: z.string() })).mutation(({ ctx, input }) => revokeSession(input.sessionId, ctx.session.user.id)),
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
    // a6-workspace-select: the user's own workspaces, for the chooser.
    listMine: protectedProcedure.query(async ({ ctx }) => {
      return listUserWorkspaces(ctx.session.user.id);
    }),
    // W1: create an additional workspace. Plan-gated (free = 1 workspace).
    create: protectedProcedure.input(createWorkspaceSchema).mutation(async ({ ctx, input }) => {
      try {
        return await createWorkspace(ctx.session.user.id, input.name);
      } catch (e) {
        if (e instanceof WorkspaceLimitError) {
          throw new TRPCError({ code: "FORBIDDEN", message: e.message });
        }
        throw e;
      }
    }),
    update: protectedProcedure.input(updateWorkspaceSchema).mutation(async ({ ctx, input }) => {
      const { workspaceId } = await getWorkspaceCtx(ctx);
      // F3: workspace settings are admin-scoped. checkWorkspaceRole already exists;
      // these mutations just weren't calling it — any ACTIVE member could edit.
      await checkWorkspaceRole(ctx.prisma, ctx.session.user.id, workspaceId, "ADMIN");
      return updateWorkspaceSettings(workspaceId, input);
    }),
    sharing: protectedProcedure.input(workspaceSharingSettingsSchema).mutation(async ({ ctx, input }) => {
      const { workspaceId } = await getWorkspaceCtx(ctx);
      await checkWorkspaceRole(ctx.prisma, ctx.session.user.id, workspaceId, "ADMIN");
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
      await checkWorkspaceRole(ctx.prisma, ctx.session.user.id, workspaceId, "ADMIN");
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
        if (e instanceof Error && (e.message === "BLOCKED_URL" || e.message === "INVALID_URL")) throw new TRPCError({ code: "BAD_REQUEST", message: "Webhook URL must be a public https address." });
        throw e;
      }
    }),
    remove: protectedProcedure.input(z.object({ id: z.string() })).mutation(({ ctx, input }) => removeIntegration(input.id, ctx.session.user.id)),
    update: protectedProcedure
      .input(z.object({ id: z.string(), config: z.record(z.string(), z.string()) }))
      .mutation(async ({ ctx, input }) => {
        try { return await updateIntegration(input.id, input.config, ctx.session.user.id); }
        catch (e: unknown) {
          if (e instanceof Error && e.message === "INTEGRATION_NOT_FOUND") throw new TRPCError({ code: "NOT_FOUND", message: "Integration not found." });
          if (e instanceof Error && (e.message === "BLOCKED_URL" || e.message === "INVALID_URL")) throw new TRPCError({ code: "BAD_REQUEST", message: "Webhook URL must be a public https address." });
          throw e;
        }
      }),
    testEvent: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        try { return await sendIntegrationTestEvent(input.id, ctx.session.user.id); }
        catch (e: unknown) {
          if (e instanceof Error && e.message === "INTEGRATION_NOT_FOUND") throw new TRPCError({ code: "NOT_FOUND", message: "Integration not found." });
          if (e instanceof Error && e.message === "NO_WEBHOOK_URL") throw new TRPCError({ code: "BAD_REQUEST", message: "This integration has no webhook URL to test." });
          if (e instanceof Error && (e.message === "BLOCKED_URL" || e.message === "INVALID_URL")) throw new TRPCError({ code: "BAD_REQUEST", message: "Webhook URL must be a public https address." });
          if (e instanceof Error && e.message === "WEBHOOK_UNREACHABLE") throw new TRPCError({ code: "BAD_REQUEST", message: "Could not reach the webhook URL." });
          throw e;
        }
      }),
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
    deleteAccount: protectedProcedure.input(deleteAccountSchema).mutation(({ ctx, input }) => requestAccountDeletion(ctx.session.user.id, input.reason)),
    cancelAccountDeletion: protectedProcedure.mutation(({ ctx }) => {
      return ctx.prisma.accountDeletionReq.updateMany({
        where: { userId: ctx.session.user.id, processedAt: null, cancelledAt: null },
        data: { cancelledAt: new Date() },
      });
    }),
  }),
});
