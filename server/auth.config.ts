import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import { cookies } from "next/headers";
import { decode } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/server/services/audit.service";
import { createWorkspaceForUser } from "@/server/services/auth.service";

/** userId of the currently-signed-in session (if any) — distinguishes an
 *  authenticated "Connect provider from Settings" from a fresh public login. */
async function currentSessionUserId(): Promise<string | null> {
  try {
    const cookieName = process.env.NODE_ENV === "production"
      ? "__Secure-next-auth.session-token"
      : "next-auth.session-token";
    const raw = (await cookies()).get(cookieName)?.value;
    if (!raw) return null;
    const decoded = await decode({ token: raw, secret: process.env.NEXTAUTH_SECRET!, salt: cookieName });
    return typeof decoded?.userId === "string" ? decoded.userId : null;
  } catch {
    return null;
  }
}

// Password login goes through tRPC `auth.login` → /api/auth/create-session, which
// enforces 2FA + per-account lockout + constant-time anti-enumeration. NextAuth
// has NO Credentials provider on purpose: it would be a second password-login
// surface at /api/auth/callback/credentials that mints a session WITHOUT 2FA.
export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error/social-error",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account && user.email) {
        // Never link/log-in on an UNVERIFIED provider email — otherwise an
        // attacker who sets a victim's address as an unverified email on their
        // own provider account could take over the victim's Buildrick account.
        // Google asserts `email_verified`; Auth.js's GitHub provider only ever
        // returns the primary *verified* email, so it's trusted.
        const emailVerified =
          account.provider === "google"
            ? (profile as { email_verified?: boolean } | undefined)?.email_verified === true
            : account.provider === "github"
              ? true
              : false;
        if (!emailVerified) {
          return "/auth/error/social-error?reason=unverified-email";
        }

        const existing = await prisma.user.findUnique({
          where: { email: user.email },
          include: { accounts: { select: { provider: true } } },
        });
        if (!existing) {
          const created = await prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
              data: {
                email: user.email!,
                fullName: user.name || user.email!,
                provider: account.provider,
                emailVerified: new Date(),
              },
            });
            await createWorkspaceForUser(tx, newUser.id, newUser.fullName);
            return newUser;
          });
          user.id = created.id;
          await logAuditEvent("OAUTH_SIGNUP", "success", { userId: created.id, email: user.email });
        } else {
          const providerLinked = existing.accounts.some((a) => a.provider === account.provider);
          const isSelfLink = (await currentSessionUserId()) === existing.id;
          // A fresh PUBLIC OAuth login (not the owner self-linking from Settings)
          // into a password account whose provider isn't linked yet → do NOT
          // silently link it; send them to use their password. This prevents
          // login-method confusion + email-based account absorption.
          if (existing.passwordHash && !providerLinked && !isSelfLink) {
            return `/auth/oauth-conflict?email=${encodeURIComponent(user.email)}`;
          }
          user.id = existing.id;
          await prisma.user.update({ where: { id: existing.id }, data: { lastLoginAt: new Date() } });
          await logAuditEvent("OAUTH_LOGIN", "success", { userId: existing.id, email: user.email });
        }

        // Record the provider link so Settings → Account can show + manage
        // connected accounts. The provider already authenticated this email,
        // so the link is verified by the OAuth handshake itself.
        if (account.providerAccountId && user.id) {
          await prisma.account.upsert({
            where: {
              provider_providerAccountId: {
                provider: account.provider,
                providerAccountId: account.providerAccountId,
              },
            },
            create: {
              userId: user.id,
              type: account.type,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            },
            update: { userId: user.id },
          });
        }
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      // First call (sign-in) — populate from `user`. Subsequent calls reuse
      // whatever is already on the token, so we only hit the DB once per
      // login cycle. Workspace lookup is cheap (indexed FK) but doing it on
      // every request would be wasteful.
      if (user) {
        token.userId = user.id;
        const member = await prisma.workspaceMember.findFirst({
          where: { userId: user.id, status: "ACTIVE" },
          select: { workspaceId: true },
        });
        token.workspaceId = member?.workspaceId ?? null;
      }
      // Workspace switch — the client calls update({ workspaceId }). Validate it
      // is one of the user's ACTIVE memberships before trusting it, so the token
      // can never point at a workspace the user doesn't belong to (IDOR guard).
      if (
        trigger === "update" &&
        session &&
        typeof (session as { workspaceId?: unknown }).workspaceId === "string" &&
        typeof token.userId === "string"
      ) {
        const targetId = (session as { workspaceId: string }).workspaceId;
        const valid = await prisma.workspaceMember.findFirst({
          where: { userId: token.userId, workspaceId: targetId, status: "ACTIVE" },
          select: { workspaceId: true },
        });
        if (valid) token.workspaceId = valid.workspaceId;
      }
      return token;
    },
    async session({ session, token }) {
      // @auth/core JWT declares `interface JWT extends Record<string, unknown>`,
      // so our declaration-merged `userId?: string` widens to `unknown` at
      // index access. Narrow before assigning.
      if (typeof token.userId === "string") {
        session.user.id = token.userId;
      }
      session.user.workspaceId =
        typeof token.workspaceId === "string" ? token.workspaceId : null;
      return session;
    },
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production"
        ? "__Secure-next-auth.session-token"
        : "next-auth.session-token",
      options: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
        path: "/",
        domain: process.env.COOKIE_DOMAIN || undefined,
        maxAge: 30 * 24 * 60 * 60,
      },
    },
  },
};
