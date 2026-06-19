import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/server/services/audit.service";
import { createWorkspaceForUser } from "@/server/services/auth.service";
import { checkRateLimit } from "@/server/services/rate-limiter";

const CREDENTIALS_MAX_ATTEMPTS = 5;
const CREDENTIALS_WINDOW_MS = 5 * 60 * 1000;

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
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;

        if (!email || !password) return null;

        // IP-rate-limit BEFORE bcrypt + DB lookup. Brute-force attempts on a
        // valid email otherwise hit ~80ms bcrypt per try, which is cheap
        // enough for an attacker. Limiting at the IP boundary forces them
        // to rotate IPs to keep trying.
        const ip =
          request?.headers?.get?.("x-forwarded-for")?.split(",")[0]?.trim() ||
          request?.headers?.get?.("x-real-ip") ||
          "unknown";
        const limit = await checkRateLimit(
          `login:${ip}`,
          CREDENTIALS_MAX_ATTEMPTS,
          CREDENTIALS_WINDOW_MS,
        );
        if (!limit.allowed) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash) return null;

        if (user.lockedUntil && user.lockedUntil > new Date()) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.fullName };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error/social-error",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "credentials") return true;

      if (account && user.email) {
        const existing = await prisma.user.findUnique({ where: { email: user.email } });
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
          where: { userId: user.id },
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
