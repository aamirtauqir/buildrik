import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../trpc";
import {
  listNotifications, getUnreadCount, markAsRead, markAllAsRead, getRecentNotifications,
  listGroupedNotifications, deleteNotification, muteNotificationType,
} from "@/server/services/notification.service";
import { listNotificationsSchema } from "@buildrik/shared/schemas/notifications";

export const notificationsRouter = router({
  list: protectedProcedure.input(listNotificationsSchema).query(async ({ ctx, input }) => {
    return listNotifications(ctx.session.user.id, input);
  }),
  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    return getUnreadCount(ctx.session.user.id);
  }),
  markRead: protectedProcedure
    .input(z.object({ notificationId: z.string(), read: z.boolean().optional().default(true) }))
    .mutation(async ({ ctx, input }) => {
      return markAsRead(input.notificationId, ctx.session.user.id, input.read);
    }),
  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    return markAllAsRead(ctx.session.user.id);
  }),
  delete: protectedProcedure
    .input(z.object({ notificationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return deleteNotification(input.notificationId, ctx.session.user.id);
    }),
  muteType: protectedProcedure
    .input(z.object({ type: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        return await muteNotificationType(ctx.session.user.id, input.type);
      } catch (e: unknown) {
        if (e instanceof Error && e.message === "UNKNOWN_NOTIFICATION_TYPE")
          throw new TRPCError({ code: "BAD_REQUEST", message: "Unknown notification type." });
        throw e;
      }
    }),
  recent: protectedProcedure.query(async ({ ctx }) => {
    return getRecentNotifications(ctx.session.user.id);
  }),
  listGrouped: protectedProcedure
    .input(z.object({ filter: z.enum(["all", "unread", "mentions"]).optional().default("all") }))
    .query(async ({ ctx, input }) => listGroupedNotifications(ctx.session.user.id, input.filter)),
});
