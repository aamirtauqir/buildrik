import { Lock } from "lucide-react";
import { ActionButton, type StateAction } from "./state-action";

/**
 * Permission-denied state — a boundary, not a dead end (DESIGN.md). Names the role
 * limit and points to "ask an admin" / a way back, never an unexplained blank.
 */
export function DeniedState({
  title = "You don't have access to this",
  description = "Your role can't open this. Ask a workspace admin, or go back.",
  action,
  secondary,
}: {
  title?: string;
  description?: string;
  action?: StateAction;
  secondary?: StateAction;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-8 py-14 text-center">
      <Lock className="mb-3 h-8 w-8 text-[var(--color-text-muted)]" aria-hidden />
      <h3 className="text-body font-semibold text-[var(--color-text-primary)]">{title}</h3>
      <p className="mt-1.5 max-w-sm text-body-sm leading-relaxed text-[var(--color-text-secondary)]">
        {description}
      </p>
      {(action || secondary) && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
          {action && <ActionButton action={action} primary />}
          {secondary && <ActionButton action={secondary} />}
        </div>
      )}
    </div>
  );
}
