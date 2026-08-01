"use client";

import { DataTable, Pill, MetricValue, type Column, type PillTone } from "@/components/dashboard/primitives";

export interface Invoice {
  id: string;
  amount: number;
  currency: string;
  /** Whatever the column holds. See STATUS below for why this is not a union. */
  status: string;
  pdfUrl: string | null;
  periodStart: Date;
  periodEnd: Date;
  paidAt: Date | null;
  createdAt: Date;
}

interface InvoiceTableProps {
  invoices: Invoice[];
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

/**
 * Keyed on the statuses Stripe actually sends (see `InvoiceStatus` in
 * lib/constants/enums.ts), with labels written for the person paying rather than
 * Stripe's internal wording — "Unpaid" says what an `open` invoice means to them.
 *
 * Deliberately a partial map read through `statusPill`, not a total Record: the
 * column is a plain String, Stripe can add statuses, and existing rows may hold
 * values from before this list was corrected. A billing page showing an
 * unfamiliar label beats one that will not load.
 */
const STATUS: Record<string, { tone: PillTone; label: string }> = {
  DRAFT: { tone: "neutral", label: "Draft" },
  OPEN: { tone: "warning", label: "Unpaid" },
  PAID: { tone: "success", label: "Paid" },
  UNCOLLECTIBLE: { tone: "error", label: "Uncollectible" },
  VOID: { tone: "neutral", label: "Void" },
};

/** UNKNOWN_STATUS → "Unknown status", so an unmapped value still reads as words. */
function humanise(status: string): string {
  const words = status.replace(/_/g, " ").toLowerCase().trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function statusPill(status: string): { tone: PillTone; label: string } {
  return STATUS[status] ?? { tone: "neutral", label: humanise(status) };
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount / 100);
}

const COLUMNS: Column<Invoice>[] = [
  { key: "date", header: "Date", render: (inv) => <MetricValue>{formatDate(inv.createdAt)}</MetricValue> },
  { key: "amount", header: "Amount", className: "font-medium", render: (inv) => <MetricValue>{formatAmount(inv.amount, inv.currency)}</MetricValue> },
  {
    key: "status",
    header: "Status",
    render: (inv) => {
      const { tone, label } = statusPill(inv.status);
      return <Pill tone={tone}>{label}</Pill>;
    },
  },
  {
    key: "download",
    header: "Invoice",
    align: "right",
    render: (inv) =>
      inv.pdfUrl ? (
        <a
          href={inv.pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-body-sm font-medium underline-offset-2 hover:underline"
          style={{ color: "var(--color-primary)" }}
        >
          PDF
        </a>
      ) : (
        <span className="text-body-sm" style={{ color: "var(--color-text-muted)" }}>—</span>
      ),
  },
];

export function InvoiceTable({ invoices, page = 1, totalPages = 1, onPageChange }: InvoiceTableProps) {
  return (
    <div className="space-y-3">
      <DataTable
        columns={COLUMNS}
        rows={invoices}
        keyOf={(inv) => inv.id}
        empty={
          <div
            className="rounded-lg border px-6 py-12 text-center text-body"
            style={{ borderColor: "var(--color-border-default)", backgroundColor: "var(--color-bg-surface)", color: "var(--color-text-secondary)" }}
          >
            No invoices yet.
          </div>
        }
      />

      {totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="rounded-lg border px-3 py-1.5 text-body-sm font-medium transition-colors hover:bg-[var(--color-bg-page)] disabled:opacity-40"
            style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-primary)" }}
          >
            Previous
          </button>
          <span className="text-body-sm" style={{ color: "var(--color-text-secondary)" }}>
            Page <MetricValue>{page}</MetricValue> of <MetricValue>{totalPages}</MetricValue>
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="rounded-lg border px-3 py-1.5 text-body-sm font-medium transition-colors hover:bg-[var(--color-bg-page)] disabled:opacity-40"
            style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-primary)" }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
