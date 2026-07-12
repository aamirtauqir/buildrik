"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Upload, Trash2, Copy, Check, Folder, FolderPlus, ImageOff, MoreHorizontal, Pencil, X, AlertTriangle } from "lucide-react";
import { upload } from "@vercel/blob/client";
import { trpc } from "@lib/trpc/client";
import { useToast } from "@/components/dashboard/toast-provider";

type MediaType = "image" | "video" | "icon" | "font";

function mediaTypeFromMime(mime: string): MediaType {
  if (mime === "image/svg+xml") return "icon";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("font/") || mime.includes("font")) return "font";
  return "image";
}

function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function MediaLibrary({ workspaceId }: { workspaceId: string }) {
  void workspaceId; // assets are user-scoped server-side
  const { addToast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [folderId, setFolderId] = useState<string | null | undefined>(undefined);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [renameTarget, setRenameTarget] = useState<{ id: string; name: string } | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createValue, setCreateValue] = useState("");
  const folderMenuRef = useRef<HTMLDivElement>(null);

  const assets = trpc.media.listAssets.useQuery({ search: search || undefined, folderId, limit: 60 });
  const folders = trpc.media.listFolders.useQuery({});
  const quota = trpc.media.checkStorageQuota.useQuery({});

  const deleteAsset = trpc.media.deleteAsset.useMutation({
    onSuccess: () => { assets.refetch(); quota.refetch(); addToast("success", "Asset deleted"); },
    onError: (err) => addToast("error", "Failed", err.message),
  });
  const createAsset = trpc.media.createAsset.useMutation();

  const createFolder = trpc.media.createFolder.useMutation({
    onSuccess: (folder) => {
      folders.refetch();
      setCreateOpen(false);
      setCreateValue("");
      setFolderId(folder.id);
      addToast("success", "Folder created");
    },
    onError: (err) => addToast("error", "Create failed", err.message),
  });
  const renameFolder = trpc.media.renameFolder.useMutation({
    onSuccess: () => { folders.refetch(); setRenameTarget(null); addToast("success", "Folder renamed"); },
    onError: (err) => addToast("error", "Rename failed", err.message),
  });
  const deleteFolder = trpc.media.deleteFolder.useMutation({
    onSuccess: (res, variables) => {
      folders.refetch();
      assets.refetch();
      // If the deleted folder was the active filter, fall back to All.
      setFolderId((cur) => (cur === variables.folderId ? undefined : cur));
      setDeleteTarget(null);
      addToast(
        "success",
        "Folder deleted",
        res.movedAssets > 0
          ? `${res.movedAssets} asset${res.movedAssets === 1 ? "" : "s"} moved to All`
          : undefined
      );
    },
    onError: (err) => addToast("error", "Delete failed", err.message),
  });

  // Close the folder action menu on any outside click.
  useEffect(() => {
    if (!openMenuId) return;
    function onDown(e: MouseEvent) {
      if (folderMenuRef.current && !folderMenuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [openMenuId]);

  const onPickFiles = () => fileRef.current?.click();

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    setUploading(true);
    try {
      for (const file of files) {
        const type = mediaTypeFromMime(file.type);
        const blob = await upload(file.name, file, {
          access: "public",
          handleUploadUrl: "/api/asset-upload",
          clientPayload: JSON.stringify({ bytes: file.size, type, mimeType: file.type, filename: file.name }),
        });
        // Idempotent upsert-by-url; pairs with the server completion webhook.
        await createAsset.mutateAsync({ url: blob.url, bytes: file.size, type, mimeType: file.type, filename: file.name });
      }
      addToast("success", files.length > 1 ? `${files.length} files uploaded` : "File uploaded");
      assets.refetch();
      quota.refetch();
    } catch (err) {
      addToast("error", "Upload failed", err instanceof Error ? err.message : "Try again");
    } finally {
      setUploading(false);
    }
  };

  const copyUrl = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 1500);
  };

  const items = assets.data?.items ?? [];
  const q = quota.data;
  const usedPct = q && q.totalBytes > 0 ? Math.min((q.usedBytes / q.totalBytes) * 100, 100) : 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold" style={{ color: "var(--color-text-primary)" }}>Media</h1>
          <p className="mt-0.5 text-sm" style={{ color: "var(--color-text-secondary)" }}>One asset store for every site in this workspace.</p>
        </div>
        <button
          type="button"
          onClick={onPickFiles}
          disabled={uploading}
          className="inline-flex items-center gap-1.5 rounded-md bg-[var(--color-primary)] px-3 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
        >
          <Upload size={15} /> {uploading ? "Uploading…" : "Upload"}
        </button>
        <input ref={fileRef} type="file" multiple accept="image/*,video/*,.woff,.woff2,.ttf,.otf" className="hidden" onChange={handleFiles} />
      </div>

      {/* Search + folder chips */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assets…"
            className="w-full rounded-md border py-2 pl-9 pr-3 text-sm outline-none focus:border-[var(--color-primary)]"
            style={{ borderColor: "var(--color-border-default)" }}
          />
        </div>
        <div ref={folderMenuRef} className="flex flex-wrap items-center gap-1.5">
          <button type="button" onClick={() => setFolderId(undefined)} className="rounded-md border px-2.5 py-1.5 text-xs" style={{ borderColor: folderId === undefined ? "var(--color-primary)" : "var(--color-border-default)", color: folderId === undefined ? "var(--color-primary)" : "var(--color-text-secondary)" }}>All</button>
          {(folders.data ?? []).map((f: { id: string; name: string }) => {
            const active = folderId === f.id;
            return (
              <div key={f.id} className="relative inline-flex items-center rounded-md border text-xs" style={{ borderColor: active ? "var(--color-primary)" : "var(--color-border-default)", color: active ? "var(--color-primary)" : "var(--color-text-secondary)" }}>
                <button type="button" onClick={() => setFolderId(f.id)} className="inline-flex items-center gap-1 py-1.5 pl-2.5 pr-1">
                  <Folder size={12} /> {f.name}
                </button>
                <button type="button" onClick={() => setOpenMenuId((cur) => (cur === f.id ? null : f.id))} className="flex items-center rounded-r-md py-1.5 pl-0.5 pr-1.5 hover:bg-[var(--color-bg-subtle)]" aria-label={`Actions for ${f.name}`}>
                  <MoreHorizontal size={13} />
                </button>
                {openMenuId === f.id && (
                  <div className="absolute right-0 top-full z-20 mt-1 w-36 overflow-hidden rounded-lg border bg-white py-1 shadow-lg" style={{ borderColor: "var(--color-border-default)" }}>
                    <button type="button" onClick={() => { setRenameTarget({ id: f.id, name: f.name }); setRenameValue(f.name); setOpenMenuId(null); }} className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-[var(--color-bg-subtle)]" style={{ color: "var(--color-text-primary)" }}>
                      <Pencil size={13} style={{ color: "var(--color-text-secondary)" }} /> Rename
                    </button>
                    <button type="button" onClick={() => { setDeleteTarget({ id: f.id, name: f.name }); setOpenMenuId(null); }} className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-[var(--color-bg-subtle)]" style={{ color: "var(--color-error)" }}>
                      <Trash2 size={13} style={{ color: "var(--color-error)" }} /> Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          <button
            type="button"
            onClick={() => { setCreateValue(""); setCreateOpen(true); }}
            className="inline-flex items-center gap-1 rounded-md border border-dashed px-2.5 py-1.5 text-xs transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
            style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-secondary)" }}
          >
            <FolderPlus size={12} /> New folder
          </button>
        </div>
      </div>

      {/* Grid */}
      {assets.isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => <div key={i} className="aspect-square animate-pulse rounded-lg bg-neutral-100" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center" style={{ borderColor: "var(--color-border-default)" }}>
          <ImageOff size={26} className="mx-auto mb-2 text-neutral-400" />
          <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{search ? "No assets match your search" : "No assets yet"}</p>
          <p className="mt-0.5 text-sm" style={{ color: "var(--color-text-secondary)" }}>{search ? "Try a different term." : "Upload images, video, or fonts to use across your sites."}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {items.map((a) => (
            <div key={a.id} className="group relative overflow-hidden rounded-lg border" style={{ borderColor: "var(--color-border-default)" }}>
              <div className="flex aspect-square items-center justify-center bg-neutral-50">
                {a.type === "image" || a.type === "icon" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.url} alt={a.altText ?? a.filename} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs font-medium uppercase text-neutral-400">{a.type}</span>
                )}
              </div>
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                <span className="truncate text-[11px] text-white">{a.filename}</span>
                <div className="flex shrink-0 gap-1">
                  <button type="button" onClick={() => copyUrl(a.id, a.url)} className="rounded bg-white/90 p-1 text-neutral-700 hover:bg-white" title="Copy URL">
                    {copiedId === a.id ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                  <button type="button" onClick={() => deleteAsset.mutate({ assetId: a.id })} className="rounded bg-white/90 p-1 text-red-600 hover:bg-white" title="Delete">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Storage footer */}
      <div className="flex items-center justify-between rounded-xl border p-4" style={{ borderColor: "var(--color-border-default)" }}>
        <div className="flex-1">
          <div className="flex items-center justify-between text-xs" style={{ color: "var(--color-text-secondary)" }}>
            <span>{items.length} asset{items.length === 1 ? "" : "s"}</span>
            <span>
              {q ? (q.totalBytes === -1 ? `${formatBytes(q.usedBytes)} used` : `${formatBytes(q.usedBytes)} / ${formatBytes(q.totalBytes)}`) : "—"}
            </span>
          </div>
          {q && q.totalBytes > 0 && (
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-border-default)]">
              <div className="h-full rounded-full transition-all" style={{ width: `${usedPct}%`, backgroundColor: usedPct >= 85 ? "#EF4444" : usedPct >= 80 ? "#EAB308" : "var(--color-success)" }} />
            </div>
          )}
          {q?.warningAt80Percent && (
            <p className="mt-1.5 text-xs text-amber-700">Storage is almost full — <a href="/dashboard/billing" className="font-medium underline">upgrade</a> for more.</p>
          )}
        </div>
      </div>

      {/* Create folder */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setCreateOpen(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>New folder</h2>
            <input
              type="text"
              value={createValue}
              onChange={(e) => setCreateValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && createValue.trim()) {
                  createFolder.mutate({ name: createValue.trim() });
                } else if (e.key === "Escape") {
                  setCreateOpen(false);
                }
              }}
              placeholder="Folder name"
              autoFocus
              maxLength={80}
              className="mt-4 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]"
              style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-primary)" }}
            />
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setCreateOpen(false)}
                className="flex-1 rounded-lg border py-2.5 text-sm font-medium transition-colors hover:bg-[var(--color-bg-page)]"
                style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-primary)" }}
              >
                Cancel
              </button>
              <button
                onClick={() => { if (createValue.trim()) createFolder.mutate({ name: createValue.trim() }); }}
                disabled={!createValue.trim() || createFolder.isPending}
                className="flex-1 rounded-lg py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                {createFolder.isPending ? "Creating…" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename folder */}
      {renameTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setRenameTarget(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>Rename folder</h2>
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && renameValue.trim()) {
                  renameFolder.mutate({ folderId: renameTarget.id, name: renameValue.trim() });
                } else if (e.key === "Escape") {
                  setRenameTarget(null);
                }
              }}
              placeholder="Folder name"
              autoFocus
              className="mt-4 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]"
              style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-primary)" }}
            />
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setRenameTarget(null)}
                className="flex-1 rounded-lg border py-2.5 text-sm font-medium transition-colors hover:bg-[var(--color-bg-page)]"
                style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-primary)" }}
              >
                Cancel
              </button>
              <button
                onClick={() => { if (renameValue.trim()) renameFolder.mutate({ folderId: renameTarget.id, name: renameValue.trim() }); }}
                disabled={!renameValue.trim() || renameValue.trim() === renameTarget.name || renameFolder.isPending}
                className="flex-1 rounded-lg py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                {renameFolder.isPending ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete folder — assets are un-assigned to All, not deleted */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "#0000004D" }} onClick={() => setDeleteTarget(null)}>
          <div className="w-[420px] rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold" style={{ color: "var(--color-error)" }}>Delete folder?</h2>
              <button onClick={() => setDeleteTarget(null)}><X className="h-5 w-5" style={{ color: "var(--color-text-secondary)" }} /></button>
            </div>
            <div className="mt-4 flex items-start gap-3 rounded-lg p-3" style={{ backgroundColor: "#FEF2F2" }}>
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" style={{ color: "var(--color-error)" }} />
              <p className="text-sm" style={{ color: "#991B1B" }}>
                Delete <strong>{deleteTarget.name}</strong>? Assets in this folder stay in your library and move to <strong>All</strong>. This can’t be undone.
              </p>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setDeleteTarget(null)} className="rounded-lg border px-4 py-2 text-sm" style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-secondary)" }}>Cancel</button>
              <button onClick={() => deleteFolder.mutate({ folderId: deleteTarget.id })} disabled={deleteFolder.isPending} className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50" style={{ backgroundColor: "var(--color-error)" }}>
                {deleteFolder.isPending ? "Deleting…" : "Delete folder"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
