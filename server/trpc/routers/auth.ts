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
  resetPasswordSchema, otpSchema, backupCodeSchema, magicLinkSchema, emailField,
} from "@buildrik/shared/schemas/auth";
import { generateToken } from "@/server/services/token.service";
import { peekRateLimit, checkRateLimit } from "@/server/services/rate-limiter";
import { captchaEnabled, verifyTurnstile } from "@/server/services/turnstile.service";
import { logAuditEvent } from "@/server/services/audit.service";
import { createNotification } from "@/server/services/notification.trigger";
import { record as recordActivity } from "@/server/services/activity-log.service";

// Strict: 5 attempts per 15 min (2FA, token verification)
const strictRateLimit = createRateLimitedProcedure(5, 15 * 60 * 1000);
// Normal: 10 attempts per 15 min (signup, resend, forgot password)
const normalRateLimit = createRateLimitedProcedure(10, 15 * 60 * 1000);
// Login uses a FAILURE-ONLY per-IP throttle (see the login procedure): only
// wrong logins consume budget, so successful logins can't lock out a shared/NAT
// IP. Per-account lockout (auth.service) handles targeted brute force.
const LOGIN_MAX_FAILURES = 10;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
// Require a captcha solve once an IP has this many recent failed logins.
const LOGIN_CAPTCHA_AFTER = 3;
const clientIp = (headers: Headers | undefined) =>
  headers?.get("x-forwarded-for")?.split(",")[0]?.trim() || headers?.get("x-real-ip") || "unknown";

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
  login: publicProcedure
    .input(loginSchema)
    .mutation(async ({ ctx, input }) => {
      const ip = clientIp(ctx.headers);
      const rlKey = `login-fail:${ip}`;
      const peek = await peekRateLimit(rlKey, LOGIN_MAX_FAILURES);
      if (!peek.allowed) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many failed attempts. Please try again later." });
      }
      // Captcha gate: once this IP has enough recent failed logins, require a
      // valid Turnstile solve BEFORE evaluating credentials — enforced here in
      // the mutation (not just the UI) so scripted stuffing can't skip it.
      if (captchaEnabled() && !(await peekRateLimit(rlKey, LOGIN_CAPTCHA_AFTER)).allowed) {
        const ok = await verifyTurnstile(input.turnstileToken, ip);
        if (!ok) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "CAPTCHA_REQUIRED" });
        }
      }
      try {
        const result = await login(input.email, input.password);
        if (result.requiresTwoFactor) {
          return { requiresTwoFactor: true as const, tempToken: result.tempToken };
        }
        const sessionToken = await generateToken("session_grant", result.user!.id, 5);
        return { requiresTwoFactor: false as const, sessionToken, user: { id: result.user!.id, email: result.user!.email } };
      } catch (err) {
        // Only wrong credentials consume the per-IP budget; a locked-account or
        // other error does not (and a success above never reaches here).
        if (err instanceof AuthError && err.code === "INVALID_CREDENTIALS") {
          await checkRateLimit(rlKey, LOGIN_MAX_FAILURES, LOGIN_WINDOW_MS);
        }
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
    .input(z.object({ email: emailField }))
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
    .input(z.object({ email: emailField }))
    .mutation(async ({ input, ctx }) => {
      const MIN_RESPONSE_MS = 200;
      const start = Date.now();

      // Only `exists` is returned (signup's email-first routing needs it). Do NOT
      // leak hasPassword / linked OAuth providers to unauthenticated callers —
      // that turns this into a login-method profiling oracle for phishing.
      const user = await ctx.prisma.user.findUnique({
        where: { email: input.email },
        select: { id: true },
      });

      const elapsed = Date.now() - start;
      if (elapsed < MIN_RESPONSE_MS) {
        await new Promise<void>((r) => setTimeout(r, MIN_RESPONSE_MS - elapsed));
      }

      return { exists: user !== null };
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
        // a9-invite: include the workspace icon so the invite can wear the
        // inviting agency's brand, not Buildrick's.
        include: { workspace: { select: { name: true, iconUrl: true } } },
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
        // The address the invite is bound to. Token-gated (the caller already
        // holds the secret from the invite email), and the invite screens need
        // it: "sent to priya@…, you're logged in as jordan@…" on the email
        // mismatch, and as the fixed signup email on /auth/join-workspace.
        email: invite.email,
        workspaceName: invite.workspace.name,
        workspaceIconUrl: invite.workspace.iconUrl,
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
      // Narrow to the rich branch — the session.user union has a minimal
      // `{ id }` fallback shape; only the augmented branch carries email,
      // which we need for the INVITE_EMAIL_MISMATCH audit log + the
      // MEMBER_JOINED notification message below.
      if (!user?.id || !("email" in user) || typeof user.email !== "string") {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
      }
      const userId = user.id;
      const existing = await ctx.prisma.workspaceMember.findUnique({
        where: { userId_workspaceId: { userId, workspaceId: invite.workspaceId } },
      });
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "You are already a member of this workspace" });
      }

      // Reject before any membership write: an invite token is bound to the
      // email it was sent to. Without this, anyone holding the token could
      // join the workspace under a different account.
      if (invite.email.toLowerCase() !== user.email.toLowerCase()) {
        await logAuditEvent("INVITE_EMAIL_MISMATCH", "failure", {
          userId, metadata: { inviteEmail: invite.email, userEmail: user.email },
        });
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This invite was sent to a different email address.",
        });
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

      await logAuditEvent("INVITE_ACCEPTED", "success", { userId, metadata: { workspaceId: invite.workspaceId } });

      createNotification({
        userId: invite.invitedBy,
        type: "MEMBER_JOINED",
        message: `${user.email} joined the workspace`,
        actorId: userId,
        actionUrl: "/dashboard/settings/team",
      }).catch(() => {});

      // Activity-log entry so the team activity feed (getTeamActivity) reflects
      // the join — the notification alone never reached that feed.
      await recordActivity({
        workspaceId: invite.workspaceId,
        actorId: userId,
        action: "MEMBER_JOINED",
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
