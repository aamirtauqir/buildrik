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
  PAID: { bg: "#F0FDF4", color: "#22C55E", label: "Paid" },
  FAILED: { bg: "#FEF2F2", color: "var(--color-primary)", label: "Failed" },
  PENDING: { bg: "#FFFBEB", color: "#F59E0B", label: "Pending" },
  REFUNDED: { bg: "#F3F4F6", color: "#7A7A7A", label: "Refunded" },
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
      <div className="rounded-xl border border-[#E8E8E8] bg-white px-6 py-12 text-center text-sm" style={{ color: "#7A7A7A" }}>
        No invoices yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[#E8E8E8] bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#E8E8E8]" style={{ backgroundColor: "#FAFAFA" }}>
            {["Date", "Amount", "Status", "Period", ""].map((col) => (
              <th
                key={col}
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                style={{ color: "#7A7A7A" }}
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
              <tr key={invoice.id} className="border-b border-[#E8E8E8] last:border-0 hover:bg-[#FAFAFA]">
                <td className="px-4 py-3" style={{ color: "#0D0D0D" }}>
                  {formatDate(invoice.createdAt)}
                </td>
                <td className="px-4 py-3 font-medium" style={{ color: "#0D0D0D" }}>
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
                <td className="px-4 py-3 text-xs" style={{ color: "#7A7A7A" }}>
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
                    <span className="text-xs" style={{ color: "#B0B0B0" }}>—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between border-t border-[#E8E8E8] px-4 py-3">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-[#FAFAFA] disabled:opacity-40"
            style={{ borderColor: "#E8E8E8", color: "#0D0D0D" }}
          >
            Previous
          </button>
          <span className="text-xs" style={{ color: "#7A7A7A" }}>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-[#FAFAFA] disabled:opacity-40"
            style={{ borderColor: "#E8E8E8", color: "#0D0D0D" }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
