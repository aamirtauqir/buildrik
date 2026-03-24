"use client";

import { Users } from "lucide-react";

const ROLE_CARDS = [
  {
    role: "Admin",
    description: "Can manage everything except billing",
    bg: "#EFF6FF",
    color: "#3B82F6",
  },
  {
    role: "Editor",
    description: "Can edit sites they have access to",
    bg: "#F0FDF4",
    color: "#22C55E",
  },
  {
    role: "Viewer",
    description: "Can only view published sites",
    bg: "#F3F4F6",
    color: "#7A7A7A",
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
        <Users className="h-8 w-8" style={{ color: "#E42313" }} />
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
        style={{ backgroundColor: "#E42313" }}
      >
        Invite Team Members
      </button>

      <div className="mt-10 grid w-full max-w-lg gap-3 sm:grid-cols-3">
        {ROLE_CARDS.map((card) => (
          <div
            key={card.role}
            className="rounded-xl border border-[#E8E8E8] p-4"
          >
            <span
              className="inline-block rounded-full px-2.5 py-1 text-xs font-semibold"
              style={{ backgroundColor: card.bg, color: card.color }}
            >
              {card.role}
            </span>
            <p className="mt-2 text-xs" style={{ color: "#7A7A7A" }}>
              {card.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
