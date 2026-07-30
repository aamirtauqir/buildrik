"use client";

import { useState } from "react";
import { Key, Plus, Copy, Check, Trash2 } from "lucide-react";
import { trpc } from "@lib/trpc/client";
import { useToast } from "@/components/dashboard/toast-provider";
import { Pill, MetricValue, Button, Modal } from "@/components/dashboard/primitives";
import { ErrorState } from "@/components/states";

const SCOPE_LABELS: Record<string, string> = {
  "sites:read": "Read sites",
  "sites:write": "Edit sites",
  "sites:publish": "Publish sites",
  "redirects:read": "Read redirects",
  "redirects:write": "Edit redirects",
  "forms:read": "Read form submissions",
  "domains:read": "Read domains",
  "domains:write": "Edit domains",
};
const ALL_SCOPES = Object.keys(SCOPE_LABELS);

const EXPIRY_OPTIONS = [
  { label: "Never", days: null },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
  { label: "1 year", days: 365 },
] as const;

function relativeTime(date: Date | string | null): string {
  if (!date) return "never";
  const d = new Date(date).getTime();
  const diff = Date.now() - d;
  const days = Math.floor(diff / 86_400_000);
  if (days < 1) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export function ApiTokensTab({ workspaceId }: { workspaceId: string }) {
  const { addToast } = useToast();
  const list = trpc.apiTokens.list.useQuery({ workspaceId }, { enabled: !!workspaceId });

  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<string[]>(["sites:read"]);
  const [expiryDays, setExpiryDays] = useState<number | null>(null);
  const [plaintext, setPlaintext] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const create = trpc.apiTokens.create.useMutation({
    onSuccess: (res) => {
      setPlaintext(res.plaintext);
      setCreating(false);
      list.refetch();
    },
    onError: (err) => addToast("error", "Couldn't create token", err.message),
  });
  const revoke = trpc.apiTokens.revoke.useMutation({
    onSuccess: () => { list.refetch(); addToast("success", "Token revoked"); },
    onError: (err) => addToast("error", "Couldn't revoke token", err.message),
  });
  const del = trpc.apiTokens.delete.useMutation({
    onSuccess: () => { list.refetch(); addToast("success", "Token deleted"); },
    onError: (err) => addToast("error", "Couldn't delete token", err.message),
  });

  const toggleScope = (s: string) =>
    setScopes((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const submitCreate = () => {
    if (!name.trim() || scopes.length === 0) return;
    const expiresAt = expiryDays ? new Date(Date.now() + expiryDays * 86_400_000) : null;
    create.mutate({ workspaceId, name: name.trim(), scopes: scopes as never[], expiresAt });
  };

  const resetForm = () => { setName(""); setScopes(["sites:read"]); setExpiryDays(null); };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>API tokens</h2>
          <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            For scripting and CI. Scoped, revocable, and never expire unless you set an expiry.
          </p>
        </div>
        <Button type="button" size="sm" onClick={() => { resetForm(); setCreating(true); }}>
          <Plus size={15} /> New token
        </Button>
      </div>

      {/* Honesty note: the public API that consumes these tokens isn't live yet
          (no scopedProcedure consumers). Don't imply a working integration. */}
      <div className="rounded-lg border px-3 py-2.5 text-sm" style={{ borderColor: "#E3A008", backgroundColor: "#FDFDEA", color: "#723B13" }}>
        The public API is coming soon. You can create and manage tokens now, but
        they won&apos;t authenticate requests until the API launches.
      </div>

      {/* Token list */}
      {list.isLoading ? (
        <div className="h-40 animate-pulse rounded-xl bg-neutral-100" />
      ) : list.isError ? (
        // Was "No API tokens yet" on a failed query — a fake-empty that hid the error.
        <ErrorState title="Couldn't load API tokens" description="Something went wrong on our end." onRetry={() => list.refetch()} />
      ) : (list.data?.length ?? 0) === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center" style={{ borderColor: "var(--color-border-default)" }}>
          <Key size={22} className="mx-auto mb-2 text-neutral-400" />
          <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>No API tokens yet</p>
          <p className="mt-0.5 text-sm" style={{ color: "var(--color-text-secondary)" }}>Create one to script deploys, exports, or redirects.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border" style={{ borderColor: "var(--color-border-default)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide text-neutral-500" style={{ borderColor: "var(--color-border-default)" }}>
                <th className="px-4 py-2.5 font-medium">Name</th>
                <th className="px-4 py-2.5 font-medium">Token</th>
                <th className="px-4 py-2.5 font-medium">Scopes</th>
                <th className="px-4 py-2.5 font-medium">Last used</th>
                <th className="px-4 py-2.5 font-medium">Expires</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {list.data!.map((t) => {
                const revoked = !!t.revokedAt;
                const expired = t.expiresAt && new Date(t.expiresAt) < new Date();
                return (
                  <tr key={t.id} className="border-b last:border-0" style={{ borderColor: "var(--color-border-default)" }}>
                    <td className="px-4 py-3 font-medium" style={{ color: "var(--color-text-primary)" }}>
                      {t.name}
                      {revoked && <Pill tone="error" className="ml-2">revoked</Pill>}
                      {!revoked && expired && <Pill tone="warning" className="ml-2">expired</Pill>}
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral-500"><MetricValue>{t.prefix}…</MetricValue></td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(t.scopes as string[]).map((s) => (
                          <Pill key={s} tone="neutral">{s}</Pill>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-neutral-500"><MetricValue>{relativeTime(t.lastUsedAt)}</MetricValue></td>
                    <td className="px-4 py-3 text-neutral-500"><MetricValue>{t.expiresAt ? relativeTime(t.expiresAt).replace(" ago", "") : "never"}</MetricValue></td>
                    <td className="px-4 py-3 text-right">
                      {revoked ? (
                        <button
                          type="button"
                          onClick={() => del.mutate({ id: t.id })}
                          className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-red-600"
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => revoke.mutate({ id: t.id })}
                          className="text-xs font-medium text-red-600 hover:text-red-700"
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create modal */}
      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="New API token"
        width={448}
        footer={
          <>
            <Button type="button" variant="ghost" size="sm" onClick={() => setCreating(false)}>Cancel</Button>
            <Button
              type="button"
              size="sm"
              onClick={submitCreate}
              disabled={!name.trim() || scopes.length === 0 || create.isPending}
            >
              {create.isPending ? "Creating…" : "Create token"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>Name</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="CI deploy"
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]"
              style={{ borderColor: "var(--color-border-default)" }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>Scopes</label>
            <div className="mt-1.5 grid grid-cols-2 gap-1.5">
              {ALL_SCOPES.map((s) => (
                <label key={s} className="flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs" style={{ borderColor: scopes.includes(s) ? "var(--color-primary)" : "var(--color-border-default)" }}>
                  <input type="checkbox" checked={scopes.includes(s)} onChange={() => toggleScope(s)} className="accent-[var(--color-primary)]" />
                  <span style={{ color: "var(--color-text-primary)" }}>{SCOPE_LABELS[s]}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>Expiry</label>
            <div className="mt-1.5 flex gap-1.5">
              {EXPIRY_OPTIONS.map((o) => (
                <button
                  key={o.label}
                  type="button"
                  onClick={() => setExpiryDays(o.days)}
                  className="rounded-md border px-2.5 py-1.5 text-xs"
                  style={{
                    borderColor: expiryDays === o.days ? "var(--color-primary)" : "var(--color-border-default)",
                    color: expiryDays === o.days ? "var(--color-primary)" : "var(--color-text-secondary)",
                  }}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* Shown-once plaintext */}
      <Modal
        open={!!plaintext}
        onClose={() => { setPlaintext(null); setCopied(false); }}
        title="Token created"
        width={448}
        footer={
          <Button type="button" size="sm" onClick={() => { setPlaintext(null); setCopied(false); }}>
            Done
          </Button>
        }
      >
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Copy it now — for security, it won&apos;t be shown again.
        </p>
        <div className="mt-3 flex items-center gap-2 rounded-md border bg-neutral-50 p-2.5" style={{ borderColor: "var(--color-border-default)" }}>
          <code className="flex-1 break-all font-mono text-xs" style={{ color: "var(--color-text-primary)" }}>{plaintext}</code>
          <button
            type="button"
            onClick={() => { if (plaintext) { navigator.clipboard.writeText(plaintext); setCopied(true); } }}
            className="inline-flex shrink-0 items-center gap-1 rounded-md border px-2 py-1 text-xs"
            style={{ borderColor: "var(--color-border-default)" }}
          >
            {copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
          </button>
        </div>
      </Modal>
    </div>
  );
}
