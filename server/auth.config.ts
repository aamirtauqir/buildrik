import type { NextAuthConfig } from "next-auth";
import { Prisma } from "@prisma/client";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/server/services/audit.service";
import { createWorkspaceForUser } from "@/server/services/auth.service";
import { generateToken, validateToken, invalidateToken } from "@/server/services/token.service";
import { cookies } from "next/headers";

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
      // Phase 2b: User-initiated provider linking.
      // If a buildrik_link_token cookie is present, this is a link flow — not a login.
      // Fail-closed: cookie present but invalid → redirect to error, never fall through.
      if (account) {
        const cookieStore = await cookies();
        const linkTokenValue = cookieStore.get("buildrik_link_token")?.value;

        if (linkTokenValue !== undefined) {
          // Always consume the cookie, regardless of outcome.
          cookieStore.delete("buildrik_link_token");

          const emailVerified = (profile as Record<string, unknown>)?.email_verified;
          if (emailVerified === false) {
            return "/dashboard/settings/account?link_error=email_not_verified";
          }

          const targetUserId = await validateToken(linkTokenValue, "link_token");
          if (!targetUserId) {
            return "/dashboard/settings/account?link_error=invalid_token";
          }

          // Enforce email match: the OAuth provider email must match the Buildrik account.
          const targetUser = await prisma.user.findUnique({
            where: { id: targetUserId },
            select: { email: true },
          });
          if (!targetUser || targetUser.email !== user.email) {
            await invalidateToken(linkTokenValue);
            return "/dashboard/settings/account?link_error=email_mismatch";
          }

          try {
            await prisma.account.upsert({
              where: {
                provider_providerAccountId: {
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                },
              },
              create: {
                userId: targetUserId,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                type: account.type,
              },
              update: {},
            });
          } catch (err) {
            await invalidateToken(linkTokenValue);
            if (
              err instanceof Prisma.PrismaClientKnownRequestError &&
              err.code === "P2002"
            ) {
              return "/dashboard/settings/account?link_error=already_linked";
            }
            console.error("[auth] Account link upsert failed:", err);
            return "/dashboard/settings/account?link_error=server_error";
          }

          await invalidateToken(linkTokenValue);
          await logAuditEvent("OAUTH_LINK", "success", {
            userId: targetUserId,
            metadata: { provider: account.provider },
          });
          return `/dashboard/settings/account?linked=${account.provider}`;
        }
      }

      if (account && user.email) {
        // Step 1: Reject unverified emails.
        // GitHub omits email_verified entirely — treat undefined as verified.
        // Only an explicit false is rejected.
        const emailVerified = (profile as Record<string, unknown>)?.email_verified;
        if (emailVerified === false) return false;

        // Step 2: Account-first lookup — provider identity wins over email.
        // This closes the email-only linking vulnerability: if providerAccountId
        // is already bound to a userId, that binding is authoritative.
        const existingAccount = await prisma.account.findFirst({
          where: {
            provider: account.provider,
            providerAccountId: account.providerAccountId,
          },
        });

        if (existingAccount) {
          user.id = existingAccount.userId;
          // Fetch emailVerified so we can stamp it if the user registered but
          // never verified — OAuth login proves email ownership.
          const accountUser = await prisma.user.findUnique({
            where: { id: existingAccount.userId },
            select: { emailVerified: true },
          });
          try {
            await prisma.user.update({
              where: { id: existingAccount.userId },
              data: {
                lastLoginAt: new Date(),
                emailVerified: accountUser?.emailVerified ?? new Date(),
              },
            });
            // Upsert is a no-op here (account row already exists) but kept for
            // consistency — any future update fields go in the update block.
            await prisma.account.upsert({
              where: {
                provider_providerAccountId: {
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                },
              },
              create: {
                userId: existingAccount.userId,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                type: account.type,
              },
              update: {},
            });
          } catch (err) {
            if (
              err instanceof Prisma.PrismaClientKnownRequestError &&
              err.code === "P2002"
            ) {
              // @@unique([userId, provider]) violation — user already has a
              // different account for this provider. Reject sign-in.
              await logAuditEvent("OAUTH_LOGIN", "failure", {
                email: user.email,
                metadata: { reason: "duplicate_provider_account" },
              });
              return false;
            }
            console.error("[auth] Account upsert failed (account-first path):", err);
            return false;
          }
          await logAuditEvent("OAUTH_LOGIN", "success", {
            userId: existingAccount.userId,
            email: user.email,
          });
        } else {
          // Step 3: Fall back to email lookup — handles credential users who
          // have never done OAuth (lazy backfill on first OAuth login).
          const existing = await prisma.user.findUnique({
            where: { email: user.email },
          });

          if (!existing) {
            // Step 4: New user — create user, workspace, and account atomically.
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
              await tx.account.upsert({
                where: {
                  provider_providerAccountId: {
                    provider: account.provider,
                    providerAccountId: account.providerAccountId,
                  },
                },
                create: {
                  userId: newUser.id,
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                  type: account.type,
                },
                update: {},
              });
              return newUser;
            });
            user.id = created.id;
            await logAuditEvent("OAUTH_SIGNUP", "success", {
              userId: created.id,
              email: user.email,
            });
          } else {
            // Step 5: Existing credential user — lazy backfill Account row.
            user.id = existing.id;
            try {
              await prisma.user.update({
                where: { id: existing.id },
                data: {
                  lastLoginAt: new Date(),
                  // Stamp emailVerified if still unverified — OAuth proves ownership.
                  emailVerified: existing.emailVerified ?? new Date(),
                },
              });
              await prisma.account.upsert({
                where: {
                  provider_providerAccountId: {
                    provider: account.provider,
                    providerAccountId: account.providerAccountId,
                  },
                },
                create: {
                  userId: existing.id,
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                  type: account.type,
                },
                update: {},
              });
            } catch (err) {
              if (
                err instanceof Prisma.PrismaClientKnownRequestError &&
                err.code === "P2002"
              ) {
                // @@unique([userId, provider]) violation — user already has a
                // different account for this provider.
                await logAuditEvent("OAUTH_LOGIN", "failure", {
                  userId: existing.id,
                  email: user.email,
                  metadata: { reason: "duplicate_provider_account" },
                });
                return false;
              }
              console.error("[auth] Account upsert failed (email-fallback path):", err);
              return false;
            }
            await logAuditEvent("OAUTH_LOGIN", "success", {
              userId: existing.id,
              email: user.email,
            });
          }
        }

        // Gate OAuth login behind 2FA if user has it enabled.
        // Return a redirect URL — NextAuth will redirect without creating a session.
        // The 2FA page completes login via createClientSession (same as credential flow).
        const resolvedUser = await prisma.user.findUnique({
          where: { id: user.id as string },
          select: { twoFactorEnabled: true },
        });
        if (resolvedUser?.twoFactorEnabled) {
          const tempToken = await generateToken("2fa_temp", user.id as string, 5);
          return `/auth/2fa?token=${tempToken}`;
        }

        // Route all OAuth logins through createClientSession so rememberMe is
        // respected and session duration is consistent with credential logins.
        const sessionGrant = await generateToken("session_grant", user.id as string, 5);
        return `/auth/oauth-redirect?token=${sessionGrant}`;
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
      if (token.dbSessionId) {
        token.dbSessionId = token.dbSessionId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.userId) {
        session.user.id = token.userId as string;
      }
      if (token.dbSessionId) {
        session.user.dbSessionId = token.dbSessionId as string;
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
