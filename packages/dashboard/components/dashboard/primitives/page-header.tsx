import type { ReactNode } from "react";

/** Standard page chrome: title + optional description + right-aligned actions.
 *  Replaces the per-screen hand-rolled <header> blocks. */
export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        {/* The token, not a hardcode — this read text-[24px] while eight other
            screens used `text-page-title`, so the ramp could move without it. */}
        <h1 className="text-page-title tracking-[-0.01em]" style={{ color: "var(--color-text-primary)" }}>{title}</h1>
        {description && (
          <p className="mt-0.5 text-[13px]" style={{ color: "var(--color-text-secondary)" }}>{description}</p>
        )}
      </div>
      {/* max-w-full lets a crowded action row wrap on narrow screens; shrink-0
          alone would hold it at max-content and push the page sideways. */}
      {actions && <div className="flex max-w-full shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
