"use client";

import { Users, Crown, ShieldCheck, Pencil, Eye } from "lucide-react";

const ROLE_CARDS = [
  {
    role: "Owner",
    description: "Full control of workspace, billing, and settings",
    bg: "#FEF2F2",
    color: "var(--color-primary)",
    Icon: Crown,
  },
  {
    role: "Admin",
    description: "Manage team members, sites, and settings. No billing access.",
    bg: "#EFF6FF",
    color: "#3B82F6",
    Icon: ShieldCheck,
  },
  {
    role: "Editor",
    description: "Create and edit sites. Cannot publish or manage team.",
    bg: "#F0FDF4",
    color: "#22C55E",
    Icon: Pencil,
  },
  {
    role: "Viewer",
    description: "View published sites only. Read-only access.",
    bg: "#F3F4F6",
    color: "#7A7A7A",
    Icon: Eye,
  },
];

interface TeamEmptyStateProps {
  onInvite: () => void;
}

export function TeamEmptyState({ onInvite }: TeamEmptyStateProps) {
  return (
    <div className="flex flex-col items-center px-6 py-16">
      <div
        className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{ backgroundColor: "#FEF2F2" }}
      >
        <Users className="h-8 w-8" style={{ color: "var(--color-primary)" }} />
      </div>

      <h2 className="text-xl font-semibold" style={{ color: "#0D0D0D" }}>
        No team members yet
      </h2>
      <p className="mt-2 max-w-sm text-center text-sm" style={{ color: "#7A7A7A" }}>
        Invite your colleagues to collaborate. Choose the right role for each person based on what they need to do.
      </p>

      <button
        onClick={onInvite}
        className="mt-6 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:opacity-90"
        style={{ backgroundColor: "var(--color-primary)" }}
      >
        Invite Team Members
      </button>

      <div className="mt-10 grid w-full max-w-2xl gap-3 grid-cols-2 sm:grid-cols-4">
        {ROLE_CARDS.map((card) => (
          <div
            key={card.role}
            className="rounded-xl border border-[#E8E8E8] p-4"
          >
            <div
              className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ backgroundColor: card.bg }}
            >
              <card.Icon className="h-4 w-4" style={{ color: card.color }} />
            </div>
            <p className="text-sm font-bold" style={{ color: "#0D0D0D" }}>
              {card.role}
            </p>
            <p className="mt-1 text-xs" style={{ color: "#7A7A7A" }}>
              {card.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
