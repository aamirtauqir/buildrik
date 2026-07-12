"use client";

import Link from "next/link";
import { X, Check, Sparkles } from "lucide-react";

interface PaywallModalProps {
  open: boolean;
  onClose: () => void;
  /** What the user was trying to do, e.g. "Connect a custom domain". */
  feature: string;
  /** Short why-line under the title. */
  description: string;
  /** The plan that unlocks it. */
  unlockPlan?: "Pro" | "Business";
  perks?: string[];
}

const DEFAULT_PERKS = [
  "Custom domains with auto-SSL",
  "Remove the Buildrick badge",
  "More sites, storage, and AI credits",
  "Team members + integrations",
];

// 30-paywall: a contextual upgrade interrupt shown when a Free-plan action hits a
// real enforced limit. Reusable across the dashboard's gated surfaces.
export function PaywallModal({ open, onClose, feature, description, unlockPlan = "Pro", perks = DEFAULT_PERKS }: PaywallModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold" style={{ backgroundColor: "var(--color-primary-subtle)", color: "var(--color-primary)" }}>
            <Sparkles className="h-3.5 w-3.5" /> {unlockPlan} feature
          </span>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600"><X className="h-4 w-4" /></button>
        </div>

        <h2 className="mt-3 text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>{feature}</h2>
        <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>{description}</p>

        <ul className="mt-4 space-y-2">
          {perks.map((p) => (
            <li key={p} className="flex items-center gap-2 text-sm" style={{ color: "var(--color-text-primary)" }}>
              <Check className="h-4 w-4 shrink-0 text-[var(--color-success)]" /> {p}
            </li>
          ))}
        </ul>

        <div className="mt-6 flex gap-2">
          <Link
            href="/dashboard/billing"
            className="flex-1 rounded-lg px-4 py-2.5 text-center text-sm font-semibold text-white"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            Upgrade to {unlockPlan}
          </Link>
          <button
            onClick={onClose}
            className="rounded-lg border px-4 py-2.5 text-sm font-medium"
            style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-secondary)" }}
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
