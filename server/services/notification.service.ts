import { prisma } from "@/lib/prisma";
import type { ListNotificationsInput } from "@/lib/validations/notifications";

export async function listNotifications(userId: string, input: ListNotificationsInput) {
  const { page = 1, perPage = 20, filter = "all" } = input;

  const where: Record<string, unknown> = { userId };
  if (filter === "unread") where.read = false;
  if (filter === "mentions") where.type = "mention";

  const [total, data] = await Promise.all([
    prisma.notification.count({ where }),
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
  ]);

  return { data, total, page, perPage };
}

export async function getUnreadCount(userId: string) {
  return prisma.notification.count({
    where: { userId, read: false },
  });
}

export async function markAsRead(notificationId: string) {
  return prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  });
}

export async function markAllAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
}

export async function getRecentNotifications(userId: string, limit = 5) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
