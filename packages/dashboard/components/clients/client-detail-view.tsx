"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Globe, Plus, X } from "lucide-react";
import { trpc } from "@lib/trpc/client";
import { useToast } from "@/components/dashboard/toast-provider";
import { StateEmpty, LoadingSkeleton, ErrorState, DeniedState } from "@/components/states";

const STATUS_COLOR: Record<string, string> = {
  PUBLISHED: "var(--color-success)",
  DRAFT: "var(--color-text-muted)",
  ARCHIVED: "#F59E0B",
};

function SiteRow({ name, status, right }: { name: string; status: string; right: React.ReactNode }) {
  return (
    <div
      className="flex items-center justify-between rounded-lg border bg-white px-4 py-3"
      style={{ borderColor: "var(--color-border-default)" }}
    >
      <div className="flex items-center gap-3">
        <Globe className="h-4 w-4" style={{ color: "var(--color-text-muted)" }} />
        <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{name}</span>
        <span className="text-xs font-medium" style={{ color: STATUS_COLOR[status] ?? "var(--color-text-muted)" }}>
          {status.charAt(0) + status.slice(1).toLowerCase()}
        </span>
      </div>
      {right}
    </div>
  );
}

export function ClientDetailView({ clientId }: { clientId: string }) {
  const { addToast } = useToast();
  const featuresQuery = trpc.features.list.useQuery(undefined, { staleTime: 60_000 });
  const agencyEnabled = featuresQuery.data?.agency_layer ?? false;

  const clientQuery = trpc.clients.get.useQuery({ id: clientId }, { enabled: agencyEnabled, retry: false });
  const sitesQuery = trpc.sites.list.useQuery(
    { clientId, perPage: 50 },
    { enabled: agencyEnabled },
  );
  const [picking, setPicking] = useState(false);
  const unassignedQuery = trpc.sites.list.useQuery(
    { clientId: null, perPage: 50 },
    { enabled: agencyEnabled && picking },
  );

  const assignMut = trpc.clients.assignSite.useMutation({
    onSuccess: () => {
      sitesQuery.refetch();
      clientQuery.refetch();
      unassignedQuery.refetch();
    },
    onError: (err) => addToast("error", "Couldn't update site", err.message),
  });

  if (featuresQuery.isLoading) return <LoadingSkeleton rows={3} variant="list" />;
  if (!agencyEnabled) {
    return (
      <DeniedState
        title="Agency features aren't enabled"
        description="Ask a workspace admin to enable the agency layer."
        action={{ label: "Back to sites", href: "/dashboard/sites" }}
      />
    );
  }
  if (clientQuery.isError) {
    return (
      <ErrorState
        title="Client not found"
        description="It may have been deleted."
        retryLabel="Back to clients"
        onRetry={() => (window.location.href = "/dashboard/clients")}
      />
    );
  }

  const client = clientQuery.data;
  const sites = sitesQuery.data?.data ?? [];
  const unassigned = unassignedQuery.data?.data ?? [];

  return (
    <div>
      <Link
        href="/dashboard/clients"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium"
        style={{ color: "var(--color-text-secondary)" }}
      >
        <ArrowLeft className="h-4 w-4" />
        All clients
      </Link>

      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-xl text-base font-semibold text-white"
            style={{ backgroundColor: client?.brandColor ?? "var(--color-primary)" }}
          >
            {(client?.name ?? "··").slice(0, 2).toUpperCase()}
          </span>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>
              {client?.name ?? "Client"}
            </h1>
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              {client?.siteCount ?? 0} {client?.siteCount === 1 ? "site" : "sites"}
            </p>
          </div>
        </div>
        <button
          onClick={() => setPicking(true)}
          className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          <Plus className="h-4 w-4" />
          Assign sites
        </button>
      </header>

      {sitesQuery.isLoading ? (
        <LoadingSkeleton rows={3} variant="list" />
      ) : sitesQuery.isError ? (
        <ErrorState title="Couldn't load sites" onRetry={() => sitesQuery.refetch()} />
      ) : sites.length === 0 ? (
        <StateEmpty
          icon={<Globe className="h-7 w-7" />}
          title="No sites for this client yet"
          description="Assign existing sites to this client to group them here."
          action={{ label: "Assign sites", onClick: () => setPicking(true) }}
        />
      ) : (
        <div className="space-y-2">
          {sites.map((s) => (
            <SiteRow
              key={s.id}
              name={s.name}
              status={s.status}
              right={
                <button
                  onClick={() => assignMut.mutate({ siteId: s.id, clientId: null })}
                  className="text-xs font-medium hover:underline"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Remove
                </button>
              }
            />
          ))}
        </div>
      )}

      {picking && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "#0000004D" }}
          onClick={() => setPicking(false)}
        >
          <div className="max-h-[80vh] w-[460px] overflow-hidden rounded-xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: "var(--color-border-default)" }}>
              <h2 className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>Assign sites</h2>
              <button onClick={() => setPicking(false)} aria-label="Close">
                <X className="h-5 w-5" style={{ color: "var(--color-text-secondary)" }} />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-3">
              {unassignedQuery.isLoading ? (
                <LoadingSkeleton rows={3} variant="list" />
              ) : unassigned.length === 0 ? (
                <p className="px-2 py-6 text-center text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  No unassigned sites. Every site already belongs to a client.
                </p>
              ) : (
                <div className="space-y-2">
                  {unassigned.map((s) => (
                    <SiteRow
                      key={s.id}
                      name={s.name}
                      status={s.status}
                      right={
                        <button
                          onClick={() => assignMut.mutate({ siteId: s.id, clientId })}
                          className="rounded-md px-2.5 py-1 text-xs font-medium text-white"
                          style={{ backgroundColor: "var(--color-primary)" }}
                        >
                          Assign
                        </button>
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
