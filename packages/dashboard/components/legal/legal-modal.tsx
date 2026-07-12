"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface LegalModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

/** Lightweight dialog for showing legal copy (Terms / Privacy) without leaving
 *  the auth flow. Closes on Escape, backdrop click, or the X. */
export function LegalModal({ open, onClose, children }: LegalModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl bg-white p-8 shadow-xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-700"
        >
          <X className="h-5 w-5" />
        </button>
        {children}
      </div>
    </div>
  );
}
