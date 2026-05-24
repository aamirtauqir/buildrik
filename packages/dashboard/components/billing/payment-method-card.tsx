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

interface PaymentMethodCardProps {
  paymentMethod: PaymentMethod;
}

export function PaymentMethodCard({ paymentMethod }: PaymentMethodCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const expMonth = String(paymentMethod.expMonth).padStart(2, "0");
  const expYear = String(paymentMethod.expYear).slice(-2);

  return (
    <div className="rounded-xl border border-[#E8E8E8] bg-white px-5 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <CardBrandIcon brand={paymentMethod.brand} />
          <div>
            <div className="text-sm font-medium" style={{ color: "#0D0D0D" }}>
              &bull;&bull;&bull;&bull; &bull;&bull;&bull;&bull; &bull;&bull;&bull;&bull; {paymentMethod.last4}
            </div>
            <div className="text-xs" style={{ color: "#7A7A7A" }}>
              Expires {expMonth}/{expYear}
            </div>
          </div>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-[#FAFAFA]"
            style={{ borderColor: "#E8E8E8", color: "#0D0D0D" }}
          >
            Update Payment Method
          </button>
        )}
      </div>

      {isEditing && (
        <div className="mt-4 border-t border-[#E8E8E8] pt-4">
          <label className="block text-sm font-medium" style={{ color: "#0D0D0D" }}>
            New card details
          </label>
          <div
            className="mt-2 flex items-center rounded-lg border px-4 py-3"
            style={{ borderColor: "#E8E8E8", backgroundColor: "#FAFAFA" }}
          >
            <input
              type="text"
              placeholder="4242 4242 4242 4242"
              className="w-full bg-transparent text-sm outline-none placeholder:text-[#B0B0B0]"
              disabled
              style={{ color: "#0D0D0D" }}
            />
            <div className="ml-3 flex gap-2">
              <input
                type="text"
                placeholder="MM/YY"
                className="w-16 bg-transparent text-center text-sm outline-none placeholder:text-[#B0B0B0]"
                disabled
                style={{ color: "#0D0D0D" }}
              />
              <input
                type="text"
                placeholder="CVC"
                className="w-12 bg-transparent text-center text-sm outline-none placeholder:text-[#B0B0B0]"
                disabled
                style={{ color: "#0D0D0D" }}
              />
            </div>
          </div>
          <p className="mt-1.5 text-xs" style={{ color: "#B0B0B0" }}>
            Stripe Elements will replace this placeholder
          </p>
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => setIsEditing(false)}
              className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-[#FAFAFA]"
              style={{ borderColor: "#E8E8E8", color: "#0D0D0D" }}
            >
              Cancel
            </button>
            <button
              disabled
              className="rounded-lg px-4 py-2 text-sm font-semibold text-white opacity-50"
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
