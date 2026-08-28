"use client";
import { useEffect, useRef, useState } from "react";
import { Folder, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
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
  onSelect: (id: string | null) => void;
  onRenameFolder: (id: string, name: string) => void;
  onDeleteFolder: (id: string, name: string) => void;
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

/** Folder card grid — folder navigation only. Each card selects a folder
 *  (filters the site list below); the "All sites" pill clears the folder
 *  selection. Archived is a status filter now (see SiteFilters), not a pill
 *  here. The whole row is hidden when there are no folders. */
export function FolderCardGrid({
  folders,
  activeId,
  onSelect,
  onRenameFolder,
  onDeleteFolder,
}: FolderCardGridProps) {
  if (folders.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => onSelect(null)}>
          <Pill tone={activeId === null ? "accent" : "neutral"}>
            All sites
          </Pill>
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {folders.map((folder) => {
          const active = activeId === folder.id;
          return (
            <div
              key={folder.id}
              /* Was min-h-[167px] with the icon pinned top and the label pushed
                 to the bottom by mt-auto — a 220px tall tile that was ~70%
                 empty, in its own band above the site grid. A folder is a
                 filter, not a site: it gets a row, not a poster. */
              className={cn(
                "relative flex flex-col overflow-hidden rounded-lg border shadow-card transition-colors hover:border-[var(--color-border-strong)]",
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
                className="flex w-full items-center gap-3 p-4 text-left"
              >
                <span
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-lg"
                  style={{ backgroundColor: "var(--color-bg-subtle)" }}
                >
                  <Folder className="h-[18px] w-[18px]" style={{ color: "var(--color-text-muted)" }} />
                </span>
                <span className="min-w-0 flex-1">
                <h3 className="truncate pr-6 text-body font-semibold" style={{ color: "var(--color-text-primary)" }}>
                  {folder.name}
                </h3>
                <p className="mt-0.5 truncate text-body-sm" style={{ color: "var(--color-text-secondary)" }}>
                  <MetricValue>{folder.count}</MetricValue> sites · <MetricValue>{folder.liveCount}</MetricValue> live ·{" "}
                  <MetricValue>{formatCompact(folder.views)}</MetricValue> views
                </p>
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
