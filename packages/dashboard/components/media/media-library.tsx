"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Upload, Trash2, Copy, Check, Folder, FolderPlus, Images, ImageOff, MoreHorizontal, Pencil, AlertTriangle, Plus } from "lucide-react";
import { upload } from "@vercel/blob/client";
import { trpc } from "@lib/trpc/client";
import { useToast } from "@/components/dashboard/toast-provider";
import { Button, Modal, PageHeader, MetricValue, ProgressBar, InputField, FilterTabs } from "@/components/dashboard/primitives";
import { ErrorState } from "@/components/states";

type MediaType = "image" | "video" | "icon" | "font";

const TYPE_FILTERS = [
  { value: "all", label: "All" },
  { value: "image", label: "Images" },
  { value: "icon", label: "Logos" },
] as const;
type TypeFilter = (typeof TYPE_FILTERS)[number]["value"];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "name", label: "Name" },
] as const;
type SortOption = (typeof SORT_OPTIONS)[number]["value"];

const PAGE_SIZE = 24;

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
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [renameTarget, setRenameTarget] = useState<{ id: string; name: string } | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleteAssetTarget, setDeleteAssetTarget] = useState<{ id: string; name: string } | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createValue, setCreateValue] = useState("");
  const folderMenuRef = useRef<HTMLDivElement>(null);

  const assets = trpc.media.listAssets.useQuery({
    search: search || undefined,
    folderId,
    type: typeFilter === "all" ? undefined : typeFilter,
    limit,
  });
  const folders = trpc.media.listFolders.useQuery({});
  const quota = trpc.media.checkStorageQuota.useQuery({});

  const deleteAsset = trpc.media.deleteAsset.useMutation({
    onSuccess: () => { assets.refetch(); quota.refetch(); setDeleteAssetTarget(null); addToast("success", "Asset deleted"); },
    onError: (err) => addToast("error", "Couldn't delete asset", err.message),
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
        // Carry the active folder so uploads land where the user is looking —
        // without this, files always went to root and folders stayed unfillable.
        await createAsset.mutateAsync({ url: blob.url, bytes: file.size, type, mimeType: file.type, filename: file.name, folderId: folderId ?? null });
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

  const rawItems = assets.data?.items ?? [];
  const items = sortBy === "name" ? [...rawItems].sort((a, b) => a.filename.localeCompare(b.filename)) : rawItems;
  const hasMore = Boolean(assets.data?.nextCursor);
  const q = quota.data;
  const usedPct = q && q.totalBytes > 0 ? Math.min((q.usedBytes / q.totalBytes) * 100, 100) : 0;

  return (
    <div>
      {/* Title matches the nav label. `shell/nav.ts:25` is the SSOT for what
          this destination is called; the page had drifted to "Media library". */}
      <PageHeader
        title="Media"
        description="Images, logos and assets across your sites."
        actions={
          <Button type="button" onClick={onPickFiles} disabled={uploading} className="gap-1.5">
            <Upload size={15} /> {uploading ? "Uploading…" : "Upload"}
          </Button>
        }
      />
      <input ref={fileRef} type="file" multiple accept="image/*,video/*,.woff,.woff2,.ttf,.otf" className="hidden" onChange={handleFiles} />

      {/* Full-width search + filters row, above the rail/grid split */}
      <div className="mb-5 flex flex-wrap items-center gap-2.5">
        <InputField
          wrapperClassName="w-[280px]"
          leading={<Search size={15} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search assets…"
          aria-label="Search assets"
        />
        <FilterTabs value={typeFilter} onChange={setTypeFilter} options={TYPE_FILTERS} />
        <FilterTabs value={sortBy} onChange={setSortBy} options={SORT_OPTIONS} />
        {!assets.isLoading && (
          <span className="ml-auto shrink-0 text-body-sm" style={{ color: "var(--color-text-secondary)" }}>
            {items.length} asset{items.length === 1 ? "" : "s"}
          </span>
        )}
      </div>

      <div className="flex items-start gap-6">
        {/* Left category rail */}
        <aside ref={folderMenuRef} className="w-[180px] shrink-0">
          <nav className="flex flex-col gap-0.5">
            <button
              type="button"
              onClick={() => setFolderId(undefined)}
              className="flex items-center gap-2 rounded-md px-2.5 py-2 text-left text-[13.5px] transition-colors"
              style={
                folderId === undefined
                  ? { backgroundColor: "var(--color-primary-subtle)", color: "var(--color-primary)", fontWeight: 600 }
                  : { color: "var(--color-text-secondary)", fontWeight: 500 }
              }
            >
              <Images size={14} /> All media
            </button>
            {(folders.data ?? []).map((f: { id: string; name: string }) => {
              const active = folderId === f.id;
              return (
                <div key={f.id} className="group/row relative flex items-center rounded-md" style={active ? { backgroundColor: "var(--color-primary-subtle)" } : undefined}>
                  <button
                    type="button"
                    onClick={() => setFolderId(f.id)}
                    className="flex min-w-0 flex-1 items-center gap-2 rounded-md py-2 pl-2.5 pr-1 text-left text-[13.5px] transition-colors"
                    style={{ color: active ? "var(--color-primary)" : "var(--color-text-secondary)", fontWeight: active ? 600 : 500 }}
                  >
                    <Folder size={14} className="shrink-0" /> <span className="truncate">{f.name}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpenMenuId((cur) => (cur === f.id ? null : f.id))}
                    className="flex shrink-0 items-center rounded-md p-1 opacity-0 transition-opacity group-hover/row:opacity-100 hover:bg-[var(--color-bg-subtle)]"
                    style={{ color: active ? "var(--color-primary)" : "var(--color-text-muted)" }}
                    aria-label={`Actions for ${f.name}`}
                  >
                    <MoreHorizontal size={15} />
                  </button>
                  {openMenuId === f.id && (
                    <div className="absolute right-0 top-full z-20 mt-1 w-36 overflow-hidden rounded-lg border py-1 shadow-card" style={{ borderColor: "var(--color-border-default)", backgroundColor: "var(--color-bg-surface)" }}>
                      <button type="button" onClick={() => { setRenameTarget({ id: f.id, name: f.name }); setRenameValue(f.name); setOpenMenuId(null); }} className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-body-sm hover:bg-[var(--color-bg-subtle)]" style={{ color: "var(--color-text-primary)" }}>
                        <Pencil size={13} style={{ color: "var(--color-text-secondary)" }} /> Rename
                      </button>
                      <button type="button" onClick={() => { setDeleteTarget({ id: f.id, name: f.name }); setOpenMenuId(null); }} className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-body-sm hover:bg-[var(--color-bg-subtle)]" style={{ color: "var(--color-error)" }}>
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
              className="mt-1 flex items-center gap-2 rounded-md px-2.5 py-2 text-left text-[13.5px] transition-colors hover:text-[var(--color-primary)]"
              style={{ color: "var(--color-text-muted)" }}
            >
              <FolderPlus size={14} /> New folder
            </button>
          </nav>

          {/* Storage usage */}
          {q && (
            <div className="mt-5 border-t pt-4" style={{ borderColor: "var(--color-border-default)" }}>
              <div className="flex items-center justify-between text-body-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>
                <span>Storage</span>
                <span style={{ color: "var(--color-text-muted)" }}>
                  <MetricValue>{formatBytes(q.usedBytes)}</MetricValue>
                  {q.totalBytes === -1 ? " used" : <> / <MetricValue>{formatBytes(q.totalBytes)}</MetricValue></>}
                </span>
              </div>
              {q.totalBytes > 0 && <ProgressBar pct={usedPct} tone="auto" className="mt-2" />}
              {q.warningAt80Percent && (
                <p className="mt-1.5 text-body-sm" style={{ color: "var(--color-error)" }}>
                  Almost full — <a href="/dashboard/settings/billing" className="font-medium underline">upgrade</a>.
                </p>
              )}
            </div>
          )}
        </aside>

        {/* Right column: grid */}
        <div className="min-w-0 flex-1">
          {assets.isLoading ? (
            <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-lg" style={{ height: 140, backgroundColor: "var(--color-bg-subtle)" }} />
              ))}
            </div>
          ) : assets.isError ? (
            // Was "No assets yet" on a failed query — a fake-empty hiding the error.
            <ErrorState title="Couldn't load your media" description="Something went wrong on our end." onRetry={() => assets.refetch()} />
          ) : items.length === 0 ? (
            <div className="rounded-xl border border-dashed p-12 text-center" style={{ borderColor: "var(--color-border-default)" }}>
              <ImageOff size={26} className="mx-auto mb-2" style={{ color: "var(--color-text-placeholder)" }} />
              <p className="text-body font-medium" style={{ color: "var(--color-text-primary)" }}>{search ? "No assets match your search" : "No assets yet"}</p>
              <p className="mt-0.5 text-body" style={{ color: "var(--color-text-secondary)" }}>{search ? "Try a different term." : "Upload images, video, or fonts to use across your sites."}</p>
              {!search && !folderId && typeFilter === "all" && (
                <div className="mt-4">
                  <Button onClick={onPickFiles} className="gap-1.5">
                    <Upload size={15} /> Upload
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
                {items.map((a) => (
                  <div key={a.id} className="group relative overflow-hidden rounded-lg border shadow-card" style={{ borderColor: "var(--color-border-default)" }}>
                    <div className="flex items-center justify-center" style={{ height: 140, backgroundColor: "var(--color-bg-subtle)" }}>
                      {a.type === "image" || a.type === "icon" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={a.url} alt={a.altText ?? a.filename} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-body-sm font-medium uppercase" style={{ color: "var(--color-text-muted)" }}>{a.type}</span>
                      )}
                    </div>
                    {/* Always-on filename/size caption */}
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 px-2.5 pb-2 pt-5" style={{ background: "linear-gradient(rgba(15,23,42,0), rgba(15,23,42,0.55))" }}>
                      <p className="truncate text-[11.5px] font-semibold text-white">{a.filename}</p>
                      <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.78)" }}>{formatBytes(a.bytes)}</p>
                    </div>
                    {/* Hover actions */}
                    <div className="absolute right-1.5 top-1.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button type="button" onClick={() => copyUrl(a.id, a.url)} className="rounded p-1 hover:bg-white" style={{ backgroundColor: "rgba(255,255,255,0.9)", color: "var(--color-text-primary)" }} title="Copy URL">
                        {copiedId === a.id ? <Check size={12} /> : <Copy size={12} />}
                      </button>
                      <button type="button" onClick={() => setDeleteAssetTarget({ id: a.id, name: a.filename })} className="rounded p-1 hover:bg-white" style={{ backgroundColor: "rgba(255,255,255,0.9)", color: "var(--color-error)" }} title="Delete" aria-label={`Delete ${a.filename}`}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
                {/* Trailing upload tile */}
                <button
                  type="button"
                  onClick={onPickFiles}
                  disabled={uploading}
                  className="flex items-center justify-center rounded-lg border-dashed transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] disabled:opacity-60"
                  style={{ height: 140, borderWidth: 1.5, borderColor: "var(--color-border-strong)", color: "var(--color-text-muted)" }}
                  aria-label={uploading ? "Uploading" : "Upload files"}
                  title="Upload files"
                >
                  <Plus size={20} />
                </button>
              </div>
              {hasMore && (
                <div className="mt-5 flex justify-center">
                  <Button type="button" variant="ghost" onClick={() => setLimit((l) => l + PAGE_SIZE)} disabled={assets.isFetching}>
                    {assets.isFetching ? "Loading…" : "Load more assets"}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Create folder */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New folder"
        width={384}
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={() => { if (createValue.trim()) createFolder.mutate({ name: createValue.trim() }); }}
              disabled={!createValue.trim() || createFolder.isPending}
              className="flex-1"
            >
              {createFolder.isPending ? "Creating…" : "Create"}
            </Button>
          </>
        }
      >
        <input
          type="text"
          value={createValue}
          onChange={(e) => setCreateValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && createValue.trim()) {
              createFolder.mutate({ name: createValue.trim() });
            }
          }}
          placeholder="Folder name"
          autoFocus
          maxLength={80}
          className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]"
          style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-primary)" }}
        />
      </Modal>

      {/* Rename folder */}
      <Modal
        open={renameTarget !== null}
        onClose={() => setRenameTarget(null)}
        title="Rename folder"
        width={384}
        footer={
          <>
            <Button variant="ghost" onClick={() => setRenameTarget(null)} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={() => { if (renameTarget && renameValue.trim()) renameFolder.mutate({ folderId: renameTarget.id, name: renameValue.trim() }); }}
              disabled={!renameValue.trim() || renameValue.trim() === renameTarget?.name || renameFolder.isPending}
              className="flex-1"
            >
              {renameFolder.isPending ? "Saving…" : "Save"}
            </Button>
          </>
        }
      >
        <input
          type="text"
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && renameTarget && renameValue.trim()) {
              renameFolder.mutate({ folderId: renameTarget.id, name: renameValue.trim() });
            }
          }}
          placeholder="Folder name"
          autoFocus
          className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]"
          style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-primary)" }}
        />
      </Modal>

      {/* Delete folder — assets are un-assigned to All, not deleted */}
      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Delete folder?"
        width={420}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button
              variant="danger"
              onClick={() => deleteTarget && deleteFolder.mutate({ folderId: deleteTarget.id })}
              disabled={deleteFolder.isPending}
            >
              {deleteFolder.isPending ? "Deleting…" : "Delete folder"}
            </Button>
          </>
        }
      >
        <div className="flex items-start gap-3 rounded-lg p-3" style={{ backgroundColor: "var(--color-error-subtle)" }}>
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" style={{ color: "var(--color-error)" }} />
          <p className="text-sm" style={{ color: "var(--color-error)" }}>
            Delete <strong>{deleteTarget?.name}</strong>? Assets in this folder stay in your library and move to <strong>All</strong>. This can’t be undone.
          </p>
        </div>
      </Modal>

      {/* Delete asset — the file may be referenced by a live site, so confirm. */}
      <Modal
        open={deleteAssetTarget !== null}
        onClose={() => setDeleteAssetTarget(null)}
        title="Delete asset?"
        width={420}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteAssetTarget(null)}>Cancel</Button>
            <Button
              variant="danger"
              onClick={() => deleteAssetTarget && deleteAsset.mutate({ assetId: deleteAssetTarget.id })}
              disabled={deleteAsset.isPending}
            >
              {deleteAsset.isPending ? "Deleting…" : "Delete asset"}
            </Button>
          </>
        }
      >
        <div className="flex items-start gap-3 rounded-lg p-3" style={{ backgroundColor: "var(--color-error-subtle)" }}>
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" style={{ color: "var(--color-error)" }} />
          <p className="text-sm" style={{ color: "var(--color-error)" }}>
            Delete <strong>{deleteAssetTarget?.name}</strong>? If a published site uses this file, it will break. This can’t be undone.
          </p>
        </div>
      </Modal>
    </div>
  );
}
