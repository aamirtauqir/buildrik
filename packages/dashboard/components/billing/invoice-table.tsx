"use client";

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

const STATUS_BADGE: Record<InvoiceStatus, { bg: string; color: string; label: string }> = {
  PAID: { bg: "#F0FDF4", color: "var(--color-success)", label: "Paid" },
  FAILED: { bg: "#FEF2F2", color: "var(--color-primary)", label: "Failed" },
  PENDING: { bg: "#FFFBEB", color: "#F59E0B", label: "Pending" },
  REFUNDED: { bg: "#F3F4F6", color: "var(--color-text-secondary)", label: "Refunded" },
};

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount / 100);
}

function formatPeriod(start: Date, end: Date): string {
  return `${formatDate(start)} – ${formatDate(end)}`;
}

export function InvoiceTable({ invoices, page = 1, totalPages = 1, onPageChange }: InvoiceTableProps) {
  if (invoices.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--color-border-default)] bg-white px-6 py-12 text-center text-sm" style={{ color: "var(--color-text-secondary)" }}>
        No invoices yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--color-border-default)] bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--color-border-default)]" style={{ backgroundColor: "var(--color-bg-page)" }}>
            {["Date", "Amount", "Status", "Period", ""].map((col) => (
              <th
                key={col}
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => {
            const badge = STATUS_BADGE[invoice.status];
            return (
              <tr key={invoice.id} className="border-b border-[var(--color-border-default)] last:border-0 hover:bg-[var(--color-bg-page)]">
                <td className="px-4 py-3" style={{ color: "var(--color-text-primary)" }}>
                  {formatDate(invoice.createdAt)}
                </td>
                <td className="px-4 py-3 font-medium" style={{ color: "var(--color-text-primary)" }}>
                  {formatAmount(invoice.amount, invoice.currency)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className="rounded-full px-2.5 py-1 text-xs font-semibold"
                    style={{ backgroundColor: badge.bg, color: badge.color }}
                  >
                    {badge.label}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                  {formatPeriod(invoice.periodStart, invoice.periodEnd)}
                </td>
                <td className="px-4 py-3 text-right">
                  {invoice.pdfUrl ? (
                    <a
                      href={invoice.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium underline-offset-2 hover:underline"
                      style={{ color: "var(--color-primary)" }}
                    >
                      PDF
                    </a>
                  ) : (
                    <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between border-t border-[var(--color-border-default)] px-4 py-3">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-[var(--color-bg-page)] disabled:opacity-40"
            style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-primary)" }}
          >
            Previous
          </button>
          <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-[var(--color-bg-page)] disabled:opacity-40"
            style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-primary)" }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
