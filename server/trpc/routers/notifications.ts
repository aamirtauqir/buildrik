import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import {
  listNotifications, getUnreadCount, markAsRead, markAllAsRead, getRecentNotifications,
} from "@/server/services/notification.service";
import { listNotificationsSchema } from "@/lib/validations/notifications";

export const notificationsRouter = router({
  list: protectedProcedure.input(listNotificationsSchema).query(async ({ ctx, input }) => {
    return listNotifications(ctx.session.user.id, input);
  }),
  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    return getUnreadCount(ctx.session.user.id);
  }),
  markRead: protectedProcedure
    .input(z.object({ notificationId: z.string() }))
    .mutation(async ({ input }) => {
      return markAsRead(input.notificationId);
    }),
  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    return markAllAsRead(ctx.session.user.id);
  }),
  recent: protectedProcedure.query(async ({ ctx }) => {
    return getRecentNotifications(ctx.session.user.id);
  }),
});
