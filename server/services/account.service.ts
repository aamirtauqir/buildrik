import { randomInt } from "crypto";
import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS, type PlanName } from "@/lib/constants/plan-limits";
import type { UpdateProfileInput, NotificationPrefInput, UpdatePreferencesInput } from "@/lib/validations/account";
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
    data: { passwordHash: hash, passwordChangedAt: new Date() },
  });

  createNotification({
    userId,
    type: "SECURITY_PASSWORD_CHANGED",
    message: "Your password was changed",
    priority: "high",
  }).catch(() => {});
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
  return prisma.user.findUnique({
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
    },
  });
}

export async function updateProfile(userId: string, data: UpdateProfileInput) {
  return prisma.user.update({
    where: { id: userId },
    data,
  });
}

export async function getActiveSessions(userId: string) {
  return prisma.session.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function revokeSession(sessionId: string, userId: string) {
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

export async function requestAccountDeletion(userId: string, reason?: string) {
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

export async function requestDataExport(userId: string) {
  return prisma.exportJob.create({
    data: {
      userId,
      status: "PENDING",
    },
  });
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
  const otpauth = authenticator.keyuri(user.email, "Buildrik", secret);

  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const randomChars = (n: number) =>
    Array.from({ length: n }, () => chars[randomInt(0, chars.length)]).join("");
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

export async function disable2FA(userId: string, password: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("USER_NOT_FOUND");

  if (user.passwordHash) {
    const bcrypt = await import("bcryptjs");
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new Error("WRONG_PASSWORD");
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
