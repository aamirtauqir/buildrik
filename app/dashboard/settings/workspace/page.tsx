"use client";

import { trpc } from "@/lib/trpc/client";
import { useToast } from "@/components/dashboard/toast-provider";
import { WorkspaceForm } from "@/components/settings/workspace-form";

export default function WorkspacePage() {
  const { addToast } = useToast();
  const wsQuery = trpc.account.workspace.get.useQuery();
  const updateMutation = trpc.account.workspace.update.useMutation({
    onSuccess: () => { wsQuery.refetch(); addToast("success", "Workspace updated"); },
    onError: (err) => addToast("error", "Failed", err.message),
  });

  if (wsQuery.isLoading) return <div className="h-64 animate-pulse rounded-xl" style={{ backgroundColor: "#F4F4F4" }} />;
  if (!wsQuery.data) return null;

  return <WorkspaceForm workspace={wsQuery.data} onSave={(data) => updateMutation.mutate(data)} />;
}
