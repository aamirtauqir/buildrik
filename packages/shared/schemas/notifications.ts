import { z } from "zod";

/** Notification.type values that count as "mentions" for the mentions
 *  filter. Centralized here so listNotifications + listGroupedNotifications
 *  classify the same way — pre-fix they diverged (one used type="mention"
 *  string equality, the other this 3-type set).
 *
 *  Notification.type is stored as a free-form string in Prisma. Add new
 *  mention-like types here and both queries pick them up. */
export const MENTION_NOTIFICATION_TYPES = [
  "MEMBER_INVITED",
  "SITE_TRANSFERRED",
  "FEEDBACK_RECEIVED",
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
