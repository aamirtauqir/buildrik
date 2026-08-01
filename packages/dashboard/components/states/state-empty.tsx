import { ActionButton, type StateAction } from "./state-action";

/**
 * Generic empty state — typographic, one primary action, no illustrations
 * (DESIGN.md §Content Rules). The E6 per-surface "do the first thing" primitive.
 * Distinct from the home's variant-locked EmptyState.
 */
export function StateEmpty({
  icon,
  title,
  description,
  action,
  secondary,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: StateAction;
  secondary?: StateAction;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] px-8 py-14 text-center">
      {icon && (
        <div className="mb-3 text-[var(--color-text-muted)]" aria-hidden>
          {icon}
        </div>
      )}
      <h3 className="text-body font-semibold text-[var(--color-text-primary)]">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-body-sm leading-relaxed text-[var(--color-text-secondary)]">
          {description}
        </p>
      )}
      {(action || secondary) && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
          {action && <ActionButton action={action} primary />}
          {secondary && <ActionButton action={secondary} />}
        </div>
      )}
    </div>
  );
}
