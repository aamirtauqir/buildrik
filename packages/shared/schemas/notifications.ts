import { z } from "zod";

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
