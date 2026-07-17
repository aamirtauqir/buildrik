import type { ReactNode } from "react";
import { cn } from "@lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  align?: "left" | "right";
  render?: (row: T) => ReactNode;
  className?: string;
}

/** One bordered table shell (header eyebrow, row borders, cell padding) for
 *  domains / partner / members / invoices. Pass `empty` to render a zero-state
 *  instead of an empty table. */
export function DataTable<T>({
  columns,
  rows,
  keyOf,
  empty,
  onRowClick,
}: {
  columns: Column<T>[];
  rows: T[];
  keyOf: (row: T, i: number) => string;
  empty?: ReactNode;
  onRowClick?: (row: T) => void;
}) {
  if (rows.length === 0 && empty) return <>{empty}</>;
  return (
    <div className="overflow-hidden rounded-lg border shadow-card" style={{ borderColor: "var(--color-border-default)", backgroundColor: "var(--color-bg-surface)" }}>
      <table className="w-full text-body">
        <thead>
          <tr className="border-b text-left text-eyebrow uppercase tracking-wide" style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-secondary)", backgroundColor: "var(--color-bg-subtle)" }}>
            {columns.map((c) => (
              <th key={c.key} className={cn("px-[18px] py-2.5 font-semibold", c.align === "right" && "text-right")}>{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={keyOf(row, i)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn("border-b last:border-0", onRowClick && "cursor-pointer transition-colors hover:bg-[var(--color-bg-subtle)]")}
              style={{ borderColor: "var(--color-border-default)" }}
            >
              {columns.map((c) => (
                <td key={c.key} className={cn("px-[18px] py-3.5", c.align === "right" && "text-right", c.className)} style={{ color: "var(--color-text-primary)" }}>
                  {c.render ? c.render(row) : (row as Record<string, ReactNode>)[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
