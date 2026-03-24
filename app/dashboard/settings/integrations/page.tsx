"use client";

import { trpc } from "@/lib/trpc/client";
import { useToast } from "@/components/dashboard/toast-provider";
import { IntegrationsTab } from "@/components/settings/integrations-tab";

export default function IntegrationsPage() {
  const { addToast } = useToast();
  const intQuery = trpc.account.integrations.list.useQuery();

  const addMutation = trpc.account.integrations.add.useMutation({
    onSuccess: () => { intQuery.refetch(); addToast("success", "Integration connected"); },
    onError: (err) => addToast("error", "Failed", err.message),
  });
  const removeMutation = trpc.account.integrations.remove.useMutation({
    onSuccess: () => { intQuery.refetch(); addToast("success", "Integration removed"); },
  });

  if (intQuery.isLoading) return <div className="h-64 animate-pulse rounded-xl" style={{ backgroundColor: "#F4F4F4" }} />;

  return (
    <IntegrationsTab
      integrations={intQuery.data ?? []}
      onConnect={(provider, config) =>
        addMutation.mutate({ provider: provider as "GOOGLE_ANALYTICS" | "MAILCHIMP" | "ZAPIER" | "SLACK", config })
      }
      onDisconnect={(id) => removeMutation.mutate({ id })}
    />
  );
}
