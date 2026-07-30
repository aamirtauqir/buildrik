import type { ReactNode } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow } from "flowbite-react";
import { cn } from "@lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  align?: "left" | "right";
  render?: (row: T) => ReactNode;
  className?: string;
}

/** One bordered table shell for domains / partner / members / invoices —
 *  flowbite-react Table underneath, cell padding kept at the dashboard's
 *  compact density. Pass `empty` to render a zero-state instead of an empty
 *  table. */
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
    // overflow-x-auto (not overflow-hidden): a wide table must scroll, not clip.
    // Inherited by every DataTable consumer (domains/partner/invoices/redirects).
    <div className="overflow-x-auto rounded-lg border shadow-card" style={{ borderColor: "var(--color-border-default)", backgroundColor: "var(--color-bg-surface)" }}>
      <Table hoverable={Boolean(onRowClick)}>
        <TableHead>
          <TableRow>
            {columns.map((c) => (
              <TableHeadCell key={c.key} className={cn("px-[18px] py-2.5", c.align === "right" && "text-right")}>
                {c.header}
              </TableHeadCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, i) => (
            <TableRow
              key={keyOf(row, i)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn("border-b last:border-0", onRowClick && "cursor-pointer")}
              style={{ borderColor: "var(--color-border-default)" }}
            >
              {columns.map((c) => (
                <TableCell key={c.key} className={cn("px-[18px] py-3.5", c.align === "right" && "text-right", c.className)} style={{ color: "var(--color-text-primary)" }}>
                  {c.render ? c.render(row) : (row as Record<string, ReactNode>)[c.key]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
