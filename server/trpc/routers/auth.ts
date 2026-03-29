import { z } from "zod";
import { router, publicProcedure, protectedProcedure, createRateLimitedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import {
  login, signup, verifyEmail, resendVerification,
  forgotPassword, resetPassword, sendMagicLink, verifyMagicLink,
  verify2FA, verifyBackupCode, AuthError,
} from "@/server/services/auth.service";
import {
  loginSchema, signupSchema, forgotPasswordSchema,
  resetPasswordSchema, otpSchema, backupCodeSchema, magicLinkSchema,
} from "@/lib/validations/auth";
import { generateToken } from "@/server/services/token.service";
import { logAuditEvent } from "@/server/services/audit.service";
import { createNotification } from "@/server/services/notification.trigger";

// Strict: 5 attempts per 15 min (login, 2FA, token verification)
const strictRateLimit = createRateLimitedProcedure(5, 15 * 60 * 1000);
// Normal: 10 attempts per 15 min (signup, resend, forgot password)
const normalRateLimit = createRateLimitedProcedure(10, 15 * 60 * 1000);

function handleAuthError(err: unknown): never {
  if (err instanceof AuthError) {
    throw new TRPCError({
      code: err.statusCode === 401 ? "UNAUTHORIZED"
        : err.statusCode === 409 ? "CONFLICT"
        : err.statusCode === 410 ? "NOT_FOUND"
        : err.statusCode === 423 ? "FORBIDDEN"
        : "BAD_REQUEST",
      message: err.message,
      cause: err.data,
    });
  }
  throw err;
}

export const authRouter = router({
  login: strictRateLimit
    .input(loginSchema)
    .mutation(async ({ input }) => {
      try {
        const result = await login(input.email, input.password);
        if (result.requiresTwoFactor) {
          return { requiresTwoFactor: true as const, tempToken: result.tempToken };
        }
        const sessionToken = await generateToken("session_grant", result.user!.id, 5);
        return { requiresTwoFactor: false as const, sessionToken, user: { id: result.user!.id, email: result.user!.email } };
      } catch (err) {
        handleAuthError(err);
      }
    }),

  signup: normalRateLimit
    .input(signupSchema)
    .mutation(async ({ input }) => {
      try {
        const user = await signup(input.fullName, input.email, input.password);
        return { user: { id: user.id, email: user.email }, message: "Verification email sent" };
      } catch (err) {
        handleAuthError(err);
      }
    }),

  verifyEmail: normalRateLimit
    .input(z.object({ token: z.string().uuid() }))
    .mutation(async ({ input }) => {
      try {
        const user = await verifyEmail(input.token);
        return { success: true, user: { id: user.id, email: user.email } };
      } catch (err) {
        handleAuthError(err);
      }
    }),

  resendVerification: normalRateLimit
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      await resendVerification(input.email);
      return { message: "If an account exists, a verification email has been sent" };
    }),

  forgotPassword: normalRateLimit
    .input(forgotPasswordSchema)
    .mutation(async ({ input }) => {
      await forgotPassword(input.email);
      return { message: "If an account exists, a reset email has been sent" };
    }),

  resetPassword: strictRateLimit
    .input(resetPasswordSchema)
    .mutation(async ({ input }) => {
      try {
        await resetPassword(input.token, input.newPassword);
        return { message: "Password reset successful" };
      } catch (err) {
        handleAuthError(err);
      }
    }),

  magicLink: normalRateLimit
    .input(magicLinkSchema)
    .mutation(async ({ input }) => {
      await sendMagicLink(input.email);
      return { message: "Magic link sent" };
    }),

  verifyMagicLink: strictRateLimit
    .input(z.object({ token: z.string().uuid() }))
    .mutation(async ({ input }) => {
      try {
        const result = await verifyMagicLink(input.token);
        if (result.requiresTwoFactor) {
          return { requiresTwoFactor: true as const, tempToken: result.tempToken };
        }
        const sessionToken = await generateToken("session_grant", result.user.id, 5);
        await logAuditEvent("MAGIC_LINK_VERIFIED", "success", { userId: result.user.id, email: result.user.email });
        return { requiresTwoFactor: false as const, sessionToken, user: { id: result.user.id, email: result.user.email } };
      } catch (err) {
        handleAuthError(err);
      }
    }),

  verify2FA: strictRateLimit
    .input(z.object({ twoFactorToken: z.string().uuid() }).merge(otpSchema))
    .mutation(async ({ input }) => {
      try {
        const user = await verify2FA(input.twoFactorToken, input.code);
        const sessionToken = await generateToken("session_grant", user.id, 5);
        return { success: true, sessionToken, user: { id: user.id, email: user.email } };
      } catch (err) {
        handleAuthError(err);
      }
    }),

  verifyBackupCode: strictRateLimit
    .input(z.object({ twoFactorToken: z.string().uuid() }).merge(backupCodeSchema))
    .mutation(async ({ input }) => {
      try {
        const result = await verifyBackupCode(input.twoFactorToken, input.backupCode);
        const sessionToken = await generateToken("session_grant", result.user.id, 5);
        return {
          success: true,
          sessionToken,
          user: { id: result.user.id, email: result.user.email },
          backupCodesRemaining: result.backupCodesRemaining,
        };
      } catch (err) {
        handleAuthError(err);
      }
    }),

  /**
   * Email-first flow: reveals whether an account exists and what auth methods are available.
   * Strict rate limit (5/15 min) + 200ms constant-time floor prevent bulk enumeration.
   */
  checkEmail: strictRateLimit
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input, ctx }) => {
      const MIN_RESPONSE_MS = 200;
      const start = Date.now();

      const user = await ctx.prisma.user.findUnique({
        where: { email: input.email },
        select: { id: true, passwordHash: true },
      });

      const providers: ("google" | "github")[] = [];
      if (user) {
        const accounts = await ctx.prisma.account.findMany({
          where: { userId: user.id },
          select: { provider: true },
        });
        for (const a of accounts) {
          if (a.provider === "google" || a.provider === "github") {
            providers.push(a.provider);
          }
        }
      }

      const elapsed = Date.now() - start;
      if (elapsed < MIN_RESPONSE_MS) {
        await new Promise<void>((r) => setTimeout(r, MIN_RESPONSE_MS - elapsed));
      }

      return {
        exists: !!user,
        hasPassword: !!user?.passwordHash,
        providers,
      };
    }),

  logout: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.session?.user?.id) {
      await ctx.prisma.session.deleteMany({ where: { userId: ctx.session.user.id } });
    }
    await logAuditEvent("LOGOUT", "success", { userId: ctx.session?.user?.id });
    return { success: true };
  }),

  getInviteDetails: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input, ctx }) => {
      const invite = await ctx.prisma.invite.findUnique({
        where: { token: input.token },
        include: { workspace: { select: { name: true } } },
      });
      if (!invite) {
        return { found: false as const };
      }
      const inviter = await ctx.prisma.user.findUnique({
        where: { id: invite.invitedBy },
        select: { fullName: true },
      });
      return {
        found: true as const,
        workspaceName: invite.workspace.name,
        inviterName: inviter?.fullName ?? "A team member",
        role: invite.role,
        expired: invite.status !== "PENDING" || invite.expiresAt < new Date(),
      };
    }),

  acceptInvite: protectedProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const invite = await ctx.prisma.invite.findUnique({
        where: { token: input.token },
        include: { workspace: { select: { name: true } } },
      });
      if (!invite || invite.status !== "PENDING") {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invite not found or already used" });
      }
      if (invite.expiresAt < new Date()) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invite has expired" });
      }

      const user = ctx.session.user;
      if (!user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
      }
      const userId = user.id;
      const existing = await ctx.prisma.workspaceMember.findUnique({
        where: { userId_workspaceId: { userId, workspaceId: invite.workspaceId } },
      });
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "You are already a member of this workspace" });
      }

      await ctx.prisma.$transaction(async (tx) => {
        const member = await tx.workspaceMember.create({
          data: { userId, workspaceId: invite.workspaceId, role: invite.role, invitedBy: invite.invitedBy },
        });
        if (invite.siteIds.length > 0) {
          await tx.sitePermission.createMany({
            data: invite.siteIds.map((siteId) => ({
              memberId: member.id,
              siteId,
              roleOverride: invite.role,
              grantedBy: invite.invitedBy,
            })),
          });
        }
        await tx.invite.update({ where: { id: invite.id }, data: { status: "ACCEPTED" } });
      });

      if (invite.email !== user.email) {
        await logAuditEvent("INVITE_EMAIL_MISMATCH", "success", {
          userId, metadata: { inviteEmail: invite.email, userEmail: user.email },
        });
      }
      await logAuditEvent("INVITE_ACCEPTED", "success", { userId, metadata: { workspaceId: invite.workspaceId } });

      createNotification({
        userId: invite.invitedBy,
        type: "MEMBER_JOINED",
        message: `${user.email} joined the workspace`,
        actorId: userId,
        actionUrl: "/dashboard/team",
      }).catch(() => {});

      return { success: true, workspaceId: invite.workspaceId, workspaceName: invite.workspace.name };
    }),

  declineInvite: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const invite = await ctx.prisma.invite.findUnique({ where: { token: input.token } });
      if (invite && invite.status === "PENDING") {
        await ctx.prisma.invite.update({ where: { id: invite.id }, data: { status: "DECLINED" } });
      }
      await logAuditEvent("INVITE_DECLINED", "success");
      return { message: "Invite declined" };
    }),
});
