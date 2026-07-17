"use client";

import { useState } from "react";

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
  const [isEditing, setIsEditing] = useState(false);
  const expMonth = String(paymentMethod.expMonth).padStart(2, "0");
  const expYear = String(paymentMethod.expYear).slice(-2);

  return (
    <div className="rounded-xl border border-[var(--color-border-default)] bg-white px-5 py-4">
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
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="rounded-lg border px-4 py-2 text-body font-medium transition-colors hover:bg-[var(--color-bg-page)]"
            style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-primary)" }}
          >
            Update Payment Method
          </button>
        )}
      </div>

      {isEditing && (
        <div className="mt-4 border-t border-[var(--color-border-default)] pt-4">
          <label className="block text-body font-medium" style={{ color: "var(--color-text-primary)" }}>
            New card details
          </label>
          <div
            className="mt-2 flex items-center rounded-lg border px-4 py-3"
            style={{ borderColor: "var(--color-border-default)", backgroundColor: "var(--color-bg-page)" }}
          >
            <input
              type="text"
              placeholder="4242 4242 4242 4242"
              className="w-full bg-transparent text-body outline-none placeholder:text-[var(--color-text-muted)]"
              disabled
              style={{ color: "var(--color-text-primary)" }}
            />
            <div className="ml-3 flex gap-2">
              <input
                type="text"
                placeholder="MM/YY"
                className="w-16 bg-transparent text-center text-body outline-none placeholder:text-[var(--color-text-muted)]"
                disabled
                style={{ color: "var(--color-text-primary)" }}
              />
              <input
                type="text"
                placeholder="CVC"
                className="w-12 bg-transparent text-center text-body outline-none placeholder:text-[var(--color-text-muted)]"
                disabled
                style={{ color: "var(--color-text-primary)" }}
              />
            </div>
          </div>
          <p className="mt-1.5 text-body-sm" style={{ color: "var(--color-text-muted)" }}>
            Online card updates are coming soon. To change your payment method now,
            contact support.
          </p>
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => setIsEditing(false)}
              className="rounded-lg border px-4 py-2 text-body font-medium transition-colors hover:bg-[var(--color-bg-page)]"
              style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-primary)" }}
            >
              Cancel
            </button>
            <button
              disabled
              className="rounded-lg px-4 py-2 text-body font-semibold text-white opacity-50"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              Save Card
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
