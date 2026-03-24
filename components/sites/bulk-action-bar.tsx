"use client";
import { Send, EyeOff, Archive, FolderInput, Trash2, Download, X } from "lucide-react";

export const BULK_ACTIONS = [
  { label: "Publish All", action: "publish", icon: "Send" },
  { label: "Unpublish All", action: "unpublish", icon: "EyeOff" },
  { label: "Archive All", action: "archive", icon: "Archive" },
  { label: "Move to Folder", action: "move", icon: "FolderInput" },
  { label: "Delete All", action: "delete", icon: "Trash2" },
  { label: "Export All", action: "export", icon: "Download" },
] as const;

const iconMap = { Send, EyeOff, Archive, FolderInput, Trash2, Download } as const;

interface BulkActionBarProps {
  selectedCount: number;
  onAction: (action: string) => void;
  onClear: () => void;
}

export function BulkActionBar({ selectedCount, onAction, onClear }: BulkActionBarProps) {
  if (selectedCount === 0) return null;
  return (
    <div className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-xl border bg-white px-4 py-2.5 shadow-xl" style={{ borderColor: "#E8E8E8" }}>
      <span className="text-sm font-medium" style={{ color: "#0D0D0D" }}>{selectedCount} selected</span>
      <div className="mx-2 h-5 w-px" style={{ backgroundColor: "#E8E8E8" }} />
      {BULK_ACTIONS.map((item) => {
        const Icon = iconMap[item.icon as keyof typeof iconMap];
        const isDestructive = item.action === "delete";
        return (
          <button key={item.action} onClick={() => onAction(item.action)} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors hover:bg-[#F4F4F4]" style={{ color: isDestructive ? "#E42313" : "#7A7A7A" }}>
            <Icon className="h-3.5 w-3.5" />{item.label}
          </button>
        );
      })}
      <button onClick={onClear} className="ml-1 rounded p-1 hover:bg-[#F4F4F4]"><X className="h-4 w-4" style={{ color: "#7A7A7A" }} /></button>
    </div>
  );
}
