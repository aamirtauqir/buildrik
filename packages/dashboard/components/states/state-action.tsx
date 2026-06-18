"use client";

import Link from "next/link";

export type StateAction = {
  label: string;
  href?: string;
  onClick?: () => void;
};

/**
 * One action button shared by Empty/Error/Denied states. Primary = the dashboard
 * red accent (one per state, per DESIGN.md). Renders a Link (href) or a button (onClick).
 */
export function ActionButton({
  action,
  primary = false,
}: {
  action: StateAction;
  primary?: boolean;
}) {
  const cls = primary
    ? "inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-hover)]"
    : "inline-flex items-center gap-2 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-4 py-2 text-sm font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-bg-subtle)]";

  if (action.href) {
    return (
      <Link href={action.href} className={cls}>
        {action.label}
      </Link>
    );
  }
  return (
    <button type="button" onClick={action.onClick} className={cls}>
      {action.label}
    </button>
  );
}
