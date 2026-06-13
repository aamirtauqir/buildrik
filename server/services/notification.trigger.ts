import { prisma } from "@/lib/prisma";
import { NOTIFICATION_TYPE_CATEGORY } from "@/lib/constants/enums";

interface CreateNotificationInput {
  userId: string;
  type: string;
  message: string;
  actorId?: string;
  actorName?: string;
  actionUrl?: string;
  priority?: "high" | "medium" | "low";
}

const HIGH_PRIORITY_TYPES = [
  "PAYMENT_FAILED",
  "SECURITY_LOGIN_NEW_DEVICE",
  "SECURITY_PASSWORD_CHANGED",
  "SECURITY_2FA_CHANGED",
];

export async function createNotification(input: CreateNotificationInput) {
  // Honor the user's in-app preference for this type's category. No pref row
  // = default on (matches the UI's default). Unmapped types always insert.
  const category = NOTIFICATION_TYPE_CATEGORY[input.type];
  if (category) {
    const pref = await prisma.notificationPref.findUnique({
      where: { userId_category: { userId: input.userId, category } },
      select: { inApp: true },
    });
    if (pref && !pref.inApp) return;
  }

  const priority = input.priority ?? (HIGH_PRIORITY_TYPES.includes(input.type) ? "high" : "medium");
  try {
    return await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        message: input.message,
        actorId: input.actorId,
        actorName: input.actorName,
        actionUrl: input.actionUrl,
        priority,
      },
    });
  } catch {
    // Notification failure should never block the primary operation
  }
}

export async function notifyWorkspaceOwner(workspaceId: string, type: string, message: string, actionUrl?: string) {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { ownerId: true },
  });
  if (!workspace) return;
  return createNotification({ userId: workspace.ownerId, type, message, actionUrl });
}
