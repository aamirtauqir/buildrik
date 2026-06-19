"use client";

import { useState } from "react";
import { Palette, UploadCloud, Lock, Unlock } from "lucide-react";
import { trpc } from "@lib/trpc/client";
import { useToast } from "@/components/dashboard/toast-provider";
import { LoadingSkeleton, ErrorState, DeniedState, StateEmpty } from "@/components/states";

function timeAgo(d: Date | string): string {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function ThemeManager() {
  const { addToast } = useToast();
  const [source, setSource] = useState("");

  // Both reads are agency-gated server-side; FORBIDDEN = flag off for this workspace.
  const sharedQuery = trpc.theme.getShared.useQuery(undefined, { retry: false });
  const targetsQuery = trpc.theme.targets.useQuery(undefined, { retry: false });

  const refetchAll = () => {
    sharedQuery.refetch();
    targetsQuery.refetch();
  };

  const captureMut = trpc.theme.capture.useMutation({
    onSuccess: () => {
      addToast("success", "Theme captured");
      refetchAll();
    },
    onError: (e) => addToast("error", "Couldn't capture theme", e.message),
  });

  const lockMut = trpc.theme.setLock.useMutation({
    onSuccess: () => targetsQuery.refetch(),
    onError: (e) => addToast("error", "Couldn't change lock", e.message),
  });

  const pushMut = trpc.theme.push.useMutation({
    onSuccess: (res) => {
      const pushed = res?.filter((r) => r.status === "pushed").length ?? 0;
      const skipped = res?.filter((r) => r.status === "skipped-locked").length ?? 0;
      const failed = res?.filter((r) => r.status === "failed").length ?? 0;
      const parts = [`${pushed} pushed`];
      if (skipped) parts.push(`${skipped} locked`);
      if (failed) parts.push(`${failed} failed`);
      addToast(failed ? "error" : "success", `Theme push: ${parts.join(", ")}`);
      targetsQuery.refetch();
    },
    onError: (e) => addToast("error", "Couldn't push theme", e.message),
  });

  const forbidden =
    sharedQuery.error?.data?.code === "FORBIDDEN" || targetsQuery.error?.data?.code === "FORBIDDEN";
  const theme = sharedQuery.data;
  const targets = targetsQuery.data ?? [];
  const busy = captureMut.isPending || pushMut.isPending;

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>Shared theme</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Capture one site&apos;s design tokens, then push them across your client sites. Locked sites keep their own.
        </p>
      </header>

      {sharedQuery.isLoading || targetsQuery.isLoading ? (
        <LoadingSkeleton rows={3} variant="list" />
      ) : forbidden ? (
        <DeniedState
          title="The agency layer isn't enabled"
          description="Shared themes are part of the agency layer. Ask a workspace admin to enable it."
          action={{ label: "Back to sites", href: "/dashboard/sites" }}
        />
      ) : sharedQuery.isError || targetsQuery.isError ? (
        <ErrorState
          title="Couldn't load the shared theme"
          description="Something went wrong on our end."
          onRetry={refetchAll}
        />
      ) : (
        <div className="space-y-6">
          {/* Captured-theme + capture/push controls */}
          <div className="rounded-xl border bg-white p-4" style={{ borderColor: "var(--color-border-default)" }}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4" style={{ color: "var(--color-primary)" }} />
                <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                  {theme ? `Theme captured ${timeAgo(theme.updatedAt)}` : "No shared theme captured yet"}
                </span>
              </div>
              <button
                onClick={() => pushMut.mutate({})}
                disabled={!theme || busy || targets.length === 0}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                <UploadCloud className="h-3.5 w-3.5" />
                Push to all sites
              </button>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="flex-1 rounded-lg border px-3 py-1.5 text-sm"
                style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-primary)" }}
              >
                <option value="">Choose a site to capture from…</option>
                {targets.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <button
                onClick={() => source && captureMut.mutate({ sourceSiteId: source })}
                disabled={!source || busy}
                className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium disabled:opacity-50"
                style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-secondary)" }}
              >
                Capture from this site
              </button>
            </div>
          </div>

          {/* Target sites + per-site lock */}
          {targets.length === 0 ? (
            <StateEmpty
              icon={<Palette className="h-7 w-7" />}
              title="No sites yet"
              description="Create a site, then capture and push a shared theme across your client work."
            />
          ) : (
            <div className="space-y-2">
              {targets.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-4 rounded-xl border bg-white p-3"
                  style={{ borderColor: "var(--color-border-default)" }}
                >
                  <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{s.name}</span>
                  <button
                    onClick={() => lockMut.mutate({ siteId: s.id, locked: !s.themeLocked })}
                    disabled={lockMut.isPending}
                    className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium disabled:opacity-50"
                    style={{
                      borderColor: "var(--color-border-default)",
                      color: s.themeLocked ? "var(--color-text-primary)" : "var(--color-text-muted)",
                    }}
                  >
                    {s.themeLocked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                    {s.themeLocked ? "Locked" : "Following"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
