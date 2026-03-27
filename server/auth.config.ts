import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/server/services/audit.service";
import { createWorkspaceForUser } from "@/server/services/auth.service";

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
    async signIn({ user, account }) {
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
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user?.id && account?.provider) {
        token.userId = user.id;
        const sessionId = randomUUID();
        token.dbSessionId = sessionId;
        try {
          await prisma.session.create({
            data: {
              userId: user.id,
              sessionToken: sessionId,
              expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              current: true,
            },
          });
          const sessions = await prisma.session.findMany({
            where: { userId: user.id, expires: { gt: new Date() } },
            orderBy: { createdAt: "asc" },
            select: { id: true },
          });
          if (sessions.length > 10) {
            const toDelete = sessions.slice(0, sessions.length - 10).map(s => s.id);
            await prisma.session.deleteMany({ where: { id: { in: toDelete } } });
          }
        } catch (err) {
          console.error("[auth] Failed to create OAuth session record:", err);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.userId) {
        session.user.id = token.userId as string;
      }
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
        maxAge: 30 * 24 * 60 * 60,
      },
    },
  },
};
