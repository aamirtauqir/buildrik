"use client";

import { Users, Crown, ShieldCheck, Pencil, Eye } from "lucide-react";
import { Button } from "@/components/dashboard/primitives";

// Role reference cards: informative, not decorative — neutral icon tiles per
// the anti-slop rule (no icon-in-colored-circle grids; DESIGN.md).
const ROLE_CARDS = [
  { role: "Owner", description: "Full control of workspace, billing, and settings", Icon: Crown },
  { role: "Admin", description: "Manage team members, sites, and settings. No billing access.", Icon: ShieldCheck },
  { role: "Content editor", description: "Create and edit site content. Cannot publish or manage team.", Icon: Pencil },
  { role: "Viewer", description: "View published sites only. Read-only access.", Icon: Eye },
];

interface TeamEmptyStateProps {
  onInvite: () => void;
}

export function TeamEmptyState({ onInvite }: TeamEmptyStateProps) {
  return (
    <div className="flex flex-col items-center px-6 py-16">
      <div
        className="mb-4 flex h-16 w-16 items-center justify-center rounded-lg"
        style={{ backgroundColor: "var(--color-primary-subtle)" }}
      >
        <Users className="h-8 w-8" style={{ color: "var(--color-primary)" }} />
      </div>

      <h2 className="text-xl font-semibold" style={{ color: "var(--color-text-primary)" }}>
        No team members yet
      </h2>
      <p className="mt-2 max-w-sm text-center text-body" style={{ color: "var(--color-text-secondary)" }}>
        Invite your colleagues to collaborate. Choose the right role for each person based on what they need to do.
      </p>

      <Button onClick={onInvite} className="mt-6">
        Invite Team Members
      </Button>

      <div className="mt-10 grid w-full max-w-2xl gap-3 grid-cols-2 sm:grid-cols-4">
        {ROLE_CARDS.map((card) => (
          <div
            key={card.role}
            className="rounded-lg border border-[var(--color-border-default)] p-4"
          >
            <div
              className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ backgroundColor: "var(--color-bg-subtle)" }}
            >
              <card.Icon className="h-4 w-4" style={{ color: "var(--color-text-secondary)" }} />
            </div>
            <p className="text-body font-bold" style={{ color: "var(--color-text-primary)" }}>
              {card.role}
            </p>
            <p className="mt-1 text-body-sm" style={{ color: "var(--color-text-secondary)" }}>
              {card.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
