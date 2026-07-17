"use client";

import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";

export const TOAST_AUTO_DISMISS_MS = 5000;
export const TOAST_MAX_VISIBLE = 4;

export const TOAST_VARIANTS = {
  success: { border: "var(--color-success)", bg: "var(--color-success-subtle)", icon: "CheckCircle", role: "status" as const },
  error: { border: "var(--color-error)", bg: "var(--color-error-subtle)", icon: "AlertCircle", role: "alert" as const },
  warning: { border: "var(--color-warning)", bg: "var(--color-warning-subtle)", icon: "AlertTriangle", role: "alert" as const },
  info: { border: "var(--color-info)", bg: "var(--color-primary-subtle)", icon: "Info", role: "status" as const },
} as const;

const iconMap = { CheckCircle, AlertCircle, AlertTriangle, Info };

export type ToastVariant = keyof typeof TOAST_VARIANTS;

export interface ToastData {
  id: string;
  variant: ToastVariant;
  title: string;
  message?: string;
  action?: { label: string; onClick: () => void };
}

export function Toast({ toast: t, onDismiss }: { toast: ToastData; onDismiss: (id: string) => void }) {
  const variant = TOAST_VARIANTS[t.variant];
  const Icon = iconMap[variant.icon as keyof typeof iconMap];
  return (
    <div role={variant.role} className="flex w-[360px] items-start gap-3 rounded-lg p-3 shadow-lg" style={{ backgroundColor: variant.bg, borderLeft: `4px solid ${variant.border}` }}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: variant.border }} />
      <div className="flex-1 min-w-0">
        <p className="text-body font-semibold" style={{ color: "var(--color-text-primary)" }}>{t.title}</p>
        {t.message && <p className="mt-0.5 text-body" style={{ color: "var(--color-text-secondary)" }}>{t.message}</p>}
        {t.action && <button onClick={t.action.onClick} className="mt-1 text-body font-medium underline" style={{ color: variant.border }}>{t.action.label}</button>}
      </div>
      <button onClick={() => onDismiss(t.id)} className="shrink-0 rounded p-0.5 transition-colors hover:bg-black/5" aria-label="Dismiss">
        <X className="h-4 w-4" style={{ color: "var(--color-text-secondary)" }} />
      </button>
    </div>
  );
}
