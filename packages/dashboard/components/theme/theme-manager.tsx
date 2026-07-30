"use client";

import { useState } from "react";
import { Palette, UploadCloud, Lock, Unlock, Check, X, AlertTriangle, Undo2 } from "lucide-react";
import { trpc } from "@lib/trpc/client";
import { useToast } from "@/components/dashboard/toast-provider";
import { LoadingSkeleton, ErrorState, DeniedState, StateEmpty } from "@/components/states";

type PushResultRow = { siteId: string; name: string; status: "pushed" | "skipped-locked" | "failed"; error?: string };
type PushPreviewRow = { siteId: string; name: string; status: "would-push" | "skipped-locked"; willChange: boolean };

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
  const [confirming, setConfirming] = useState(false);
  const [pushResults, setPushResults] = useState<PushResultRow[] | null>(null);
  const [preview, setPreview] = useState<PushPreviewRow[] | null>(null);
  const [rollingBack, setRollingBack] = useState<string | null>(null);

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

  // Dry-run: the accurate blast radius (which following sites would actually
  // change vs already match), computed server-side. Was an orphaned backend.
  const previewMut = trpc.theme.previewPush.useMutation({
    onSuccess: (rows) => setPreview((rows ?? []) as PushPreviewRow[]),
    onError: (e) => addToast("error", "Couldn't preview push", e.message),
  });

  const openConfirm = () => {
    setPushResults(null);
    setPreview(null);
    setConfirming(true);
    previewMut.mutate({});
  };

  const pushMut = trpc.theme.push.useMutation({
    onSuccess: (res) => {
      setConfirming(false);
      setPreview(null);
      setPushResults((res ?? []) as PushResultRow[]);
      const pushed = res?.filter((r) => r.status === "pushed").length ?? 0;
      const failed = res?.filter((r) => r.status === "failed").length ?? 0;
      addToast(failed ? "error" : "success", `Theme push: ${pushed} updated${failed ? `, ${failed} failed` : ""}`);
      targetsQuery.refetch();
    },
    onError: (e) => { setConfirming(false); addToast("error", "Couldn't push theme", e.message); },
  });

  // Undo a push on one site — restores its pre-push tokens (was an orphan too).
  const rollbackMut = trpc.theme.rollback.useMutation({
    onSuccess: (_r, vars) => {
      addToast("success", "Reverted to previous theme");
      setPushResults((prev) => prev?.filter((r) => r.siteId !== vars.siteId) ?? null);
      setRollingBack(null);
      targetsQuery.refetch();
    },
    onError: (e) => { setRollingBack(null); addToast("error", "Couldn't undo", e.message); },
  });

  const forbidden =
    sharedQuery.error?.data?.code === "FORBIDDEN" || targetsQuery.error?.data?.code === "FORBIDDEN";
  const theme = sharedQuery.data;
  const targets = targetsQuery.data ?? [];
  const busy = captureMut.isPending || pushMut.isPending;
  const followingCount = targets.filter((s) => !s.themeLocked).length;
  const lockedCount = targets.length - followingCount;

  return (
    <div>
      {/* The agency layout owns the section PageHeader (D10.4). */}
      {sharedQuery.isLoading || targetsQuery.isLoading ? (
        <LoadingSkeleton rows={3} variant="list" />
      ) : forbidden ? (
        <DeniedState
          title="The agency layer isn't enabled"
          description="Shared themes are part of the agency layer. Ask a workspace admin to enable it."
          action={{ label: "Back to projects", href: "/dashboard/projects" }}
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
          <div className="rounded-lg border bg-white p-4" style={{ borderColor: "var(--color-border-default)" }}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4" style={{ color: "var(--color-primary)" }} />
                <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                  {theme ? `Theme captured ${timeAgo(theme.updatedAt)}` : "No shared theme captured yet"}
                </span>
              </div>
              <button
                onClick={openConfirm}
                disabled={!theme || busy || followingCount === 0}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                <UploadCloud className="h-3.5 w-3.5" />
                Push to sites
              </button>
            </div>

            {/* Pre-push impact preview — no silent clobber. */}
            {confirming && (
              <div className="mt-4 rounded-lg border p-3" style={{ borderColor: "var(--color-primary)", backgroundColor: "var(--color-bg-subtle)" }}>
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--color-primary)" }} />
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                      Re-style {followingCount} following site{followingCount === 1 ? "" : "s"}?
                    </p>
                    {previewMut.isPending ? (
                      <p className="mt-0.5 text-xs" style={{ color: "var(--color-text-secondary)" }}>Checking impact…</p>
                    ) : preview ? (
                      // Accurate blast radius from the server dry-run.
                      <p className="mt-0.5 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                        <strong>{preview.filter((p) => p.status === "would-push" && p.willChange).length}</strong> will change ·{" "}
                        {preview.filter((p) => p.status === "would-push" && !p.willChange).length} already match ·{" "}
                        {preview.filter((p) => p.status === "skipped-locked").length} locked (kept)
                      </p>
                    ) : (
                      <p className="mt-0.5 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                        Every following site adopts this theme&apos;s tokens.
                        {lockedCount > 0 && ` ${lockedCount} locked site${lockedCount === 1 ? "" : "s"} keep their own and won't change.`}
                      </p>
                    )}
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => pushMut.mutate({})}
                        disabled={pushMut.isPending}
                        className="rounded-md px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                        style={{ backgroundColor: "var(--color-primary)" }}
                      >
                        {pushMut.isPending ? "Pushing…" : `Push to ${followingCount} site${followingCount === 1 ? "" : "s"}`}
                      </button>
                      <button
                        onClick={() => { setConfirming(false); setPreview(null); }}
                        className="rounded-md border px-3 py-1.5 text-xs font-medium"
                        style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-secondary)" }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Per-site push result table. */}
            {pushResults && pushResults.length > 0 && (
              <div className="mt-4 overflow-hidden rounded-lg border" style={{ borderColor: "var(--color-border-default)" }}>
                <div className="flex items-center justify-between border-b px-3 py-2" style={{ borderColor: "var(--color-border-default)" }}>
                  <span className="text-xs font-semibold" style={{ color: "var(--color-text-primary)" }}>Push result</span>
                  <button onClick={() => setPushResults(null)} className="text-neutral-400 hover:text-neutral-600"><X className="h-3.5 w-3.5" /></button>
                </div>
                <ul>
                  {pushResults.map((r) => (
                    <li key={r.siteId} className="flex items-center justify-between border-b px-3 py-1.5 text-xs last:border-0" style={{ borderColor: "var(--color-border-default)" }}>
                      <span style={{ color: "var(--color-text-primary)" }}>{r.name}</span>
                      {r.status === "pushed" ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-[var(--color-success)]"><Check className="h-3 w-3" /> Updated</span>
                          <button
                            onClick={() => { setRollingBack(r.siteId); rollbackMut.mutate({ siteId: r.siteId }); }}
                            disabled={rollingBack === r.siteId}
                            className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-medium transition-colors hover:bg-[var(--color-bg-subtle)] disabled:opacity-50"
                            style={{ color: "var(--color-text-secondary)" }}
                            title="Undo — restore this site's previous theme"
                          >
                            <Undo2 className="h-3 w-3" /> {rollingBack === r.siteId ? "Undoing…" : "Undo"}
                          </button>
                        </span>
                      ) : r.status === "skipped-locked" ? (
                        <span className="inline-flex items-center gap-1 text-neutral-400"><Lock className="h-3 w-3" /> Locked — kept own</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-600" title={r.error}><AlertTriangle className="h-3 w-3" /> Failed</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

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
                  className="flex items-center justify-between gap-4 rounded-lg border bg-white p-3"
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
