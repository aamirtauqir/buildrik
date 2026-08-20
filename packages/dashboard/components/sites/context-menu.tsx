"use client";
import { useState, useRef, useEffect } from "react";
import { Pencil, Settings, Type, Copy, UserCheck, ExternalLink, Link2, Archive, Trash2, MoreHorizontal } from "lucide-react";

// "Move to Folder" + "Export Site" removed — handleSiteAction had no case for
// either (folder-move works via drag + bulk select; no export backend exists),
// so both were dead clicks.
export const CONTEXT_MENU_ITEMS = [
  { label: "Edit", action: "edit", icon: "Pencil" },
  { label: "Manage", action: "manage", icon: "Settings" },
  { label: "Rename", action: "rename", icon: "Type" },
  { label: "Duplicate", action: "duplicate", icon: "Copy" },
  { label: "Transfer Site", action: "transfer", icon: "UserCheck" },
  { label: "View Published", action: "viewPublished", icon: "ExternalLink" },
  { label: "Copy Site URL", action: "copyUrl", icon: "Link2" },
  { label: "Archive", action: "archive", icon: "Archive" },
  { label: "Delete", action: "delete", icon: "Trash2" },
] as const;

const iconMap = { Pencil, Settings, Type, Copy, UserCheck, ExternalLink, Link2, Archive, Trash2 } as const;

interface ContextMenuProps {
  siteStatus?: string;
  /** Names the trigger for assistive tech: "More options for <site>". */
  siteName?: string;
  onAction: (action: string) => void;
}

export function ContextMenu({ siteStatus, siteName, onAction }: ContextMenuProps) {
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
      {/* An icon-only trigger with no text: axe reported "Element does not
          have inner text that is visible to screen readers" for every row on
          the Sites page. */}
      <button
        type="button"
        aria-label={siteName ? `More options for ${siteName}` : "More options"}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(!open); }}
        className="rounded-lg p-1.5 transition-colors hover:bg-[var(--color-bg-subtle)]"
      >
        <MoreHorizontal className="h-4 w-4" style={{ color: "var(--color-text-secondary)" }} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-lg border bg-white py-1 shadow-lg" style={{ borderColor: "var(--color-border-default)" }}>
          {CONTEXT_MENU_ITEMS.map((item) => {
            const Icon = iconMap[item.icon as keyof typeof iconMap];
            const isDestructive = item.action === "archive" || item.action === "delete";
            const showDivider = item.action === "copyUrl";
            const isDisabled = item.action === "viewPublished" && siteStatus !== "PUBLISHED";
            return (
              <div key={item.action}>
                {showDivider && <div className="my-1 h-px" style={{ backgroundColor: "var(--color-border-default)" }} />}
                <div className="relative group">
                  <button
                    disabled={isDisabled}
                    onClick={() => { onAction(item.action); setOpen(false); }}
                    className="flex w-full items-center gap-2.5 px-3 py-1.5 text-body transition-colors hover:bg-[var(--color-bg-subtle)] disabled:cursor-not-allowed disabled:opacity-40"
                    style={{ color: isDestructive ? "var(--color-primary)" : "var(--color-text-primary)" }}
                  >
                    <Icon className="h-4 w-4" style={{ color: isDestructive ? "var(--color-primary)" : "var(--color-text-secondary)" }} />{item.label}
                  </button>
                  {isDisabled && (
                    <div className="pointer-events-none absolute bottom-full left-1/2 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md px-2 py-1 text-body-sm text-white group-hover:block" style={{ backgroundColor: "var(--color-text-primary)" }}>
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
