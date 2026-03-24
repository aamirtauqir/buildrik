"use client";
import { FolderPlus } from "lucide-react";
import { cn } from "@/lib/utils";

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

export function FolderTabs({ tabs, activeId, onSelect, onCreateFolder, archivedCount, showArchived, onToggleArchived }: FolderTabsProps) {
  return (
    <div className="flex items-center gap-1 border-b" style={{ borderColor: "#E8E8E8" }}>
      {tabs.map((tab) => (
        <button key={tab.id ?? "all"} onClick={() => onSelect(tab.id)} className={cn("px-4 py-2.5 text-sm font-medium transition-colors", activeId === tab.id ? "border-b-2 border-[#E42313] text-[#E42313]" : "text-[#7A7A7A] hover:text-[#0D0D0D]")}>
          {tab.name} ({tab.count})
        </button>
      ))}
      <button onClick={onToggleArchived} className={cn("px-4 py-2.5 text-sm font-medium transition-colors", showArchived ? "border-b-2 border-[#E42313] text-[#E42313]" : "text-[#7A7A7A] hover:text-[#0D0D0D]")}>
        Archived ({archivedCount})
      </button>
      <button onClick={onCreateFolder} className="ml-auto rounded-lg p-2 transition-colors hover:bg-[#F4F4F4]" aria-label="Create folder">
        <FolderPlus className="h-4 w-4" style={{ color: "#7A7A7A" }} />
      </button>
    </div>
  );
}
