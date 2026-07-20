/**
 * What the invoice table does with the statuses Stripe actually sends.
 *
 * The status column used to index a lookup map and read `.tone` off the result.
 * The map held PAID / FAILED / PENDING / REFUNDED; Stripe sends
 * draft / open / paid / uncollectible / void, which the webhook uppercases
 * straight into the column. Only PAID overlapped, so every other real invoice
 * returned `undefined` from the map and threw on `.tone`, taking the whole
 * billing page down with it.
 *
 * The worst case is not hypothetical. `invoice.payment_failed` is one of the five
 * events this app subscribes to, and a failed payment leaves the invoice `open` —
 * so the customer whose card just failed was the one who could not load the page
 * they needed in order to fix it.
 *
 * These render the real component with real Stripe vocabulary.
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { InvoiceTable } from "../invoice-table";

function invoice(status: string, id = "in_1") {
  return {
    id,
    amount: 7900,
    currency: "usd",
    // Cast: the point of the test is what happens when the column holds a value
    // the component's own type says is impossible. The DB column is a bare
    // String, so this is exactly what production passes in.
    status: status as never,
    pdfUrl: null,
    periodStart: new Date("2026-06-01"),
    periodEnd: new Date("2026-07-01"),
    paidAt: null,
    createdAt: new Date("2026-07-01"),
  };
}

/** Uppercased by `stripe-webhook.service.ts` before it reaches the column. */
const STRIPE_STATUSES = ["DRAFT", "OPEN", "PAID", "UNCOLLECTIBLE", "VOID"];

describe("InvoiceTable status column", () => {
  it("renders every status Stripe can send without throwing", () => {
    for (const status of STRIPE_STATUSES) {
      expect(() => render(<InvoiceTable invoices={[invoice(status)]} />), `status ${status}`).not.toThrow();
    }
  });

  /**
   * The regression, stated as the user outcome rather than the mechanism: an
   * unpaid invoice has to be visible, because that is the row the customer came
   * to act on.
   */
  it("shows an unpaid invoice as unpaid", () => {
    render(<InvoiceTable invoices={[invoice("OPEN")]} />);
    expect(screen.getByText("Unpaid")).toBeInTheDocument();
  });

  it("shows a paid invoice as paid", () => {
    render(<InvoiceTable invoices={[invoice("PAID")]} />);
    expect(screen.getByText("Paid")).toBeInTheDocument();
  });

  /**
   * Stripe can add statuses, and the column is a plain String that older rows may
   * already hold junk in. Whatever arrives, the row renders — a billing page that
   * crashes is worse than one showing an unfamiliar label.
   */
  it("degrades to a readable label for a status it has never seen", () => {
    expect(() => render(<InvoiceTable invoices={[invoice("SOME_FUTURE_STATUS")]} />)).not.toThrow();
    expect(screen.getByText("Some future status")).toBeInTheDocument();
  });

  it("still renders the rest of the row for an unknown status", () => {
    render(<InvoiceTable invoices={[invoice("VOID")]} />);
    expect(screen.getByText("$79.00")).toBeInTheDocument();
  });
});
