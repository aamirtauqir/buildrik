"use client";

import { useParams } from "next/navigation";
import { trpc } from "@lib/trpc/client";
import { SettingsTab } from "@/components/site-detail/settings-tab";
import { ErrorState } from "@/components/states";

export default function SiteSettingsPage() {
  const params = useParams();
  const siteId = params.id as string;

  const settingsQuery = trpc.siteDetail.settings.get.useQuery({ siteId });

  if (settingsQuery.isLoading) {
    return <div className="h-64 animate-pulse rounded-lg" style={{ backgroundColor: "var(--color-bg-subtle)" }} />;
  }

  if (!settingsQuery.data) return <ErrorState title="Couldn't load site settings" onRetry={() => settingsQuery.refetch()} />;

  // Read-only: the values are edited in the editor's Site settings (PD-1).
  return <SettingsTab site={settingsQuery.data} />;
}
