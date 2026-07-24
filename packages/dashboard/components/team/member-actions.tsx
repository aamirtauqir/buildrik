"use client";

import { useState, useRef, useEffect } from "react";
import { MoreHorizontal } from "lucide-react";

export type MemberAction = "changeRole" | "revoke" | "reactivate" | "delete";

const ACTIVE_ACTIONS: { label: string; action: MemberAction }[] = [
  { label: "Change Role", action: "changeRole" },
  { label: "Revoke Access", action: "revoke" },
  { label: "Remove Member", action: "delete" },
];
// A suspended member can only be restored or removed — Change Role / Revoke are
// meaningless (and used to be offered as confusing no-ops).
const SUSPENDED_ACTIONS: { label: string; action: MemberAction }[] = [
  { label: "Reactivate", action: "reactivate" },
  { label: "Remove Member", action: "delete" },
];

interface MemberActionsProps {
  memberId: string;
  isOwner?: boolean;
  isCurrentUser?: boolean;
  isSuspended?: boolean;
  onAction: (action: MemberAction, memberId: string) => void;
}

export function MemberActions({ memberId, isOwner, isCurrentUser, isSuspended, onAction }: MemberActionsProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (isOwner) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded p-1.5 hover:bg-[var(--color-bg-subtle)] transition-colors"
        aria-label="Member actions"
      >
        <MoreHorizontal className="h-4 w-4" style={{ color: "var(--color-text-secondary)" }} />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-44 rounded-lg border border-[var(--color-border-default)] bg-white shadow-lg">
          {(isSuspended ? SUSPENDED_ACTIONS : ACTIVE_ACTIONS).map((item) => {
            const isDestructive = item.action === "delete" || item.action === "revoke";
            // Never let a member act destructively on their own row — no
            // self-delete, self-revoke, or self-demote (all one-way strandings).
            const disabled = isCurrentUser && (item.action === "delete" || item.action === "revoke" || item.action === "changeRole");
            return (
              <button
                key={item.action}
                disabled={disabled}
                onClick={() => {
                  onAction(item.action, memberId);
                  setOpen(false);
                }}
                className="flex w-full items-center px-3 py-2 text-body transition-colors hover:bg-[var(--color-bg-subtle)] disabled:cursor-not-allowed disabled:opacity-40"
                style={{ color: isDestructive ? "var(--color-primary)" : "var(--color-text-primary)" }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
