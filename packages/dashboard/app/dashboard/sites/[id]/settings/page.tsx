"use client";

import { useParams } from "next/navigation";
import { trpc } from "@lib/trpc/client";
import { SettingsTab } from "@/components/site-detail/settings-tab";
import { useToast } from "@/components/dashboard/toast-provider";

export default function SiteSettingsPage() {
  const params = useParams();
  const siteId = params.id as string;
  const { addToast } = useToast();

  const settingsQuery = trpc.siteDetail.settings.get.useQuery({ siteId });
  const updateMutation = trpc.siteDetail.settings.update.useMutation({
    onSuccess: () => {
      settingsQuery.refetch();
      addToast("success", "Settings saved");
    },
    onError: (err) => addToast("error", "Failed to save", err.message),
  });

  if (settingsQuery.isLoading) {
    return <div className="h-64 animate-pulse rounded-xl" style={{ backgroundColor: "var(--color-bg-subtle)" }} />;
  }

  if (!settingsQuery.data) return null;

  return (
    <SettingsTab
      site={settingsQuery.data}
      onSave={(data) => updateMutation.mutate({ id: siteId, ...data })}
    />
  );
}
