import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS, type PlanName } from "@/lib/constants/plan-limits";
import type { UpdateProfileInput, NotificationPrefInput, UpdatePreferencesInput } from "@buildrik/shared/schemas/account";
import { sendAccountDeletionEmail, sendEmailChangedEmail } from "@/server/services/email.service";
import { createNotification } from "@/server/services/notification.trigger";
import { generateToken } from "@/server/services/token.service";

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.passwordHash) throw new Error("NO_PASSWORD");

  const bcrypt = await import("bcryptjs");
  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) throw new Error("WRONG_PASSWORD");

  const hash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: hash },
  });

  createNotification({
    userId,
    type: "SECURITY_PASSWORD_CHANGED",
    message: "Your password was changed",
    priority: "high",
  }).catch(() => {});
}

// Set an INITIAL password for an OAuth-only account (no existing password).
// changePassword can't do this — it requires the current password — so the
// "Set a password" UI for social users was a no-op (onSetPassword unwired,
// no procedure). Refuses if a password already exists (use changePassword).
export async function setPassword(userId: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { passwordHash: true } });
  if (!user) throw new Error("USER_NOT_FOUND");
  if (user.passwordHash) throw new Error("PASSWORD_ALREADY_SET");

  const bcrypt = await import("bcryptjs");
  const hash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: hash } });

  createNotification({
    userId,
    type: "SECURITY_PASSWORD_CHANGED",
    message: "A password was added to your account",
    priority: "high",
  }).catch(() => {});

  return { success: true };
}

export async function requestEmailChange(userId: string, newEmail: string, password: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("USER_NOT_FOUND");

  if (user.passwordHash) {
    const bcrypt = await import("bcryptjs");
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new Error("WRONG_PASSWORD");
  }

  const taken = await prisma.user.findUnique({ where: { email: newEmail }, select: { id: true } });
  if (taken) throw new Error("EMAIL_TAKEN");

  const token = await generateToken("email_change", `${userId}:${newEmail}`, 60 * 24); // 24h
  sendEmailChangedEmail(newEmail, token).catch(() => {});
}

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      displayName: true,
      email: true,
      avatar: true,
      bio: true,
      twoFactorEnabled: true,
      language: true,
      timezone: true,
      passwordHash: true,
      accounts: { select: { provider: true } },
    },
  });
  if (!user) return null;
  const { passwordHash, accounts, ...rest } = user;
  return {
    ...rest,
    hasPassword: passwordHash !== null,
    connectedAccounts: accounts
      .filter((a): a is { provider: "google" | "github" } =>
        a.provider === "google" || a.provider === "github"
      )
      .map((a) => ({ provider: a.provider, email: user.email })),
  };
}

export async function disconnectProvider(userId: string, provider: "google" | "github") {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true, accounts: { select: { provider: true } } },
  });
  if (!user) throw new Error("USER_NOT_FOUND");

  const linked = user.accounts.filter((a) => a.provider === provider);
  if (linked.length === 0) throw new Error("NOT_CONNECTED");

  // Never strand a user with no way back in: disconnecting is only allowed
  // when they keep at least one other login method (a password, or another
  // linked provider).
  const otherAccounts = user.accounts.filter((a) => a.provider !== provider);
  const hasOtherLoginMethod = user.passwordHash !== null || otherAccounts.length > 0;
  if (!hasOtherLoginMethod) throw new Error("LAST_LOGIN_METHOD");

  await prisma.account.deleteMany({ where: { userId, provider } });
  return { ok: true as const };
}

export async function updateProfile(userId: string, data: UpdateProfileInput) {
  return prisma.user.update({
    where: { id: userId },
    data,
  });
}

export async function getActiveSessions(userId: string, currentSessionId?: string | null) {
  // "Active" means unexpired — expired rows linger until the cleanup cron
  // runs and must not appear in the Security tab's Active sessions list.
  const rows = await prisma.session.findMany({
    where: { userId, expires: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  // Flag the request's own session (id carried in the JWT `sid` claim) so the UI
  // can badge it "Current" and offer "Revoke all others". sessionToken is an
  // internal column — stripped, never shipped to the client.
  return rows.map(({ sessionToken: _sessionToken, ...s }) => ({
    ...s,
    isCurrent: currentSessionId != null && s.id === currentSessionId,
  }));
}

export async function revokeSession(sessionId: string, userId: string) {
  // Scoped delete: a session id owned by another user matches zero rows, so
  // one user cannot revoke another's session (IDOR guard).
  return prisma.session.deleteMany({
    where: { id: sessionId, userId },
  });
}

export async function revokeAllOtherSessions(userId: string, currentSessionId: string) {
  return prisma.session.deleteMany({
    where: {
      userId,
      id: { not: currentSessionId },
    },
  });
}

export async function getLoginHistory(userId: string) {
  return prisma.loginAttempt.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
}

export async function getNotificationPrefs(userId: string) {
  return prisma.notificationPref.findMany({
    where: { userId },
  });
}

export async function updateNotificationPref(userId: string, input: NotificationPrefInput) {
  return prisma.notificationPref.upsert({
    where: { userId_category: { userId, category: input.category } },
    create: {
      userId,
      category: input.category,
      inApp: input.inApp,
      email: input.email,
    },
    update: {
      inApp: input.inApp,
      email: input.email,
    },
  });
}

/**
 * Blockers that must be cleared before an account can be deleted. A sole owner
 * of a shared workspace, or an owner of a workspace with a live subscription,
 * would orphan that workspace (and keep a paying subscription running) — so the
 * UI disables the button and the mutation refuses.
 */
export async function getAccountDeletionEligibility(userId: string) {
  const owned = await prisma.workspace.findMany({
    where: { ownerId: userId, deletedAt: null },
    select: {
      subscription: { select: { status: true } },
      _count: { select: { members: { where: { status: "ACTIVE" } } } },
    },
  });
  // Sole owner of a workspace that has OTHER active members — deleting strands them.
  const isSoleOwner = owned.some((w) => w._count.members > 1);
  const hasActiveSubscription = owned.some(
    (w) => w.subscription != null && ["ACTIVE", "PAST_DUE"].includes(w.subscription.status),
  );
  return { isSoleOwner, hasActiveSubscription, blocked: isSoleOwner || hasActiveSubscription };
}

export class AccountDeletionBlockedError extends Error {
  constructor(public reasonCode: "SOLE_OWNER" | "ACTIVE_SUBSCRIPTION") {
    super(reasonCode);
    this.name = "AccountDeletionBlockedError";
  }
}

export async function requestAccountDeletion(userId: string, reason?: string) {
  // Enforce the same guard the UI shows — the UI check is advisory, this is
  // authoritative. Was missing entirely, so a sole owner could delete anyway.
  const eligibility = await getAccountDeletionEligibility(userId);
  if (eligibility.isSoleOwner) throw new AccountDeletionBlockedError("SOLE_OWNER");
  if (eligibility.hasActiveSubscription) throw new AccountDeletionBlockedError("ACTIVE_SUBSCRIPTION");

  const scheduledAt = new Date();
  scheduledAt.setDate(scheduledAt.getDate() + 30);

  const req = await prisma.accountDeletionReq.create({
    data: {
      userId,
      reason,
      scheduledAt,
    },
  });

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
  if (user) {
    sendAccountDeletionEmail(user.email, req.scheduledAt.toISOString()).catch(() => {});
  }

  return req;
}

/**
 * Synchronous personal-data export. Returns the user's account, their workspace
 * memberships, and the sites in those workspaces as a plain object the client
 * downloads as JSON. Replaces the old fire-and-forget exportJob that had no
 * processor — the UI promised "you'll be notified when ready" and never was.
 */
export async function getUserDataExport(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, email: true, fullName: true, displayName: true, bio: true,
      createdAt: true, emailVerified: true,
    },
  });
  if (!user) throw new Error("USER_NOT_FOUND");

  const memberships = await prisma.workspaceMember.findMany({
    where: { userId, status: "ACTIVE" },
    select: {
      role: true, joinedAt: true,
      workspace: { select: { id: true, name: true, slug: true, plan: true } },
    },
  });

  const workspaceIds = memberships.map((m) => m.workspace.id);
  const sites = workspaceIds.length
    ? await prisma.site.findMany({
        where: { workspaceId: { in: workspaceIds }, deletedAt: null },
        select: { id: true, name: true, slug: true, status: true, workspaceId: true, createdAt: true },
      })
    : [];

  const preferences = await prisma.userPreference.findUnique({ where: { userId } });

  return {
    exportedAt: new Date().toISOString(),
    account: user,
    preferences,
    workspaces: memberships.map((m) => ({ ...m.workspace, role: m.role, joinedAt: m.joinedAt })),
    sites,
  };
}

export async function getPreferences(userId: string) {
  const prefs = await prisma.userPreference.findUnique({ where: { userId } });
  return prefs ?? {
    siteViewMode: "grid",
    siteViewSort: null,
    analyticsRange: "7d",
    theme: "light",
    locale: null,
  };
}

export async function updatePreferences(userId: string, data: UpdatePreferencesInput) {
  return prisma.userPreference.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });
}

export async function enable2FA(userId: string) {
  const { authenticator } = await import("otplib");
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
  if (!user) throw new Error("USER_NOT_FOUND");

  const secret = authenticator.generateSecret();
  const otpauth = authenticator.keyuri(user.email, "Buildrick", secret);

  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const randomChars = (n: number) =>
    Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  const codes = Array.from({ length: 10 }, () => `${randomChars(4)}-${randomChars(4)}-${randomChars(4)}`);

  const { encryptSecret, hashBackupCodes } = await import("@/server/services/auth.service");
  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorSecret: encryptSecret(secret), backupCodes: await hashBackupCodes(codes) },
  });

  return { otpauth, secret, backupCodes: codes };
}

export async function confirm2FA(userId: string, code: string) {
  const { authenticator } = await import("otplib");
  const { decryptSecret } = await import("@/server/services/auth.service");

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { twoFactorSecret: true } });
  if (!user?.twoFactorSecret) throw new Error("2FA_NOT_SETUP");

  const secret = user.twoFactorSecret.includes(":")
    ? decryptSecret(user.twoFactorSecret)
    : user.twoFactorSecret;

  const valid = authenticator.verify({ token: code, secret });
  if (!valid) throw new Error("INVALID_CODE");

  await prisma.user.update({ where: { id: userId }, data: { twoFactorEnabled: true } });

  createNotification({
    userId,
    type: "SECURITY_2FA_CHANGED",
    message: "Two-factor authentication was enabled on your account",
    priority: "high",
  }).catch(() => {});

  return { success: true };
}

export async function disable2FA(userId: string, password: string, code?: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("USER_NOT_FOUND");

  if (user.passwordHash) {
    const bcrypt = await import("bcryptjs");
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new Error("WRONG_PASSWORD");
  } else {
    // OAuth-only account: no password to check, so the only proof-of-owner
    // we can demand is a current TOTP code. Skipping verification entirely
    // meant a hijacked session could silently strip 2FA.
    if (!code) throw new Error("CODE_REQUIRED");
    if (!user.twoFactorSecret) throw new Error("2FA_NOT_SETUP");
    const { authenticator } = await import("otplib");
    const { decryptSecret } = await import("@/server/services/auth.service");
    const secret = user.twoFactorSecret.includes(":")
      ? decryptSecret(user.twoFactorSecret)
      : user.twoFactorSecret;
    if (!authenticator.verify({ token: code, secret })) throw new Error("INVALID_CODE");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorEnabled: false, twoFactorSecret: null, backupCodes: [] },
  });

  createNotification({
    userId,
    type: "SECURITY_2FA_CHANGED",
    message: "Two-factor authentication was disabled on your account",
    priority: "high",
  }).catch(() => {});

  return { success: true };
}

export async function getAICreditsInfo(workspaceId: string, plan: PlanName) {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [history, used] = await Promise.all([
    prisma.aIGenerationJob.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.aIGenerationJob.count({
      where: {
        workspaceId,
        createdAt: { gte: startOfMonth },
      },
    }),
  ]);

  return {
    history,
    used,
    limit: PLAN_LIMITS[plan].aiGenerations as number,
  };
}
