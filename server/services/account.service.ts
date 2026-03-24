import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS, type PlanName } from "@/lib/constants/plan-limits";
import type { UpdateProfileInput, NotificationPrefInput } from "@/lib/validations/account";

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

export async function revokeSession(sessionId: string) {
  return prisma.session.delete({
    where: { id: sessionId },
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

  return prisma.accountDeletionReq.create({
    data: {
      userId,
      reason,
      scheduledAt,
    },
  });
}

export async function requestDataExport(userId: string) {
  return prisma.exportJob.create({
    data: {
      userId,
      status: "PENDING",
    },
  });
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
