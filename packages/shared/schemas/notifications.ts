import { z } from "zod";

/** Notification.type values for the "Mentions" (directed-at-you) filter.
 *  Centralized so listNotifications + listGroupedNotifications classify the
 *  same way.
 *
 *  These MUST be types actually produced as notifications (createNotification),
 *  or the tab is permanently empty. The old list (MEMBER_INVITED /
 *  SITE_TRANSFERRED / FEEDBACK_RECEIVED) was activity-log actions or never
 *  produced. The account-security + billing events below are the real
 *  personally-directed notifications the app emits (account.service +
 *  stripe-webhook). Notification.type is a free-form string in Prisma. */
export const MENTION_NOTIFICATION_TYPES = [
  "SECURITY_PASSWORD_CHANGED",
  "SECURITY_2FA_CHANGED",
  "SECURITY_LOGIN_NEW_DEVICE",
  "PAYMENT_FAILED",
] as const;

export type MentionNotificationType = (typeof MENTION_NOTIFICATION_TYPES)[number];

export const notificationSchema = z.object({
  id: z.string(),
  type: z.string(),
  actorName: z.string().nullable(),
  message: z.string(),
  actionUrl: z.string().nullable(),
  read: z.boolean(),
  priority: z.string(),
  createdAt: z.date(),
});

export const listNotificationsSchema = z.object({
  page: z.number().min(1).default(1),
  perPage: z.number().default(20),
  filter: z.enum(["all", "unread", "mentions"]).default("all"),
});

export type NotificationData = z.infer<typeof notificationSchema>;
export type ListNotificationsInput = z.infer<typeof listNotificationsSchema>;
