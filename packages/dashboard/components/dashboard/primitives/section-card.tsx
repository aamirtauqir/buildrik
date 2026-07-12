import type { ReactNode } from "react";
import { cn } from "@lib/utils";

/** Surface card with an optional titled header bar. One radius/border/padding
 *  contract for every "boxed section" — replaces ad-hoc rounded-xl border blocks
 *  and the site-detail local Section components. Pass padding="none" for tables. */
export function SectionCard({
  title,
  description,
  actions,
  children,
  padding = "md",
  className,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  padding?: "md" | "none";
  className?: string;
}) {
  const hasHeader = Boolean(title || actions);
  return (
    <section
      className={cn("overflow-hidden rounded-xl border", className)}
      style={{ borderColor: "var(--color-border-default)", backgroundColor: "var(--color-bg-surface)" }}
    >
      {hasHeader && (
        <div className="flex items-center justify-between gap-4 border-b px-5 py-3.5" style={{ borderColor: "var(--color-border-default)" }}>
          <div className="min-w-0">
            {title && <h2 className="text-section-title" style={{ color: "var(--color-text-primary)" }}>{title}</h2>}
            {description && <p className="text-body-sm" style={{ color: "var(--color-text-secondary)" }}>{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={padding === "md" ? "p-5" : undefined}>{children}</div>
    </section>
  );
}
