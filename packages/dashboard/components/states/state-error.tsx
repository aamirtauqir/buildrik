"use client";

import { AlertTriangle } from "lucide-react";
import { ActionButton } from "./state-action";

/**
 * Error state — name the cause + give a way out (DESIGN.md). Never a white screen.
 */
export function ErrorState({
  title = "Something went wrong",
  description = "Your data is safe. Try again in a moment.",
  onRetry,
  retryLabel = "Try again",
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-8 py-14 text-center"
    >
      <AlertTriangle className="mb-3 h-8 w-8 text-[var(--color-error)]" aria-hidden />
      <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{title}</h3>
      <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-[var(--color-text-secondary)]">
        {description}
      </p>
      {onRetry && (
        <div className="mt-5">
          <ActionButton action={{ label: retryLabel, onClick: onRetry }} primary />
        </div>
      )}
    </div>
  );
}
