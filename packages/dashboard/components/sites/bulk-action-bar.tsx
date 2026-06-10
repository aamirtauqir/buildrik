"use client";
import { useState } from "react";
import { Archive, FolderInput, Trash2, Download, X, ChevronDown } from "lucide-react";

// Bulk Publish/Unpublish were removed: they only flipped site.status without
// creating publish jobs or deploying/tearing down, so they reported success
// while the live site never changed. Per-site publish goes through the editor.
export const BULK_ACTIONS = [
  { label: "Archive All", action: "archive", icon: "Archive" },
  { label: "Move to Folder", action: "move", icon: "FolderInput" },
  { label: "Delete All", action: "delete", icon: "Trash2" },
  { label: "Export All", action: "export", icon: "Download" },
] as const;

export const BULK_SELECTION_CAP = 25;

const iconMap = { Archive, FolderInput, Trash2, Download } as const;

interface Folder {
  id: string;
  name: string;
}

interface BulkActionBarProps {
  selectedCount: number;
  onAction: (action: string, folderId?: string) => void;
  onClear: () => void;
  folders?: Folder[];
}

export function BulkActionBar({ selectedCount, onAction, onClear, folders = [] }: BulkActionBarProps) {
  const [folderDropdownOpen, setFolderDropdownOpen] = useState(false);

  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-xl border bg-white px-4 py-2.5 shadow-xl" style={{ borderColor: "var(--color-border-default)" }}>
      <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{selectedCount} selected</span>
      <div className="mx-2 h-5 w-px" style={{ backgroundColor: "var(--color-border-default)" }} />
      {BULK_ACTIONS.map((item) => {
        const Icon = iconMap[item.icon as keyof typeof iconMap];
        const isDestructive = item.action === "delete";
        const isMove = item.action === "move";
        return (
          <div key={item.action} className="relative">
            <button
              onClick={() => {
                if (isMove) {
                  setFolderDropdownOpen(!folderDropdownOpen);
                } else {
                  onAction(item.action);
                }
              }}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors hover:bg-[var(--color-bg-subtle)]"
              style={{ color: isDestructive ? "var(--color-primary)" : "var(--color-text-secondary)" }}
            >
              <Icon className="h-3.5 w-3.5" />{item.label}
              {isMove && <ChevronDown className="h-3 w-3" />}
            </button>
            {isMove && folderDropdownOpen && (
              <div className="absolute bottom-full left-0 mb-2 w-48 rounded-lg border bg-white py-1 shadow-lg" style={{ borderColor: "var(--color-border-default)" }}>
                {folders.length === 0 && (
                  <p className="px-3 py-2 text-xs" style={{ color: "var(--color-text-secondary)" }}>No folders available</p>
                )}
                {folders.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => {
                      onAction("move", folder.id);
                      setFolderDropdownOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-xs transition-colors hover:bg-[var(--color-bg-subtle)]"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    <FolderInput className="h-3.5 w-3.5" style={{ color: "var(--color-text-secondary)" }} />
                    {folder.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
      <button onClick={onClear} className="ml-1 rounded p-1 hover:bg-[var(--color-bg-subtle)]"><X className="h-4 w-4" style={{ color: "var(--color-text-secondary)" }} /></button>
    </div>
  );
}
