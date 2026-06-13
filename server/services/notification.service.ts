import { prisma } from "@/lib/prisma";
import { NOTIFICATION_TYPE_CATEGORY } from "@/lib/constants/enums";
import { MENTION_NOTIFICATION_TYPES, type ListNotificationsInput } from "@buildrik/shared/schemas/notifications";

export async function listNotifications(userId: string, input: ListNotificationsInput) {
  const { page = 1, perPage = 20, filter = "all" } = input;

  const where: Record<string, unknown> = { userId };
  if (filter === "unread") where.read = false;
  if (filter === "mentions") where.type = { in: [...MENTION_NOTIFICATION_TYPES] };

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

export async function markAsRead(notificationId: string, userId: string, read = true) {
  // Scoped update: only the owner can flip their notification (IDOR guard).
  // `read` is honored so the UI's read/unread TOGGLE works — it previously
  // hardset true, so "Mark as unread" silently re-marked the item read.
  return prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { read },
  });
}

export async function markAllAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
}

export async function deleteNotification(notificationId: string, userId: string) {
  // Scoped delete — only the owner can remove their notification (IDOR guard).
  return prisma.notification.deleteMany({
    where: { id: notificationId, userId },
  });
}

// "Mute this type" maps the notification type to its preference category and
// turns off the in-app toggle there, so future notifications of that type are
// suppressed by createNotification (notification.trigger).
export async function muteNotificationType(userId: string, type: string) {
  const category = NOTIFICATION_TYPE_CATEGORY[type];
  if (!category) throw new Error("UNKNOWN_NOTIFICATION_TYPE");
  return prisma.notificationPref.upsert({
    where: { userId_category: { userId, category } },
    create: { userId, category, inApp: false },
    update: { inApp: false },
  });
}

export async function getRecentNotifications(userId: string, limit = 5) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function listGroupedNotifications(
  userId: string,
  filter: "all" | "unread" | "mentions" = "all"
) {
  const where: Record<string, unknown> = { userId };
  if (filter === "unread") where.read = false;
  if (filter === "mentions") where.type = { in: [...MENTION_NOTIFICATION_TYPES] };

  const notifications = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // Group same-actor + same-type within 1hr
  const groups: Array<{
    id: string;
    actorName: string | null;
    type: string;
    notifications: typeof notifications;
    count: number;
    latestAt: Date;
    allRead: boolean;
  }> = [];

  for (const n of notifications) {
    const key = `${n.actorId ?? "system"}-${n.type}`;
    const last = groups[groups.length - 1];
    if (last && `${last.notifications[0].actorId ?? "system"}-${last.notifications[0].type}` === key) {
      const timeDiff = last.notifications[last.notifications.length - 1].createdAt.getTime() - n.createdAt.getTime();
      if (timeDiff < 3600000) {
        last.notifications.push(n);
        last.count++;
        last.allRead = last.allRead && n.read;
        continue;
      }
    }
    groups.push({
      id: n.id,
      actorName: n.actorName,
      type: n.type,
      notifications: [n],
      count: 1,
      latestAt: n.createdAt,
      allRead: n.read,
    });
  }

  return { groups };
}
