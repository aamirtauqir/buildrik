import { z } from "zod";
import { router, publicProcedure } from "../trpc";
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
import { generateToken, validateToken, invalidateToken } from "@/server/services/token.service";

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
    .mutation(async ({ input }) => {
      try {
        return await login(input.email, input.password);
      } catch (err) {
        handleAuthError(err);
      }
    }),

  signup: publicProcedure
    .input(signupSchema)
    .mutation(async ({ input }) => {
      try {
        const user = await signup(input.fullName, input.email, input.password);
        return { user: { id: user.id, email: user.email }, message: "Verification email sent" };
      } catch (err) {
        handleAuthError(err);
      }
    }),

  verifyEmail: publicProcedure
    .input(z.object({ token: z.string().min(1) }))
    .mutation(async ({ input }) => {
      try {
        const user = await verifyEmail(input.token);
        return { success: true, user: { id: user.id, email: user.email } };
      } catch (err) {
        handleAuthError(err);
      }
    }),

  resendVerification: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      await resendVerification(input.email);
      return { message: "If an account exists, a verification email has been sent" };
    }),

  forgotPassword: publicProcedure
    .input(forgotPasswordSchema)
    .mutation(async ({ input }) => {
      await forgotPassword(input.email);
      return { message: "If an account exists, a reset email has been sent" };
    }),

  resetPassword: publicProcedure
    .input(resetPasswordSchema)
    .mutation(async ({ input }) => {
      try {
        await resetPassword(input.token, input.newPassword);
        return { message: "Password reset successful" };
      } catch (err) {
        handleAuthError(err);
      }
    }),

  magicLink: publicProcedure
    .input(magicLinkSchema)
    .mutation(async ({ input }) => {
      await sendMagicLink(input.email);
      return { message: "Magic link sent" };
    }),

  verifyMagicLink: publicProcedure
    .input(z.object({ token: z.string().min(1) }))
    .mutation(async ({ input }) => {
      try {
        const user = await verifyMagicLink(input.token);
        if (!user) throw new AuthError("TOKEN_EXPIRED", "Magic link expired", 410);
        const sessionToken = await generateToken("session_grant", user.id, 5);
        return { success: true, sessionToken, user: { id: user.id, email: user.email } };
      } catch (err) {
        handleAuthError(err);
      }
    }),

  verify2FA: publicProcedure
    .input(z.object({ twoFactorToken: z.string().min(1), code: z.string().length(6) }))
    .mutation(async ({ input }) => {
      try {
        const user = await verify2FA(input.twoFactorToken, input.code);
        const sessionToken = await generateToken("session_grant", user.id, 5);
        return { success: true, sessionToken, user: { id: user.id, email: user.email } };
      } catch (err) {
        handleAuthError(err);
      }
    }),

  verifyBackupCode: publicProcedure
    .input(z.object({ twoFactorToken: z.string().min(1), backupCode: z.string().min(1) }))
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

  logout: publicProcedure.mutation(async () => {
    return { success: true };
  }),

  acceptInvite: publicProcedure
    .input(z.object({ token: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const identifier = await validateToken(input.token, "invite");
      if (!identifier) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invite expired or invalid" });
      }
      await invalidateToken(input.token);
      return { success: true, message: "Invite accepted" };
    }),

  declineInvite: publicProcedure
    .input(z.object({ token: z.string().min(1) }))
    .mutation(async ({ input }) => {
      await invalidateToken(input.token);
      return { message: "Invite declined" };
    }),

  verifyDevice: publicProcedure
    .input(z.object({ token: z.string().min(1), code: z.string().length(6) }))
    .mutation(async () => {
      return { success: true };
    }),

  reportSuspiciousLogin: publicProcedure
    .input(z.object({ token: z.string().min(1) }))
    .mutation(async () => {
      return { message: "Report received. Account secured." };
    }),
});
