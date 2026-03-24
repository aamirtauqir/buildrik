"use client";

import { trpc } from "@/lib/trpc/client";
import { useToast } from "@/components/dashboard/toast-provider";
import { DangerZoneTab } from "@/components/settings/danger-zone-tab";

export default function DangerZonePage() {
  const { addToast } = useToast();

  const exportMutation = trpc.account.dangerZone.exportData.useMutation({
    onSuccess: () => addToast("success", "Data export started. You'll be notified when ready."),
    onError: (err) => addToast("error", "Export failed", err.message),
  });

  const deleteMutation = trpc.account.dangerZone.deleteAccount.useMutation({
    onSuccess: () => addToast("info", "Account deletion scheduled. You have 30 days to cancel."),
    onError: (err) => addToast("error", "Failed", err.message),
  });

  return (
    <DangerZoneTab
      onExport={() => exportMutation.mutate()}
      onDelete={(reason) => deleteMutation.mutate({ reason })}
      isExporting={exportMutation.isPending}
      estimatedSize="~2 MB"
    />
  );
}
