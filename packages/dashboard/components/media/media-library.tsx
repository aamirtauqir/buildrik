"use client";

import { useState, useRef } from "react";
import { Search, Upload, Trash2, Copy, Check, Folder, ImageOff } from "lucide-react";
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

  const assets = trpc.media.listAssets.useQuery({ search: search || undefined, folderId, limit: 60 });
  const folders = trpc.media.listFolders.useQuery({});
  const quota = trpc.media.checkStorageQuota.useQuery({});

  const deleteAsset = trpc.media.deleteAsset.useMutation({
    onSuccess: () => { assets.refetch(); quota.refetch(); addToast("success", "Asset deleted"); },
    onError: (err) => addToast("error", "Failed", err.message),
  });
  const createAsset = trpc.media.createAsset.useMutation();

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
        <div className="flex flex-wrap gap-1.5">
          <button type="button" onClick={() => setFolderId(undefined)} className="rounded-md border px-2.5 py-1.5 text-xs" style={{ borderColor: folderId === undefined ? "var(--color-primary)" : "var(--color-border-default)", color: folderId === undefined ? "var(--color-primary)" : "var(--color-text-secondary)" }}>All</button>
          {(folders.data ?? []).map((f: { id: string; name: string }) => (
            <button key={f.id} type="button" onClick={() => setFolderId(f.id)} className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs" style={{ borderColor: folderId === f.id ? "var(--color-primary)" : "var(--color-border-default)", color: folderId === f.id ? "var(--color-primary)" : "var(--color-text-secondary)" }}>
              <Folder size={12} /> {f.name}
            </button>
          ))}
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
    </div>
  );
}
