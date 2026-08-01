/**
 * Loading skeleton — the shape of the content, not a spinner (DESIGN.md).
 * `animate-pulse` is disabled under prefers-reduced-motion by globals.css.
 */
function Bar({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-[var(--color-bg-subtle)] ${className}`}
    />
  );
}

export function LoadingSkeleton({
  rows = 3,
  variant = "list",
}: {
  rows?: number;
  variant?: "list" | "card" | "table";
}) {
  if (variant === "card") {
    return (
      <div
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        role="status"
        aria-label="Loading"
      >
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-[var(--color-border-default)] p-4"
          >
            <Bar className="mb-3 h-24 w-full" />
            <Bar className="mb-2 h-4 w-2/3" />
            <Bar className="h-3 w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "table") {
    return (
      <div
        className="overflow-hidden rounded-lg border border-[var(--color-border-default)]"
        role="status"
        aria-label="Loading"
      >
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-[var(--color-border-default)] px-4 py-3 last:border-b-0"
          >
            <Bar className="h-4 w-1/3" />
            <Bar className="h-4 w-1/4" />
            <Bar className="ml-auto h-4 w-16" />
          </div>
        ))}
      </div>
    );
  }

  // list (default) — stacked rows
  return (
    <div className="space-y-3" role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-[var(--color-border-default)] px-4 py-3"
        >
          <Bar className="mb-2 h-4 w-1/2" />
          <Bar className="h-3 w-1/4" />
        </div>
      ))}
    </div>
  );
}
