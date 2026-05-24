"use client";
import { useState, useRef, useEffect } from "react";
import { Pencil, Settings, Type, Copy, FolderInput, UserCheck, Download, ExternalLink, Link2, Archive, Trash2, MoreHorizontal } from "lucide-react";

export const CONTEXT_MENU_ITEMS = [
  { label: "Edit", action: "edit", icon: "Pencil" },
  { label: "Manage", action: "manage", icon: "Settings" },
  { label: "Rename", action: "rename", icon: "Type" },
  { label: "Duplicate", action: "duplicate", icon: "Copy" },
  { label: "Move to Folder", action: "moveToFolder", icon: "FolderInput" },
  { label: "Transfer Site", action: "transfer", icon: "UserCheck" },
  { label: "Export Site", action: "export", icon: "Download" },
  { label: "View Published", action: "viewPublished", icon: "ExternalLink" },
  { label: "Copy Site URL", action: "copyUrl", icon: "Link2" },
  { label: "Archive", action: "archive", icon: "Archive" },
  { label: "Delete", action: "delete", icon: "Trash2" },
] as const;

const iconMap = { Pencil, Settings, Type, Copy, FolderInput, UserCheck, Download, ExternalLink, Link2, Archive, Trash2 } as const;

interface ContextMenuProps {
  siteStatus?: string;
  onAction: (action: string) => void;
}

export function ContextMenu({ siteStatus, onAction }: ContextMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(!open); }} className="rounded-lg p-1.5 transition-colors hover:bg-[#F4F4F4]">
        <MoreHorizontal className="h-4 w-4" style={{ color: "#7A7A7A" }} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-xl border bg-white py-1 shadow-lg" style={{ borderColor: "#E8E8E8" }}>
          {CONTEXT_MENU_ITEMS.map((item) => {
            const Icon = iconMap[item.icon as keyof typeof iconMap];
            const isDestructive = item.action === "archive" || item.action === "delete";
            const showDivider = item.action === "copyUrl";
            const isDisabled = item.action === "viewPublished" && siteStatus !== "PUBLISHED";
            return (
              <div key={item.action}>
                {showDivider && <div className="my-1 h-px" style={{ backgroundColor: "#E8E8E8" }} />}
                <div className="relative group">
                  <button
                    disabled={isDisabled}
                    onClick={() => { onAction(item.action); setOpen(false); }}
                    className="flex w-full items-center gap-2.5 px-3 py-1.5 text-sm transition-colors hover:bg-[#F4F4F4] disabled:cursor-not-allowed disabled:opacity-40"
                    style={{ color: isDestructive ? "var(--color-primary)" : "#0D0D0D" }}
                  >
                    <Icon className="h-4 w-4" style={{ color: isDestructive ? "var(--color-primary)" : "#7A7A7A" }} />{item.label}
                  </button>
                  {isDisabled && (
                    <div className="pointer-events-none absolute bottom-full left-1/2 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md px-2 py-1 text-xs text-white group-hover:block" style={{ backgroundColor: "#0D0D0D" }}>
                      Site is not published
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
