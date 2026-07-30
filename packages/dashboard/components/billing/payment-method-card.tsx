"use client";

import { trpc } from "@lib/trpc/client";
import { useToast } from "@/components/dashboard/toast-provider";

export interface PaymentMethod {
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
}

function CardBrandIcon({ brand }: { brand: string }) {
  const normalized = brand.toLowerCase();
  if (normalized === "visa") {
    return (
      <div
        className="flex h-8 w-12 items-center justify-center rounded border text-body-sm font-black tracking-tight"
        style={{ backgroundColor: "#1A1F71", color: "#FFFFFF", borderColor: "#1A1F71" }}
      >
        VISA
      </div>
    );
  }
  if (normalized === "mastercard") {
    return (
      <div className="flex h-8 w-12 items-center justify-center rounded border" style={{ borderColor: "var(--color-border-default)" }}>
        <span className="inline-flex">
          <span className="h-5 w-5 rounded-full opacity-90" style={{ backgroundColor: "#EB001B" }} />
          <span className="-ml-2.5 h-5 w-5 rounded-full opacity-80" style={{ backgroundColor: "#F79E1B" }} />
        </span>
      </div>
    );
  }
  return (
    <div
      className="flex h-8 w-12 items-center justify-center rounded border text-[10px] font-semibold uppercase"
      style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-secondary)" }}
    >
      {brand.slice(0, 4)}
    </div>
  );
}

interface PaymentMethodCardProps {
  paymentMethod: PaymentMethod;
}

export function PaymentMethodCard({ paymentMethod }: PaymentMethodCardProps) {
  const { addToast } = useToast();
  const expMonth = String(paymentMethod.expMonth).padStart(2, "0");
  const expYear = String(paymentMethod.expYear).slice(-2);

  const portalMutation = trpc.billing.createPortalSession.useMutation({
    onSuccess: (data) => window.location.assign(data.url),
    onError: (err) => addToast("error", "Couldn't open billing portal", err.message),
  });

  return (
    <div className="rounded-lg border border-[var(--color-border-default)] bg-white px-5 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <CardBrandIcon brand={paymentMethod.brand} />
          <div>
            <div className="text-body font-medium" style={{ color: "var(--color-text-primary)" }}>
              &bull;&bull;&bull;&bull; &bull;&bull;&bull;&bull; &bull;&bull;&bull;&bull; {paymentMethod.last4}
            </div>
            <div className="text-body-sm" style={{ color: "var(--color-text-secondary)" }}>
              Expires {expMonth}/{expYear}
            </div>
          </div>
        </div>
        {/* Stripe hosts the Portal — a raw card form in our DOM is exactly
            what Checkout + Portal exists to avoid (no PAN ever touches us). */}
        <button
          onClick={() => portalMutation.mutate()}
          disabled={portalMutation.isPending}
          className="rounded-lg border px-4 py-2 text-body font-medium transition-colors hover:bg-[var(--color-bg-page)] disabled:opacity-50"
          style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-primary)" }}
        >
          {portalMutation.isPending ? "Opening…" : "Manage payment method"}
        </button>
      </div>
    </div>
  );
}
