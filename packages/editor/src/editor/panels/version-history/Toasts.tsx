/**
 * Toasts — D3 Stage 4 extraction (audit-remediation 2026-05-08).
 *
 * Toast type + ToastStack rendering + useToasts hook lifted out of
 * VersionHistoryPanel. The orchestrator's `pushToast` helper now lives
 * inside the hook, returning a stable callback the orchestrator wires
 * into save/restore/delete success+failure paths.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";

const TOAST_DURATION_MS = 3000;

export type Toast = {
  id: string;
  message: string;
  kind: "success" | "error";
};

const TOAST_STACK_STYLE: React.CSSProperties = {
  position: "fixed",
  bottom: 16,
  right: 16,
  zIndex: 150,
  display: "flex",
  flexDirection: "column-reverse",
  gap: 8,
  pointerEvents: "none",
};

const TOAST_BASE_STYLE: React.CSSProperties = {
  minWidth: 200,
  maxWidth: 320,
  padding: 12,
  borderRadius: 8,
  fontSize: 12,
  lineHeight: 1.4,
  color: "var(--bk-ink)",
  background: "var(--bk-bg-subtle, #1a1a24)",
  border: "1px solid var(--bk-border)",
  boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
  pointerEvents: "auto",
  animation: "bd-history-fade-in 150ms ease-out",
};

const TOAST_ERROR_STYLE: React.CSSProperties = {
  ...TOAST_BASE_STYLE,
  color: "#fca5a5",
  borderColor: "rgba(239,68,68,0.4)",
  background: "rgba(31, 18, 20, 0.96)",
};

export function ToastStack({ toasts }: { toasts: Toast[] }) {
  if (toasts.length === 0) return null;
  return (
    <div style={TOAST_STACK_STYLE}>
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          aria-live={t.kind === "error" ? "assertive" : "polite"}
          style={t.kind === "error" ? TOAST_ERROR_STYLE : TOAST_BASE_STYLE}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}

export interface UseToastsResult {
  toasts: Toast[];
  pushToast: (message: string, kind?: "success" | "error") => void;
}

export function useToasts(): UseToastsResult {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const pushToast = React.useCallback(
    (message: string, kind: "success" | "error" = "success") => {
      const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setToasts((t) => [...t, { id, message, kind }]);
      setTimeout(() => {
        setToasts((t) => t.filter((x) => x.id !== id));
      }, TOAST_DURATION_MS);
    },
    [],
  );

  return { toasts, pushToast };
}
