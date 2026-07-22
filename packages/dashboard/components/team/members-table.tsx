"use client";

import { useState, useEffect } from "react";
import { cn } from "@lib/utils";
import { roleLabel } from "@lib/constants/enums";
import { Button, Pill, MetricValue, Modal, type PillTone } from "@/components/dashboard/primitives";
import { MemberActions, type MemberAction } from "./member-actions";

type Role = "OWNER" | "ADMIN" | "EDITOR" | "DESIGNER" | "VIEWER";

export interface Member {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  avatar: string | null;
  role: string;
  status: string;
  lastActiveAt: Date | null;
  joinedAt: Date;
  sitesAccess: string;
}

// Owner is the only role that reads as accent (primary). Every other role —
// Admin, Content editor, Designer, Viewer — is a neutral chip so the table
// never implies Admin/Editor carry owner-level authority.
const ROLE_TONE: Record<Role, PillTone> = {
  OWNER: "accent",
  ADMIN: "neutral",
  EDITOR: "neutral",
  DESIGNER: "neutral",
  VIEWER: "neutral",
};

function isOnline(lastActiveAt: Date | null): boolean {
  if (!lastActiveAt) return false;
  return Date.now() - new Date(lastActiveAt).getTime() < 15 * 60 * 1000;
}

function relativeTime(date: Date | null): string {
  if (!date) return "—";
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function initialsOf(name: string): string {
  const parts = name.trim().split(" ");
  const initials = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : parts[0].slice(0, 2);
  return initials.toUpperCase();
}

function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, fontSize: size <= 32 ? 12 : 18, backgroundColor: "var(--color-primary)" }}
    >
      {initialsOf(name)}
    </div>
  );
}

function MemberDetailCard({ member, onClose }: { member: Member; onClose: () => void }) {
  return (
    <Modal
      open={true}
      onClose={onClose}
      title={member.fullName}
      width={384}
      footer={
        <Button variant="ghost" onClick={onClose} className="w-full">
          Close
        </Button>
      }
    >
      <div className="flex items-center gap-4">
        {member.avatar ? (
          <img src={member.avatar} alt={member.fullName} className="h-14 w-14 rounded-full object-cover" />
        ) : (
          <Avatar name={member.fullName} size={56} />
        )}
        <div className="flex items-center gap-2">
          <p className="text-body" style={{ color: "var(--color-text-secondary)" }}>{member.email}</p>
          {isOnline(member.lastActiveAt) && (
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "var(--color-success)" }} />
          )}
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <div className="flex justify-between text-body">
          <span style={{ color: "var(--color-text-secondary)" }}>Role</span>
          <Pill tone={ROLE_TONE[member.role as Role] ?? "neutral"}>{roleLabel(member.role)}</Pill>
        </div>
        <div className="flex justify-between text-body">
          <span style={{ color: "var(--color-text-secondary)" }}>Sites access</span>
          <span style={{ color: "var(--color-text-primary)" }}><MetricValue>{member.sitesAccess}</MetricValue></span>
        </div>
        <div className="flex justify-between text-body">
          <span style={{ color: "var(--color-text-secondary)" }}>Last active</span>
          <span style={{ color: "var(--color-text-primary)" }}><MetricValue>{relativeTime(member.lastActiveAt)}</MetricValue></span>
        </div>
        <div className="flex justify-between text-body">
          <span style={{ color: "var(--color-text-secondary)" }}>Joined</span>
          <span style={{ color: "var(--color-text-primary)" }}><MetricValue>{formatDate(member.joinedAt)}</MetricValue></span>
        </div>
      </div>
    </Modal>
  );
}

// Ink action bar for the bulk-select mode. Appears only while a selection is
// live; reuses the (already-wired) per-row delete action for bulk removal.
function BulkBar({
  count,
  allSelected,
  onSelectAll,
  onRemove,
  onCancel,
}: {
  count: number;
  allSelected: boolean;
  onSelectAll: () => void;
  onRemove: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-x-0 bottom-6 z-30 flex justify-center px-4">
      <div className="flex items-center gap-3 rounded-pill px-4 py-2.5 shadow-card" style={{ backgroundColor: "var(--color-ink)" }}>
        <span className="text-body-sm font-medium text-white">
          <MetricValue>{count}</MetricValue> selected
        </span>
        <span className="h-4 w-px" style={{ backgroundColor: "rgba(255,255,255,0.2)" }} />
        <button onClick={onSelectAll} className="text-body-sm font-medium text-white/80 transition-colors hover:text-white">
          {allSelected ? "Clear all" : "Select all"}
        </button>
        <Button variant="danger" size="sm" onClick={onRemove}>
          Remove
        </Button>
        <button onClick={onCancel} className="text-body-sm font-medium text-white/60 transition-colors hover:text-white">
          Cancel
        </button>
      </div>
    </div>
  );
}

interface MembersTableProps {
  members: Member[];
  currentUserId: string;
  onAction: (action: MemberAction, memberId: string) => void;
  onChangeRole?: (memberId: string, role: string) => void;
  selectMode: boolean;
  onExitSelectMode: () => void;
}

const ASSIGNABLE_ROLES: Role[] = ["ADMIN", "EDITOR", "DESIGNER", "VIEWER"];

export function MembersTable({ members, currentUserId, onAction, onChangeRole, selectMode, onExitSelectMode }: MembersTableProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [detailMember, setDetailMember] = useState<Member | null>(null);
  // "Change Role" used to dispatch onAction("changeRole"), which the page's
  // switch ignored — a silent dead end. Intercept it here and open a role
  // picker that calls the (already-wired) onChangeRole mutation.
  const [roleEditMember, setRoleEditMember] = useState<Member | null>(null);
  // Removal (revoke/delete) is irreversible and was firing on a single click —
  // including one-click BULK removal. Gate every removal behind a confirm here,
  // so both per-row and bulk paths are covered without the page popping N
  // dialogs for a bulk action.
  const [confirm, setConfirm] = useState<{ action: MemberAction; ids: string[]; heading: string; body: string } | null>(null);

  // Leaving select mode drops the pending selection so it can't linger and
  // apply to a later action.
  useEffect(() => {
    if (!selectMode) setSelected(new Set());
  }, [selectMode]);

  function handleMemberAction(action: MemberAction, memberId: string) {
    if (action === "changeRole") {
      const m = members.find((x) => x.id === memberId);
      if (m) setRoleEditMember(m);
      return;
    }
    const m = members.find((x) => x.id === memberId);
    const who = m?.fullName || m?.email || "this member";
    setConfirm(
      action === "delete"
        ? { action, ids: [memberId], heading: "Remove member?", body: `${who} will lose all access to this workspace. This can't be undone.` }
        : { action, ids: [memberId], heading: "Revoke access?", body: `${who}'s access will be suspended immediately.` }
    );
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Owner rows and your own row can't be removed (mirrors the per-row menu
  // guards), so they're never selectable for a bulk action.
  const selectableIds = members
    .filter((m) => m.role !== "OWNER" && m.userId !== currentUserId)
    .map((m) => m.id);

  function toggleAll() {
    setSelected((prev) => (prev.size === selectableIds.length ? new Set() : new Set(selectableIds)));
  }

  function removeSelected() {
    const ids = [...selected];
    if (ids.length === 0) return;
    setConfirm({
      action: "delete",
      ids,
      heading: `Remove ${ids.length} member${ids.length === 1 ? "" : "s"}?`,
      body: `${ids.length === 1 ? "This member" : "These members"} will lose all access to this workspace. This can't be undone.`,
    });
  }

  function runConfirm() {
    if (!confirm) return;
    const isBulk = confirm.ids.length > 1 || selectMode;
    confirm.ids.forEach((id) => onAction(confirm.action, id));
    setConfirm(null);
    if (isBulk) onExitSelectMode();
  }

  function handleRowClick(member: Member) {
    if (selectMode) {
      if (member.role === "OWNER" || member.userId === currentUserId) return;
      toggleOne(member.id);
    } else {
      setDetailMember(member);
    }
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border shadow-card" style={{ borderColor: "var(--color-border-default)", backgroundColor: "var(--color-bg-surface)" }}>
        <table className="w-full text-body">
          <thead>
            <tr className="border-b text-left text-eyebrow uppercase tracking-wide" style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-secondary)", backgroundColor: "var(--color-bg-subtle)" }}>
              <th className="px-[18px] py-2.5 font-semibold">Member</th>
              <th className="px-[18px] py-2.5 font-semibold">Email</th>
              <th className="px-[18px] py-2.5 font-semibold">Role</th>
              <th className="px-[18px] py-2.5 font-semibold">Last active</th>
              <th className="w-10 px-[18px] py-2.5 font-semibold" aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {members.map((member) => {
              const isCurrentUser = member.userId === currentUserId;
              const isOwner = member.role === "OWNER";
              const selectable = selectMode && !isOwner && !isCurrentUser;
              const isSelected = selected.has(member.id);

              return (
                <tr
                  key={member.id}
                  onClick={() => handleRowClick(member)}
                  className={cn(
                    "border-b transition-colors last:border-0",
                    (!selectMode || selectable) && "cursor-pointer hover:bg-[var(--color-bg-subtle)]",
                    isSelected && "bg-[var(--color-primary-subtle)]"
                  )}
                  style={{ borderColor: "var(--color-border-default)" }}
                >
                  <td className="px-[18px] py-3.5" style={{ color: "var(--color-text-primary)" }}>
                    <div className="flex items-center gap-3">
                      {selectMode && (
                        <input
                          type="checkbox"
                          readOnly
                          checked={isSelected}
                          disabled={!selectable}
                          className="pointer-events-none accent-[var(--color-primary)]"
                        />
                      )}
                      {member.avatar ? (
                        <img src={member.avatar} alt={member.fullName} className="h-8 w-8 shrink-0 rounded-full object-cover" />
                      ) : (
                        <Avatar name={member.fullName} />
                      )}
                      <span className="font-medium">{member.fullName}</span>
                    </div>
                  </td>
                  <td className="px-[18px] py-3.5" style={{ color: "var(--color-text-secondary)" }}>
                    {member.email}
                  </td>
                  <td className="px-[18px] py-3.5">
                    <Pill tone={ROLE_TONE[member.role as Role] ?? "neutral"}>{roleLabel(member.role)}</Pill>
                  </td>
                  <td className="px-[18px] py-3.5" style={{ color: "var(--color-text-secondary)" }}>
                    <MetricValue>{relativeTime(member.lastActiveAt)}</MetricValue>
                  </td>
                  <td className="px-[18px] py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                    <MemberActions
                      memberId={member.id}
                      isOwner={isOwner}
                      isCurrentUser={isCurrentUser}
                      onAction={handleMemberAction}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectMode && selected.size > 0 && (
        <BulkBar
          count={selected.size}
          allSelected={selected.size === selectableIds.length && selectableIds.length > 0}
          onSelectAll={toggleAll}
          onRemove={removeSelected}
          onCancel={onExitSelectMode}
        />
      )}

      {detailMember && (
        <MemberDetailCard member={detailMember} onClose={() => setDetailMember(null)} />
      )}

      {confirm && (
        <Modal
          open={true}
          onClose={() => setConfirm(null)}
          title={confirm.heading}
          width={400}
          footer={
            <>
              <Button variant="ghost" onClick={() => setConfirm(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={runConfirm}>
                {confirm.action === "delete" ? "Remove" : "Revoke"}
              </Button>
            </>
          }
        >
          <p className="text-body" style={{ color: "var(--color-text-secondary)" }}>
            {confirm.body}
          </p>
        </Modal>
      )}

      {roleEditMember && (
        <Modal
          open={true}
          onClose={() => setRoleEditMember(null)}
          title="Change role"
          width={384}
          footer={
            <Button variant="ghost" onClick={() => setRoleEditMember(null)} className="w-full">
              Cancel
            </Button>
          }
        >
          <p className="text-body" style={{ color: "var(--color-text-secondary)" }}>
            {roleEditMember.fullName} — currently {roleLabel(roleEditMember.role)}
          </p>
          <div className="mt-4 space-y-2">
            {ASSIGNABLE_ROLES.map((role) => {
              const isCurrent = roleEditMember.role === role;
              return (
                <button
                  key={role}
                  disabled={isCurrent}
                  onClick={() => {
                    onChangeRole?.(roleEditMember.id, role);
                    setRoleEditMember(null);
                  }}
                  className="flex w-full items-center justify-between rounded-lg border px-3 py-2 text-body transition-colors hover:bg-[var(--color-bg-subtle)] disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-primary)" }}
                >
                  <span>{roleLabel(role)}</span>
                  {isCurrent && (
                    <span className="text-body-sm" style={{ color: "var(--color-text-muted)" }}>current</span>
                  )}
                </button>
              );
            })}
          </div>
        </Modal>
      )}
    </>
  );
}
