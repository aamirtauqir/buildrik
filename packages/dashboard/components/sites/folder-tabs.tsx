"use client";
import { useEffect, useRef, useState } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { cn } from "@lib/utils";

interface FolderTab {
  id: string | null;
  name: string;
  count: number;
}

interface FolderTabsProps {
  tabs: FolderTab[];
  activeId: string | null;
  onSelect: (id: string | null) => void;
  /** Folder management (E4 parity) — surfaces on the active folder tab only. */
  onRenameFolder: (id: string, name: string) => void;
  onDeleteFolder: (id: string, name: string) => void;
  archivedCount: number;
  showArchived: boolean;
  onToggleArchived: () => void;
}

function Tab({ active, onClick, name, count }: { active: boolean; onClick: () => void; name: string; count: number }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "-mb-px flex items-center gap-1.5 border-b-2 px-1 py-2.5 text-body font-medium transition-colors",
        active
          ? "border-[var(--color-primary)] text-[var(--color-primary)]"
          : "border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
      )}
    >
      {name}
      <span
        className="rounded-pill px-1.5 py-0.5 text-eyebrow font-semibold"
        style={{
          backgroundColor: active ? "var(--color-primary-subtle)" : "var(--color-bg-subtle)",
          color: active ? "var(--color-primary)" : "var(--color-text-muted)",
        }}
      >
        {count}
      </span>
    </button>
  );
}

export function FolderTabs({ tabs, activeId, onSelect, onRenameFolder, onDeleteFolder, archivedCount, showArchived, onToggleArchived }: FolderTabsProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // The manage menu belongs to the active folder — close it when selection moves.
  useEffect(() => {
    setMenuOpen(false);
  }, [activeId, showArchived]);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [menuOpen]);

  return (
    <div className="flex items-center gap-5 border-b" style={{ borderColor: "var(--color-border-default)" }}>
      {tabs.map((tab) => {
        const active = !showArchived && activeId === tab.id;
        // Only a real, active folder is manageable — "All Sites" (id null) has
        // nothing to rename or delete.
        if (!active || tab.id === null) {
          return (
            <Tab
              key={tab.id ?? "all"}
              active={active}
              onClick={() => onSelect(tab.id)}
              name={tab.name}
              count={tab.count}
            />
          );
        }
        const folderId = tab.id;
        return (
          <div key={folderId} ref={menuRef} className="relative flex items-center">
            <Tab active onClick={() => onSelect(folderId)} name={tab.name} count={tab.count} />
            <button
              type="button"
              aria-label={`Folder options: ${tab.name}`}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
              className="ml-1 rounded-md p-1 transition-colors hover:bg-[var(--color-bg-subtle)]"
              style={{ color: "var(--color-text-muted)" }}
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
            {menuOpen && (
              <div
                role="menu"
                className="absolute left-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-lg border bg-white shadow-card"
                style={{ borderColor: "var(--color-border-default)" }}
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    onRenameFolder(folderId, tab.name);
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
                    setMenuOpen(false);
                    onDeleteFolder(folderId, tab.name);
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
      })}
      <Tab active={showArchived} onClick={onToggleArchived} name="Archived" count={archivedCount} />
    </div>
  );
}
