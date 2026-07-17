import type { ReactNode } from "react";

/** Standard page chrome: title + optional description + right-aligned actions.
 *  Replaces the per-screen hand-rolled <header> blocks. */
export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <header className="mb-6 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-page-title font-[720] tracking-[-0.02em]" style={{ color: "var(--color-text-primary)" }}>{title}</h1>
        {description && (
          <p className="mt-0.5 text-body" style={{ color: "var(--color-text-secondary)" }}>{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}
