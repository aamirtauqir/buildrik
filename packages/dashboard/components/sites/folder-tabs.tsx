"use client";
import { FolderPlus } from "lucide-react";
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
  onCreateFolder: () => void;
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

export function FolderTabs({ tabs, activeId, onSelect, onCreateFolder, archivedCount, showArchived, onToggleArchived }: FolderTabsProps) {
  return (
    <div className="flex items-center gap-5 border-b" style={{ borderColor: "var(--color-border-default)" }}>
      {tabs.map((tab) => (
        <Tab
          key={tab.id ?? "all"}
          active={!showArchived && activeId === tab.id}
          onClick={() => onSelect(tab.id)}
          name={tab.name}
          count={tab.count}
        />
      ))}
      <Tab active={showArchived} onClick={onToggleArchived} name="Archived" count={archivedCount} />
      <button
        onClick={onCreateFolder}
        className="ml-auto rounded-md p-1.5 transition-colors hover:bg-[var(--color-bg-subtle)]"
        aria-label="Create folder"
      >
        <FolderPlus className="h-4 w-4" style={{ color: "var(--color-text-secondary)" }} />
      </button>
    </div>
  );
}
