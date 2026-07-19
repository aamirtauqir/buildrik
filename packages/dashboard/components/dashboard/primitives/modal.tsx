"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

/** Centred dialog on a dark scrim, per the design's modal spec: scrim
 *  rgba(18,22,32,.45), 16px panel, a titled header row and an optional footer
 *  row, both closed by a 1px divider. Escape and a scrim click dismiss it, and
 *  focus moves into the panel so keyboard users are not stranded behind it. */
export function Modal({
  open,
  onClose,
  title,
  width = 460,
  footer,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  width?: number;
  footer?: ReactNode;
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    // Only pull focus in if the panel's own content did not already claim it —
    // dialogs that autoFocus a field must keep that field focused.
    const panel = panelRef.current;
    if (panel && !panel.contains(document.activeElement)) panel.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(18, 22, 32, 0.45)" }}
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="max-h-[90vh] w-full overflow-y-auto rounded-2xl outline-none"
        style={{ maxWidth: width, backgroundColor: "var(--color-bg-surface)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between border-b px-[22px] py-[18px]"
          style={{ borderColor: "var(--color-border-default)" }}
        >
          <h2 className="text-section-title" style={{ color: "var(--color-text-primary)" }}>{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 transition-colors hover:bg-[var(--color-bg-subtle)]"
            style={{ color: "var(--color-text-secondary)" }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-[22px] py-4">{children}</div>

        {footer && (
          <div
            className="flex items-center justify-end gap-2 border-t px-[22px] py-4"
            style={{ borderColor: "var(--color-border-default)" }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
