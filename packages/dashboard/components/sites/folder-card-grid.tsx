"use client";
import { useEffect, useRef, useState } from "react";
import { Folder, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { cn, formatCompact } from "@lib/utils";
import { Pill, MetricValue } from "@/components/dashboard/primitives";

interface FolderCardData {
  id: string;
  name: string;
  count: number;
  liveCount: number;
  views: number;
}

interface FolderCardGridProps {
  folders: FolderCardData[];
  activeId: string | null;
  showArchived: boolean;
  totalCount: number;
  archivedCount: number;
  onSelect: (id: string | null) => void;
  onToggleArchived: () => void;
  onRenameFolder: (id: string, name: string) => void;
  onDeleteFolder: (id: string, name: string) => void;
  onNewFolder: () => void;
}

function FolderCardMenu({ onRename, onDelete }: { onRename: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div ref={ref} className="relative z-10">
      <button
        type="button"
        aria-label="Folder options"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="rounded-md p-1 transition-colors hover:bg-[var(--color-bg-subtle)]"
        style={{ color: "var(--color-text-muted)" }}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-lg border bg-white shadow-card"
          style={{ borderColor: "var(--color-border-default)" }}
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onRename();
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-body transition-colors hover:bg-[var(--color-bg-subtle)]"
            style={{ color: "var(--color-text-primary)" }}
          >
            <Pencil className="h-3.5 w-3.5" /> Rename folder
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-body transition-colors hover:bg-[var(--color-bg-subtle)]"
            style={{ color: "var(--color-error)" }}
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete folder
          </button>
        </div>
      )}
    </div>
  );
}

/** Folder card grid — replaces the folder tab row. Each card selects a folder
 *  exactly like the old tab did (filters the site list below); "All sites" and
 *  "Archived" stay as pills since this app has no "Apps" concept to pair them
 *  with. */
export function FolderCardGrid({
  folders,
  activeId,
  showArchived,
  totalCount,
  archivedCount,
  onSelect,
  onToggleArchived,
  onRenameFolder,
  onDeleteFolder,
  onNewFolder,
}: FolderCardGridProps) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => onSelect(null)}>
          <Pill tone={!showArchived && activeId === null ? "accent" : "neutral"}>
            All sites · <MetricValue>{totalCount}</MetricValue>
          </Pill>
        </button>
        <button type="button" onClick={onToggleArchived}>
          <Pill tone={showArchived ? "accent" : "neutral"}>
            Archived · <MetricValue>{archivedCount}</MetricValue>
          </Pill>
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {folders.map((folder) => {
          const active = !showArchived && activeId === folder.id;
          return (
            <div
              key={folder.id}
              className={cn(
                "relative flex min-h-[167px] flex-col overflow-hidden rounded-xl border shadow-card transition-colors",
                active && "ring-2 ring-[var(--color-primary)]"
              )}
              style={{ borderColor: "var(--color-border-default)", backgroundColor: "var(--color-bg-surface)" }}
            >
              <div className="absolute right-3 top-3">
                <FolderCardMenu
                  onRename={() => onRenameFolder(folder.id, folder.name)}
                  onDelete={() => onDeleteFolder(folder.id, folder.name)}
                />
              </div>
              <button
                type="button"
                onClick={() => onSelect(folder.id)}
                className="flex h-full w-full flex-col p-5 text-left"
              >
                <Folder className="h-5 w-5" style={{ color: "var(--color-text-muted)" }} />
                <h3 className="mt-auto truncate pr-6 text-section-title font-semibold" style={{ color: "var(--color-text-primary)" }}>
                  {folder.name}
                </h3>
                <p className="mt-1 text-body-sm" style={{ color: "var(--color-text-secondary)" }}>
                  <MetricValue>{folder.count}</MetricValue> sites · <MetricValue>{folder.liveCount}</MetricValue> live ·{" "}
                  <MetricValue>{formatCompact(folder.views)}</MetricValue> views
                </p>
              </button>
            </div>
          );
        })}

        <button
          type="button"
          onClick={onNewFolder}
          className="flex min-h-[167px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-colors hover:bg-[var(--color-bg-subtle)]"
          style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-secondary)" }}
        >
          <Plus className="h-5 w-5" />
          <span className="text-body font-medium">New folder</span>
        </button>
      </div>
    </div>
  );
}
