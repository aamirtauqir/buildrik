"use client";

import { useState } from "react";
import { Boxes, Pencil, Trash2, Check, X } from "lucide-react";
import { trpc } from "@lib/trpc/client";
import { useToast } from "@/components/dashboard/toast-provider";
import { SectionCard, Pill, Button, Modal, InputField } from "@/components/dashboard/primitives";
import { StateEmpty, LoadingSkeleton, ErrorState } from "@/components/states";

type LibComponent = { componentId: string; name: string; siteCount: number; updatedAt: string | Date };

function timeAgo(d: Date | string): string {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function LibraryPanel() {
  const { addToast } = useToast();
  const utils = trpc.useUtils();
  const query = trpc.siteComponents.workspaceList.useQuery(undefined, { retry: false });
  /* Both write paths are ADMIN-gated in `site-component.ts` (workspaceRename /
     workspaceDelete). Same role source the agency layout uses for "Add client",
     so a Designer is not offered a rename it will only be refused after the
     click. The server guard stays the authority; this is about not offering it. */
  const health = trpc.dashboard.health.useQuery();
  const canManageLibrary = health.data?.role === "OWNER" || health.data?.role === "ADMIN";
  const denyReason = "Only workspace admins can change shared library components.";

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleting, setDeleting] = useState<LibComponent | null>(null);

  const renameMut = trpc.siteComponents.workspaceRename.useMutation({
    onSuccess: () => {
      addToast("success", "Component renamed");
      setRenamingId(null);
      utils.siteComponents.workspaceList.invalidate();
    },
    onError: (e) => addToast("error", e.data?.code === "FORBIDDEN" ? "Only admins can rename library components" : "Couldn't rename", e.message),
  });

  const deleteMut = trpc.siteComponents.workspaceDelete.useMutation({
    onSuccess: (res) => {
      addToast("success", `Removed from ${res.deleted} site${res.deleted === 1 ? "" : "s"}`);
      setDeleting(null);
      utils.siteComponents.workspaceList.invalidate();
    },
    onError: (e) => {
      setDeleting(null);
      addToast("error", e.data?.code === "FORBIDDEN" ? "Only admins can delete library components" : "Couldn't delete", e.message);
    },
  });

  const components = (query.data as LibComponent[] | undefined) ?? [];

  const startRename = (c: LibComponent) => {
    setRenamingId(c.componentId);
    setRenameValue(c.name);
  };
  const saveRename = (componentId: string) => {
    const name = renameValue.trim();
    if (name) renameMut.mutate({ componentId, name });
  };

  return (
    <SectionCard title="Shared library" description="Reusable components across every client site. Rename or remove a master — the change lands on every site that uses it.">
      {query.isLoading ? (
        <LoadingSkeleton rows={3} variant="list" />
      ) : query.isError ? (
        <ErrorState
          title="Couldn't load the library"
          description="Something went wrong on our end."
          onRetry={() => query.refetch()}
        />
      ) : components.length === 0 ? (
        <StateEmpty
          icon={<Boxes className="h-7 w-7" />}
          title="No shared components yet"
          description="In the editor, select elements and choose “Save as component” — it lands here, reusable across every client site."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {components.map((c) => {
            const renaming = renamingId === c.componentId;
            return (
              <div
                key={c.componentId}
                className="flex flex-col gap-2 rounded-lg border p-3"
                style={{ borderColor: "var(--color-border-default)" }}
              >
                <div className="flex items-start justify-between gap-2">
                  {renaming ? (
                    <div className="flex flex-1 items-center gap-1">
                      <InputField
                        autoFocus
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") saveRename(c.componentId); if (e.key === "Escape") setRenamingId(null); }}
                        maxLength={200}
                        wrapperClassName="flex-1"
                        aria-label="Component name"
                      />
                      <button onClick={() => saveRename(c.componentId)} disabled={renameMut.isPending} aria-label="Save name" className="p-1 disabled:opacity-50" style={{ color: "var(--color-success)" }}>
                        <Check className="h-4 w-4" />
                      </button>
                      <button onClick={() => setRenamingId(null)} aria-label="Cancel rename" className="p-1" style={{ color: "var(--color-text-muted)" }}>
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <p className="min-w-0 truncate text-body font-semibold" style={{ color: "var(--color-text-primary)" }}>
                      {c.name}
                    </p>
                  )}
                  {!renaming && <Pill tone="neutral">Used on {c.siteCount} site{c.siteCount === 1 ? "" : "s"}</Pill>}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-body-sm" style={{ color: "var(--color-text-muted)" }}>Updated {timeAgo(c.updatedAt)}</span>
                  {!renaming && (
                    <div className="flex gap-1">
                      <button onClick={() => startRename(c)} disabled={!canManageLibrary} title={canManageLibrary ? undefined : denyReason} aria-label={`Rename ${c.name}`} className="flex items-center gap-1 rounded-md px-2 py-1 text-body-sm disabled:opacity-50" style={{ color: "var(--color-text-secondary)" }}>
                        <Pencil className="h-3.5 w-3.5" /> Rename
                      </button>
                      <button onClick={() => setDeleting(c)} disabled={!canManageLibrary} title={canManageLibrary ? undefined : denyReason} aria-label={`Delete ${c.name}`} className="flex items-center gap-1 rounded-md px-2 py-1 text-body-sm disabled:opacity-50" style={{ color: "var(--color-error)" }}>
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title="Delete this component?"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeleting(null)}>Keep it</Button>
            <Button variant="danger" onClick={() => deleting && deleteMut.mutate({ componentId: deleting.componentId })}>
              {deleteMut.isPending ? "Deleting…" : "Delete everywhere"}
            </Button>
          </div>
        }
      >
        <p className="text-body-sm" style={{ color: "var(--color-text-secondary)" }}>
          <strong>{deleting?.name}</strong> is used on <strong>{deleting?.siteCount}</strong> site
          {deleting?.siteCount === 1 ? "" : "s"}. Deleting removes it from all of them — the sites keep
          the elements they already placed, but the shared master is gone. This can’t be undone.
        </p>
      </Modal>
    </SectionCard>
  );
}
