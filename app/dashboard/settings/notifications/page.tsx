"use client";

import { trpc } from "@/lib/trpc/client";
import { useToast } from "@/components/dashboard/toast-provider";
import { NotificationPrefs } from "@/components/settings/notification-prefs";

export default function NotificationsPage() {
  const { addToast } = useToast();
  const prefsQuery = trpc.account.notifications.list.useQuery();
  const updateMutation = trpc.account.notifications.update.useMutation({
    onSuccess: () => { prefsQuery.refetch(); addToast("success", "Preferences updated"); },
  });

  if (prefsQuery.isLoading) return <div className="h-64 animate-pulse rounded-xl" style={{ backgroundColor: "#F4F4F4" }} />;

  return (
    <NotificationPrefs
      prefs={prefsQuery.data ?? []}
      onUpdate={(category, inApp, email) =>
        updateMutation.mutate({ category, inApp, email: email as "instant" | "digest" | "off" })
      }
    />
  );
}
