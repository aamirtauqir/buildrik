"use client";

import { type ReactNode, useState } from "react";
import { useSearchParams } from "next/navigation";
import { cn } from "@lib/utils";
import { trpc } from "@lib/trpc/client";
import { useToast } from "@/components/dashboard/toast-provider";
import { INTEGRATION_CONFIGS } from "@/components/settings/integrations-tab";
import { SectionCard, Pill, MetricValue } from "@/components/dashboard/primitives";

/** dc categorical tints cycled across the integration tiles (teal→amber→primary→pink). */
const TILE_TINTS = ["var(--color-teal)", "var(--color-amber)", "var(--color-primary)", "var(--color-pink)"];

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="transition-transform"
      style={{ color: "var(--color-text-muted)", transform: open ? "rotate(180deg)" : undefined }}
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function IntegrationCard({
  tintIndex,
  initial,
  name,
  description,
  right,
  expandable,
  expanded,
  onToggle,
  children,
}: {
  tintIndex: number;
  initial: string;
  name: string;
  description: ReactNode;
  right: ReactNode;
  expandable?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
  children?: ReactNode;
}) {
  const tint = TILE_TINTS[tintIndex % TILE_TINTS.length];
  return (
    <SectionCard padding="none">
      <div
        className={cn("flex items-center gap-3 p-4", expandable && "cursor-pointer")}
        onClick={expandable ? onToggle : undefined}
      >
        <span
          className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-lg text-[15px] font-semibold"
          style={{ backgroundColor: `color-mix(in srgb, ${tint} 12%, var(--color-bg-surface))`, color: tint }}
        >
          {initial}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold leading-5" style={{ color: "var(--color-text-primary)" }}>{name}</p>
          <p className="truncate text-body-sm" style={{ color: "var(--color-text-secondary)" }}>{description}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {right}
          {expandable && <Chevron open={!!expanded} />}
        </div>
      </div>
      {expanded && children && (
        <div className="border-t p-4" style={{ borderColor: "var(--color-border-default)", backgroundColor: "var(--color-bg-subtle)" }}>
          {children}
        </div>
      )}
    </SectionCard>
  );
}

function ConnectButton({ onClick, children }: { onClick: (e: React.MouseEvent) => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-[var(--color-bg-subtle)]"
      style={{ borderColor: "var(--color-border-strong)", color: "var(--color-text-primary)", backgroundColor: "var(--color-bg-surface)" }}
    >
      {children}
    </button>
  );
}

function VercelCard({ workspaceId }: { workspaceId: string }) {
  const { addToast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const conn = trpc.integrations.vercel.getConnection.useQuery(
    { workspaceId },
    { enabled: !!workspaceId },
  );
  const disconnect = trpc.integrations.vercel.disconnect.useMutation({
    onSuccess: (data) => {
      conn.refetch();
      if (data.vercelStillInstalled) {
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

  const handleConnect = () => {
    window.location.href = `/api/integrations/vercel/authorize?workspaceId=${encodeURIComponent(workspaceId)}`;
  };

  const data = conn.data;
  const isConnected = data?.connected === true && data.isActive === true;

  let right: ReactNode;
  if (conn.isLoading) {
    right = <div className="h-8 w-24 animate-pulse rounded-md" style={{ backgroundColor: "var(--color-bg-subtle)" }} />;
  } else if (data?.connected && data.isActive) {
    // Team id lives in the expanded panel — in the row's shrink-0 right slot it
    // can't shrink and pushes the pill outside the card.
    right = <Pill tone="success">Connected</Pill>;
  } else if (data?.connected && !data.isActive) {
    right = (
      <>
        <Pill tone="error">Connection lost</Pill>
        <ConnectButton onClick={handleConnect}>Reconnect</ConnectButton>
      </>
    );
  } else {
    right = <ConnectButton onClick={handleConnect}>Connect</ConnectButton>;
  }

  return (
    <IntegrationCard
      tintIndex={0}
      initial="V"
      name="Vercel"
      description="Deploy your sites to Vercel"
      right={right}
      expandable={!!isConnected}
      expanded={expanded}
      onToggle={() => setExpanded((v) => !v)}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-body-sm" style={{ color: "var(--color-text-secondary)" }}>
            Connected once per workspace. Disconnect stops publishing from here.
          </p>
          {data?.teamId && (
            <p className="mt-1 truncate" style={{ color: "var(--color-text-muted)" }}>
              <MetricValue className="text-body-sm">{data.teamId}</MetricValue>
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => disconnect.mutate({ workspaceId })}
          disabled={disconnect.isPending}
          className="shrink-0 rounded-md border px-3 py-1.5 text-sm font-medium disabled:opacity-60"
          style={{ borderColor: "var(--color-border-strong)", color: "var(--color-text-secondary)", backgroundColor: "var(--color-bg-surface)" }}
        >
          {disconnect.isPending ? "Disconnecting…" : "Disconnect"}
        </button>
      </div>
    </IntegrationCard>
  );
}

export function IntegrationsContent() {
  const { addToast } = useToast();
  const wsQuery = trpc.account.workspace.get.useQuery();
  const workspaceId = wsQuery.data?.id;
  const intQuery = trpc.account.integrations.list.useQuery();

  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Record<string, string>>>({});

  const addMutation = trpc.account.integrations.add.useMutation({
    onSuccess: () => { intQuery.refetch(); setExpandedProvider(null); addToast("success", "Integration connected"); },
    onError: (err: { message: string }) => addToast("error", "Failed", err.message),
  });
  const removeMutation = trpc.account.integrations.remove.useMutation({
    onSuccess: () => { intQuery.refetch(); setExpandedProvider(null); addToast("success", "Integration removed"); },
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

  const search = useSearchParams();
  const oauthError = search.get("error");

  const saving = addMutation.isPending || removeMutation.isPending || updateMutation.isPending || testEventMutation.isPending;

  if (intQuery.isLoading) {
    return (
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-[74px] animate-pulse rounded-xl" style={{ backgroundColor: "var(--color-bg-subtle)" }} />
        ))}
      </div>
    );
  }

  const connected = (intQuery.data ?? []).map((item) => ({
    id: item.id,
    provider: item.provider as "GOOGLE_ANALYTICS" | "MAILCHIMP" | "ZAPIER" | "SLACK",
    config: (item.config ?? {}) as Record<string, string>,
  }));

  function draftValue(provider: string, key: string, existing: Record<string, string>) {
    return drafts[provider]?.[key] ?? existing[key] ?? "";
  }

  function setDraft(provider: string, key: string, value: string) {
    setDrafts((prev) => ({ ...prev, [provider]: { ...(prev[provider] ?? {}), [key]: value } }));
  }

  return (
    <div className="space-y-4">
      {(oauthError === "oauth_state_invalid" || oauthError === "oauth_denied") && (
        <div
          className="rounded-md border p-3 text-body-sm"
          style={{ borderColor: "var(--color-error)", backgroundColor: "var(--color-error-subtle)", color: "var(--color-error)" }}
        >
          {oauthError === "oauth_state_invalid"
            ? "OAuth session expired. Click Connect to retry."
            : "Vercel didn't authorize the connection. Try again or check your Vercel account."}
        </div>
      )}

      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
        {workspaceId && <VercelCard workspaceId={workspaceId} />}

        {INTEGRATION_CONFIGS.map((cfg, i) => {
          const connection = connected.find((c) => c.provider === cfg.provider);
          const isExpanded = expandedProvider === cfg.provider;
          const existing = connection?.config ?? {};
          const hasWebhook = cfg.fields.some((f) => f.key === "webhookUrl");

          const right = connection ? (
            <Pill tone="success">Connected</Pill>
          ) : (
            <ConnectButton
              onClick={(e) => {
                e.stopPropagation();
                setExpandedProvider(isExpanded ? null : cfg.provider);
              }}
            >
              Connect
            </ConnectButton>
          );

          return (
            <IntegrationCard
              key={cfg.provider}
              tintIndex={i + 1}
              initial={cfg.name.charAt(0)}
              name={cfg.name}
              description={cfg.description}
              right={right}
              expandable={isExpanded || !!connection}
              expanded={isExpanded}
              onToggle={() => setExpandedProvider(isExpanded ? null : cfg.provider)}
            >
              <div className="space-y-3">
                {cfg.fields.map((f) => (
                  <div key={f.key}>
                    <label className="mb-1 block text-eyebrow font-medium" style={{ color: "var(--color-text-primary)" }}>
                      {f.label}
                    </label>
                    <input
                      type="text"
                      value={draftValue(cfg.provider, f.key, existing)}
                      onChange={(e) => setDraft(cfg.provider, f.key, e.target.value)}
                      placeholder={f.placeholder}
                      className="w-full rounded-md border px-3 py-2 text-sm outline-none"
                      style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-primary)", backgroundColor: "var(--color-bg-surface)" }}
                    />
                  </div>
                ))}

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {connection ? (
                    <>
                      <button
                        type="button"
                        onClick={() => updateMutation.mutate({ id: connection.id, config: { ...existing, ...(drafts[cfg.provider] ?? {}) } })}
                        disabled={saving}
                        className="rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                        style={{ backgroundColor: "var(--color-primary)" }}
                      >
                        {saving ? "Saving…" : "Save changes"}
                      </button>
                      {hasWebhook && (
                        <button
                          type="button"
                          onClick={() => testEventMutation.mutate({ id: connection.id })}
                          disabled={saving}
                          className="rounded-md border px-3 py-2 text-sm font-medium disabled:opacity-60"
                          style={{ borderColor: "var(--color-border-strong)", color: "var(--color-text-primary)", backgroundColor: "var(--color-bg-surface)" }}
                        >
                          Send test event
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeMutation.mutate({ id: connection.id })}
                        disabled={saving}
                        className="rounded-md border px-3 py-2 text-sm font-medium disabled:opacity-60"
                        style={{ borderColor: "var(--color-border-strong)", color: "var(--color-text-secondary)", backgroundColor: "var(--color-bg-surface)" }}
                      >
                        Disconnect
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => addMutation.mutate({ provider: cfg.provider, config: drafts[cfg.provider] ?? {} })}
                        disabled={saving}
                        className="rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                        style={{ backgroundColor: "var(--color-primary)" }}
                      >
                        {saving ? "Connecting…" : "Save & connect"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpandedProvider(null)}
                        className="rounded-md border px-3 py-2 text-sm font-medium"
                        style={{ borderColor: "var(--color-border-strong)", color: "var(--color-text-secondary)", backgroundColor: "var(--color-bg-surface)" }}
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            </IntegrationCard>
          );
        })}
      </div>
    </div>
  );
}
