import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import { cookies } from "next/headers";
import { decode } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/server/services/audit.service";
import { createWorkspaceForUser } from "@/server/services/auth.service";

// CRITICAL N1 fix round 4 (controller, merge-gate tsc): type the GitHub
// `userinfo.request` override's parameter from @auth/core's own types
// without importing `@auth/core` directly — it's a transitive dependency of
// `next-auth`, not hoisted into this package's own node_modules under pnpm's
// strict layout, so a direct `@auth/core/providers/oauth` import would be a
// phantom-dependency risk. Deriving the type from the already-imported
// `GitHub` provider factory's own parameter type reaches the exact same
// `UserinfoEndpointHandler["request"]` type structurally, through a
// dependency this file already declares.
type GitHubUserinfoConfig = NonNullable<Parameters<typeof GitHub>[0]>["userinfo"];
type GitHubUserinfoRequest = NonNullable<Extract<GitHubUserinfoConfig, { request?: unknown }>["request"]>;
type GitHubUserinfoRequestContext = Parameters<GitHubUserinfoRequest>[0];

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
      // CRITICAL N1 (controller ruling, fix round 2): the default @auth/core
      // GitHub provider does NOT prove the email it hands back is verified.
      // It uses `/user`'s `email` field (the user's chosen "public email" —
      // settable to any address they merely typed in, not necessarily one
      // GitHub itself verified) and, only when that's blank, falls back to
      // `/user/emails`'s `find(e => e.primary) ?? emails[0]` — primary, not
      // verified, and it NEVER reads the `verified` field at all. An
      // attacker can add a victim's address to their own GitHub account
      // (GitHub allows adding an unverified email) and have it returned
      // here. This override ignores `/user`'s email entirely and always
      // asks `/user/emails`, picking the primary+verified address, else any
      // verified address, else none — a missing email makes `signIn` below
      // refuse the sign-in instead of trusting an unverified fallback.
      userinfo: {
        url: "https://api.github.com/user",
        async request({ tokens }: GitHubUserinfoRequestContext) {
          const headers = {
            Authorization: `Bearer ${tokens.access_token}`,
            "User-Agent": "authjs",
          };
          const profile = await fetch("https://api.github.com/user", { headers }).then((res) => res.json());

          const emailsRes = await fetch("https://api.github.com/user/emails", { headers });
          let verifiedEmail: string | undefined;
          if (emailsRes.ok) {
            const emails = (await emailsRes.json()) as Array<{
              email: string;
              primary: boolean;
              verified: boolean;
            }>;
            verifiedEmail =
              emails.find((e) => e.primary && e.verified)?.email ?? emails.find((e) => e.verified)?.email;
          }
          profile.email = verifiedEmail ?? null;
          return profile;
        },
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error/social-error",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // CRITICAL N1 (controller ruling, fix round 2): checking `user.email`
      // in this condition (as the previous version did) let a provider with
      // NO verified email fall all the way through to the unconditional
      // `return true` at the bottom — signing in with a bare provider `id`
      // and no DB user.id set, instead of being refused. Gate on `account`
      // alone and refuse explicitly below when there's no trusted email.
      if (account) {
        // IMPORTANT (controller ruling, fix round 3) — account-first: resolve
        // identity by the PHYSICAL provider link before any email-based
        // branching. The previous ordering decided create/clear/link by
        // looking up `user.email` first and only checked for an existing
        // provider link afterward (the ownership guard at the bottom) — so a
        // user who changes which email their provider reports as verified
        // between logins hit the "no existing row for this email" branch,
        // created a SECOND, orphaned "verified" user + workspace for the new
        // email, and only THEN got refused by the ownership guard. Every
        // later login from that provider would keep hitting the orphan
        // (never the original account, which password signup can no longer
        // reclaim once EMAIL_EXISTS — permanent lockout from the account
        // this really is).
        //
        // A provider_providerAccountId match now settles identity
        // completely: sign in as whichever user that physical account is
        // already linked to, ignoring whatever email the provider reports
        // THIS time, with NO writes ("bump nothing else" — no lastLoginAt,
        // no emailVerified, no credential clearing, no audit log). Setting
        // `user.id` here is sufficient for the `jwt` callback below to
        // resolve the LINKED user, not an email-matched one — verified by
        // this file's own existing pattern (every branch below already
        // relies on exactly this to attach a DB id to the session).
        if (account.providerAccountId) {
          const linkedAccount = await prisma.account.findUnique({
            where: {
              provider_providerAccountId: {
                provider: account.provider,
                providerAccountId: account.providerAccountId,
              },
            },
            select: { userId: true },
          });
          if (linkedAccount) {
            user.id = linkedAccount.userId;
            return true;
          }
        }

        // No existing link for this provider identity — first-time login or
        // first-time link. The ownership guard further down is now
        // unreachable by construction (we just proved no Account row exists
        // for this provider_providerAccountId), kept only as defense in
        // depth against a race between this read and the eventual upsert.
        //
        // Never link/log-in on an UNVERIFIED provider email — otherwise an
        // attacker who sets a victim's address as an unverified email on
        // their own provider account could take over the victim's Buildrick
        // account. Google asserts `email_verified` on the ID token profile.
        // GitHub has no such single flag — the provider's own `userinfo`
        // override above already resolves `profile.email` to an address
        // GitHub's `/user/emails` reports `verified: true` for (or `null` if
        // none), so "GitHub gave us an email at all" IS the verification
        // signal here, not a hardcoded trust.
        const emailVerified =
          account.provider === "google"
            ? (profile as { email_verified?: boolean } | undefined)?.email_verified === true
            : account.provider === "github"
              ? Boolean((profile as { email?: string | null } | undefined)?.email)
              : false;
        // This SAME check gates every path below it — new-user creation, the
        // never-verified-row clearing branch, AND the already-verified-row
        // link/login branch — so an unverified provider email can never
        // create, clear-and-take-over, or link into any row.
        if (!emailVerified || !user.email) {
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

          if (!existing.emailVerified) {
            // CRITICAL 2 (controller ruling, fix round 1) / S-5 anti-pre-
            // account-hijack: OAuth already proved control of this email —
            // `emailVerified` above is true only for a Google-asserted
            // `email_verified` ID-token claim or a GitHub email the
            // provider's own `userinfo` override (CRITICAL N1, fix round 2)
            // resolved via `/user/emails`'s `verified: true` flag — so this
            // IS the real owner's first verification of a never-verified
            // row. Same clearing as verifyMagicLink: an attacker who
            // pre-registered this address with a known password must not
            // keep access once the real owner signs in through their
            // provider. No oauth-conflict redirect here — an unverified row
            // was never provably the password-setter's in the first place.
            await prisma.user.update({
              where: { id: existing.id },
              data: {
                emailVerified: new Date(),
                passwordHash: null,
                twoFactorEnabled: false,
                twoFactorSecret: null,
                backupCodes: [],
                sessionVersion: { increment: 1 },
                lastLoginAt: new Date(),
              },
            });
            user.id = existing.id;
            await logAuditEvent("OAUTH_LOGIN", "success", { userId: existing.id, email: user.email });
          } else {
            // A fresh PUBLIC OAuth login (not the owner self-linking from
            // Settings) into an ALREADY-VERIFIED password account whose
            // provider isn't linked yet → do NOT silently link it; send them
            // to use their password. This prevents login-method confusion +
            // email-based account absorption.
            if (existing.passwordHash && !providerLinked && !isSelfLink) {
              return `/auth/oauth-conflict?email=${encodeURIComponent(user.email)}`;
            }
            user.id = existing.id;
            await prisma.user.update({ where: { id: existing.id }, data: { lastLoginAt: new Date() } });
            await logAuditEvent("OAUTH_LOGIN", "success", { userId: existing.id, email: user.email });
          }
        }

        // Record the provider link so Settings → Account can show + manage
        // connected accounts. The provider already authenticated this email,
        // so the link is verified by the OAuth handshake itself.
        if (account.providerAccountId && user.id) {
          const linkedElsewhere = await prisma.account.findUnique({
            where: {
              provider_providerAccountId: {
                provider: account.provider,
                providerAccountId: account.providerAccountId,
              },
            },
            select: { userId: true },
          });
          // CRITICAL N1 (fix round 2) / IMPORTANT (fix round 3, controller
          // rulings): `update: { userId }` on a provider_providerAccountId
          // conflict would silently REASSIGN an existing provider link from
          // whichever user it currently belongs to onto `user.id` — a
          // provider identity's ownership must be permanent once
          // established. The account-first lookup at the top of this
          // callback already makes this branch unreachable in the normal
          // case (we already proved no Account row exists for this
          // provider_providerAccountId before doing any create/update/clear
          // above) — this re-check is defense in depth against a
          // TOCTOU race between that read and this upsert, not the primary
          // guard anymore.
          if (linkedElsewhere && linkedElsewhere.userId !== user.id) {
            return "/auth/error/social-error?reason=provider-linked-elsewhere";
          }
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
        // OAuth sign-in mints its token here rather than through
        // /api/auth/create-session, so stamp the revocation version on it too —
        // otherwise OAuth users would be permanently un-revocable.
        const fresh = await prisma.user.findUnique({
          where: { id: user.id },
          select: { sessionVersion: true },
        });
        token.sv = fresh?.sessionVersion ?? 0;
        // `findFirst` with no ordering returned an ARBITRARY workspace for anyone
        // in more than one — so which workspace you landed in was down to whatever
        // Postgres handed back first. Prefer the one they last used; /auth/redirect
        // sends multi-workspace users to the chooser anyway, this is the fallback.
        const member = await prisma.workspaceMember.findFirst({
          where: { userId: user.id, status: "ACTIVE" },
          orderBy: [{ lastActiveAt: "desc" }, { joinedAt: "asc" }],
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

      // ── Revocation gate ────────────────────────────────────────────────
      // Sessions are JWT-strategy with no adapter, so the `sessions` table is a
      // display list, not a gate: every "Revoke session", "Revoke all other
      // sessions", and the password-reset "signs you out everywhere" deleted
      // rows while the cookie stayed valid for its full 30 days. A stolen cookie
      // survived the victim's password reset. This callback runs on EVERY
      // `auth()` call (@auth/core lib/actions/session.js), and returning null is
      // the supported kill switch, so this is where the gate belongs.
      //
      //   token.sv ?? 0   vs   user.sessionVersion
      //   ─────────────────────────────────────────────────────────────
      //   old cookie, no revocation yet →  0 vs 0  → valid (no mass logout)
      //   old cookie, after a reset     →  0 vs 1  → NULL  (hole closed now)
      //   DB unreachable                →  fail OPEN, see below
      //
      // Reading a missing claim as 0 is what lets this ship without logging
      // everyone out AND still kill pre-deploy cookies the moment their owner
      // revokes anything. Blanket-grandfathering would have kept the exact hole
      // open for the full cookie lifetime.
      if (typeof token.userId === "string") {
        try {
          const current = await prisma.user.findUnique({
            where: { id: token.userId },
            select: { sessionVersion: true },
          });
          // User deleted → no session. Version moved on → this cookie predates a
          // revocation the user asked for.
          if (!current) return null;
          if (current.sessionVersion !== (typeof token.sv === "number" ? token.sv : 0)) return null;
        } catch (e) {
          // Deliberately fail OPEN. This runs on every request, so failing
          // closed would turn a transient Postgres blip into a total auth
          // outage for every signed-in user. The tradeoff is explicit: a
          // revoked session survives while the DB is unreachable. (Contrast
          // with billing, where failing closed is correct because money moves.)
          console.error("[auth] sessionVersion check failed, allowing request", e);
        }
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
      // The DB session id (baked at create-session) — lets the Security tab
      // identify THIS session across JWT rotation.
      session.user.sessionId = typeof token.sid === "string" ? token.sid : null;
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
