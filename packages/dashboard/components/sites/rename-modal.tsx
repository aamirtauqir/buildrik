"use client";
import { useState } from "react";
import { X } from "lucide-react";

interface RenameModalProps {
  open: boolean;
  currentName: string;
  /** Defaults to the site heading; folder renames pass their own. */
  title?: string;
  onClose: () => void;
  onSubmit: (name: string) => void;
}

export function RenameModal({ open, currentName, title = "Rename Site", onClose, onSubmit }: RenameModalProps) {
  const [name, setName] = useState(currentName);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "#0000004D" }} onClick={onClose}>
      <div className="w-[400px] rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>{title}</h2>
          <button onClick={onClose}><X className="h-5 w-5" style={{ color: "var(--color-text-secondary)" }} /></button>
        </div>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="mt-4 w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--color-border-default)" }} autoFocus />
        <div className="mt-4 flex gap-2 justify-end">
          <button onClick={onClose} className="rounded-lg border px-4 py-2 text-sm" style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-secondary)" }}>Cancel</button>
          <button onClick={() => onSubmit(name)} className="rounded-lg px-4 py-2 text-sm font-medium text-white" style={{ backgroundColor: "var(--color-primary)" }}>Save</button>
        </div>
      </div>
    </div>
  );
}
