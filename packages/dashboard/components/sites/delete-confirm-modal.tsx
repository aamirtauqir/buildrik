"use client";
import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";

interface DeleteConfirmModalProps {
  open: boolean;
  /** The exact string the user must type to arm the delete. */
  siteName: string;
  /** Defaults to the single-site heading; bulk deletes pass their own. */
  title?: string;
  onClose: () => void;
  onConfirm: (name: string) => void;
}

export function DeleteConfirmModal({ open, siteName, title = "Delete Site", onClose, onConfirm }: DeleteConfirmModalProps) {
  const [input, setInput] = useState("");
  if (!open) return null;
  const matches = input === siteName;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "#0000004D" }} onClick={onClose}>
      <div className="w-[420px] rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold" style={{ color: "var(--color-primary)" }}>{title}</h2>
          <button onClick={onClose}><X className="h-5 w-5" style={{ color: "var(--color-text-secondary)" }} /></button>
        </div>
        <div className="mt-4 flex items-start gap-3 rounded-lg p-3" style={{ backgroundColor: "#FEF2F2" }}>
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" style={{ color: "var(--color-primary)" }} />
          <p className="text-sm" style={{ color: "#991B1B" }}>This action cannot be undone. Type <strong>{siteName}</strong> to confirm.</p>
        </div>
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder={`Type "${siteName}" to confirm`} className="mt-4 w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: matches ? "var(--color-success)" : "var(--color-border-default)" }} autoFocus />
        <div className="mt-4 flex gap-2 justify-end">
          <button onClick={onClose} className="rounded-lg border px-4 py-2 text-sm" style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-secondary)" }}>Cancel</button>
          <button onClick={() => matches && onConfirm(input)} disabled={!matches} className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50" style={{ backgroundColor: "#7F1D1D" }}>{title}</button>
        </div>
      </div>
    </div>
  );
}
