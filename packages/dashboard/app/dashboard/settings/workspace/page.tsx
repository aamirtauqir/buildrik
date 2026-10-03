"use client";

import { trpc } from "@lib/trpc/client";
import { useToast } from "@/components/dashboard/toast-provider";
import { WorkspaceForm } from "@/components/settings/workspace-form";
import { AgencyLayerToggle } from "@/components/settings/agency-layer-toggle";
import { ErrorState } from "@/components/states";

/** Settings index = the Workspace section (IA v2 D6 card mapping). Carries
 *  workspace name + branding + sharing (WorkspaceForm). Transfer ownership and
 *  workspace deletion live on the Danger zone page (Phase B §25: Transfer →
 *  Danger); the settings layout owns the section PageHeader. */
export default function WorkspaceSettingsPage() {
  const { addToast } = useToast();
  const utils = trpc.useUtils();
  const wsQuery = trpc.account.workspace.get.useQuery();

  const updateMutation = trpc.account.workspace.update.useMutation({
    // listMine backs the sidebar workspace switcher — without invalidating it a
    // rename saved fine but the sidebar kept the old name until a hard reload,
    // so the save read as if nothing had happened.
    onSuccess: () => {
      wsQuery.refetch();
      void utils.account.workspace.listMine.invalidate();
      addToast("success", "Workspace updated");
    },
    onError: (err) => addToast("error", "Failed", err.message),
  });

  const sharingMutation = trpc.account.workspace.sharing.useMutation({
    onSuccess: () => { wsQuery.refetch(); addToast("success", "Sharing settings updated"); },
    onError: (err) => addToast("error", "Failed", err.message),
  });

  if (wsQuery.isLoading) return <div className="h-64 animate-pulse rounded-lg" style={{ backgroundColor: "var(--color-bg-subtle)" }} />;
  if (!wsQuery.data) return <ErrorState title="Couldn't load workspace settings" onRetry={() => wsQuery.refetch()} />;

  const ws = wsQuery.data;

  return (
    <div className="space-y-8">
      <WorkspaceForm
        initialData={{
          name: ws.name ?? undefined,
          slug: ws.slug ?? undefined,
          iconUrl: ws.iconUrl,
          accentColor: ws.accentColor ?? undefined,
          editsRequireApproval: ws.editsRequireApproval ?? false,
          defaultExpiration: ws.sharingSettings?.defaultExpiration ?? null,
          requirePw: ws.sharingSettings?.requirePw ?? false,
          allowEditors: ws.sharingSettings?.allowEditors ?? false,
        }}
        onSave={(data) => updateMutation.mutate(data)}
        onSaveSharing={(data) => sharingMutation.mutate(data)}
        saving={updateMutation.isPending || sharingMutation.isPending}
      />

      <AgencyLayerToggle />

    </div>
  );
}
