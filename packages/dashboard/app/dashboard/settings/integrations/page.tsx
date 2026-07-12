"use client";

import { useSearchParams } from "next/navigation";
import { trpc } from "@lib/trpc/client";
import { useToast } from "@/components/dashboard/toast-provider";
import { IntegrationsTab } from "@/components/settings/integrations-tab";

function VercelIntegrationSection({ workspaceId }: { workspaceId: string }) {
  const { addToast } = useToast();
  const conn = trpc.integrations.vercel.getConnection.useQuery(
    { workspaceId },
    { enabled: !!workspaceId },
  );
  const disconnect = trpc.integrations.vercel.disconnect.useMutation({
    onSuccess: (data) => {
      conn.refetch();
      if (data.vercelStillInstalled) {
        // OAuth tokens can't revoke the Vercel-side install (Vercel returns
        // 403). Local connection is gone but the integration remains visible
        // at vercel.com — guide the user to finish revocation there.
        addToast(
          "info",
          "Disconnected from this workspace",
          "Buildrick can no longer publish from here. To fully revoke access, open Vercel → Integrations → Buildrick → Remove.",
        );
      } else {
        addToast("success", "Vercel disconnected");
      }
    },
  });
  const search = useSearchParams();
  const oauthError = search.get("error");

  const handleConnect = () => {
    window.location.href = `/api/integrations/vercel/authorize?workspaceId=${encodeURIComponent(workspaceId)}`;
  };

  return (
    <section className="rounded-xl border border-neutral-200 p-4">
      {oauthError === "oauth_state_invalid" && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          OAuth session expired. Click Connect to retry.
        </div>
      )}
      {oauthError === "oauth_denied" && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          Vercel didn&apos;t authorize the connection. Try again or check your Vercel account.
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Vercel</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Deploy your sites to Vercel. Connect once per workspace.
          </p>
        </div>

        {conn.isLoading ? (
          <div className="h-8 w-28 animate-pulse rounded-md bg-neutral-100" />
        ) : conn.data?.connected && conn.data.isActive ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-neutral-600">
              Connected{conn.data.teamId ? ` (team ${conn.data.teamId})` : ""}
            </span>
            <button
              type="button"
              onClick={() => disconnect.mutate({ workspaceId })}
              disabled={disconnect.isPending}
              className="rounded-md border border-neutral-200 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
            >
              {disconnect.isPending ? "Disconnecting…" : "Disconnect"}
            </button>
          </div>
        ) : conn.data?.connected && !conn.data.isActive ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-red-600">Connection lost</span>
            <button
              type="button"
              onClick={handleConnect}
              className="rounded-md border border-neutral-200 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50"
            >
              Reconnect
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleConnect}
            className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700"
          >
            Connect Vercel
          </button>
        )}
      </div>
    </section>
  );
}

export default function IntegrationsPage() {
  const { addToast } = useToast();
  const wsQuery = trpc.account.workspace.get.useQuery();
  const workspaceId = wsQuery.data?.id;
  const intQuery = trpc.account.integrations.list.useQuery();

  const addMutation = trpc.account.integrations.add.useMutation({
    onSuccess: () => { intQuery.refetch(); addToast("success", "Integration connected"); },
    onError: (err: { message: string }) => addToast("error", "Failed", err.message),
  });
  const removeMutation = trpc.account.integrations.remove.useMutation({
    onSuccess: () => { intQuery.refetch(); addToast("success", "Integration removed"); },
  });
  const updateMutation = trpc.account.integrations.update.useMutation({
    onSuccess: () => { intQuery.refetch(); addToast("success", "Integration updated"); },
    onError: (err: { message: string }) => addToast("error", "Failed", err.message),
  });
  const testEventMutation = trpc.account.integrations.testEvent.useMutation({
    onSuccess: (res: { ok: boolean; status: number }) =>
      res.ok
        ? addToast("success", "Test event delivered", `Webhook responded ${res.status}`)
        : addToast("error", "Test event failed", `Webhook responded ${res.status}`),
    onError: (err: { message: string }) => addToast("error", "Test event failed", err.message),
  });

  if (intQuery.isLoading) return <div className="h-64 animate-pulse rounded-xl bg-neutral-100" />;

  const connected = (intQuery.data ?? []).map((item) => ({
    id: item.id,
    provider: item.provider as "GOOGLE_ANALYTICS" | "MAILCHIMP" | "ZAPIER" | "SLACK",
    config: (item.config ?? {}) as Record<string, string>,
  }));

  return (
    <div className="space-y-6">
      {workspaceId && <VercelIntegrationSection workspaceId={workspaceId} />}
      <IntegrationsTab
        connected={connected}
        onAdd={(provider, config) =>
          addMutation.mutate({ provider, config })
        }
        onRemove={(id) => removeMutation.mutate({ id })}
        onUpdate={(id, config) => updateMutation.mutate({ id, config })}
        onTestEvent={(id) => testEventMutation.mutate({ id })}
        saving={addMutation.isPending || removeMutation.isPending || updateMutation.isPending || testEventMutation.isPending}
      />
    </div>
  );
}
