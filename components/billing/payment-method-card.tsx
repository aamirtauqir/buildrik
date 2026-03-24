"use client";

export interface PaymentMethod {
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
}

interface PaymentMethodCardProps {
  paymentMethod: PaymentMethod;
  onUpdate?: () => void;
}

function CardBrandIcon({ brand }: { brand: string }) {
  const normalized = brand.toLowerCase();
  if (normalized === "visa") {
    return (
      <div
        className="flex h-8 w-12 items-center justify-center rounded border text-xs font-black tracking-tight"
        style={{ backgroundColor: "#1A1F71", color: "#FFFFFF", borderColor: "#1A1F71" }}
      >
        VISA
      </div>
    );
  }
  if (normalized === "mastercard") {
    return (
      <div className="flex h-8 w-12 items-center justify-center rounded border" style={{ borderColor: "#E8E8E8" }}>
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
      style={{ borderColor: "#E8E8E8", color: "#7A7A7A" }}
    >
      {brand.slice(0, 4)}
    </div>
  );
}

export function PaymentMethodCard({ paymentMethod, onUpdate }: PaymentMethodCardProps) {
  const expMonth = String(paymentMethod.expMonth).padStart(2, "0");
  const expYear = String(paymentMethod.expYear).slice(-2);

  return (
    <div className="flex items-center justify-between rounded-xl border border-[#E8E8E8] bg-white px-5 py-4">
      <div className="flex items-center gap-4">
        <CardBrandIcon brand={paymentMethod.brand} />
        <div>
          <div className="text-sm font-medium" style={{ color: "#0D0D0D" }}>
            •••• •••• •••• {paymentMethod.last4}
          </div>
          <div className="text-xs" style={{ color: "#7A7A7A" }}>
            Expires {expMonth}/{expYear}
          </div>
        </div>
      </div>
      {onUpdate && (
        <button
          onClick={onUpdate}
          className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-[#FAFAFA]"
          style={{ borderColor: "#E8E8E8", color: "#0D0D0D" }}
        >
          Update
        </button>
      )}
    </div>
  );
}
