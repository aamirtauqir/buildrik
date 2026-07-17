"use client";

import { DataTable, Pill, MetricValue, type Column, type PillTone } from "@/components/dashboard/primitives";

type InvoiceStatus = "PAID" | "FAILED" | "PENDING" | "REFUNDED";

export interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
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

const STATUS: Record<InvoiceStatus, { tone: PillTone; label: string }> = {
  PAID: { tone: "success", label: "Paid" },
  FAILED: { tone: "error", label: "Failed" },
  PENDING: { tone: "warning", label: "Pending" },
  REFUNDED: { tone: "neutral", label: "Refunded" },
};

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount / 100);
}

const COLUMNS: Column<Invoice>[] = [
  { key: "date", header: "Date", render: (inv) => <MetricValue>{formatDate(inv.createdAt)}</MetricValue> },
  { key: "amount", header: "Amount", className: "font-medium", render: (inv) => <MetricValue>{formatAmount(inv.amount, inv.currency)}</MetricValue> },
  { key: "status", header: "Status", render: (inv) => <Pill tone={STATUS[inv.status].tone}>{STATUS[inv.status].label}</Pill> },
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
            className="rounded-xl border px-6 py-12 text-center text-body"
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
