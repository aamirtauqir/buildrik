"use client";

import { trpc } from "@lib/trpc/client";
import { useToast } from "@/components/dashboard/toast-provider";
import { IntegrationsTab } from "@/components/settings/integrations-tab";

export default function IntegrationsPage() {
  const { addToast } = useToast();
  const intQuery = trpc.account.integrations.list.useQuery();

  const addMutation = trpc.account.integrations.add.useMutation({
    onSuccess: () => { intQuery.refetch(); addToast("success", "Integration connected"); },
    onError: (err: { message: string }) => addToast("error", "Failed", err.message),
  });
  const removeMutation = trpc.account.integrations.remove.useMutation({
    onSuccess: () => { intQuery.refetch(); addToast("success", "Integration removed"); },
  });

  if (intQuery.isLoading) return <div className="h-64 animate-pulse rounded-xl" style={{ backgroundColor: "#F4F4F4" }} />;

  const connected = (intQuery.data ?? []).map((item) => ({
    id: item.id,
    provider: item.provider as "GOOGLE_ANALYTICS" | "MAILCHIMP" | "ZAPIER" | "SLACK",
    config: (item.config ?? {}) as Record<string, string>,
  }));

  return (
    <IntegrationsTab
      connected={connected}
      onAdd={(provider, config) =>
        addMutation.mutate({ provider, config })
      }
      onRemove={(id) => removeMutation.mutate({ id })}
      onTestEvent={(provider) => addToast("success", "Test event sent", `Test event sent to ${provider}`)}
      saving={addMutation.isPending || removeMutation.isPending}
    />
  );
}
