"use client";
import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button, Modal } from "@/components/dashboard/primitives";

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
  const matches = input === siteName;
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      width={420}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="danger" onClick={() => matches && onConfirm(input)} disabled={!matches}>{title}</Button>
        </>
      }
    >
      <div className="flex items-start gap-3 rounded-lg p-3" style={{ backgroundColor: "#FEF2F2" }}>
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" style={{ color: "var(--color-primary)" }} />
        <p className="text-sm" style={{ color: "#991B1B" }}>This action cannot be undone. Type <strong>{siteName}</strong> to confirm.</p>
      </div>
      <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder={`Type "${siteName}" to confirm`} className="mt-4 w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: matches ? "var(--color-success)" : "var(--color-border-default)" }} autoFocus />
    </Modal>
  );
}
