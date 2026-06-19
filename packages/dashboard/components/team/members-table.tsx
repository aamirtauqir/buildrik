"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@lib/utils";
import { roleLabel } from "@lib/constants/enums";
import { MemberActions, type MemberAction } from "./member-actions";

type Role = "OWNER" | "ADMIN" | "EDITOR" | "DESIGNER" | "VIEWER";
type Status = "ACTIVE" | "PENDING" | "SUSPENDED";

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

type SortKey = "fullName" | "role" | "status" | "lastActiveAt";
type SortDir = "asc" | "desc";

const ROLE_BADGE: Record<Role, { bg: string; color: string }> = {
  OWNER: { bg: "#FEF2F2", color: "var(--color-primary)" },
  ADMIN: { bg: "#EFF6FF", color: "#3B82F6" },
  EDITOR: { bg: "#F0FDF4", color: "var(--color-success)" },
  DESIGNER: { bg: "#F0FDFA", color: "#0D9488" },
  VIEWER: { bg: "#F3F4F6", color: "var(--color-text-secondary)" },
};

const STATUS_BADGE: Record<Status, { label: string; color: string }> = {
  ACTIVE: { label: "Active", color: "var(--color-success)" },
  PENDING: { label: "Pending", color: "#F59E0B" },
  SUSPENDED: { label: "Suspended", color: "var(--color-primary)" },
};

function isOnline(lastActiveAt: Date | null): boolean {
  if (!lastActiveAt) return false;
  return Date.now() - new Date(lastActiveAt).getTime() < 15 * 60 * 1000;
}

function relativeTime(date: Date | null): string {
  if (!date) return "\u2014";
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

function Initials({ name }: { name: string }) {
  const parts = name.trim().split(" ");
  const initials = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : parts[0].slice(0, 2);
  return (
    <div
      className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white"
      style={{ backgroundColor: "var(--color-primary)" }}
    >
      {initials.toUpperCase()}
    </div>
  );
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <span className="ml-1 text-[var(--color-text-muted)]">{"\u2195"}</span>;
  return <span className="ml-1" style={{ color: "var(--color-primary)" }}>{dir === "asc" ? "\u2191" : "\u2193"}</span>;
}

function MemberDetailCard({ member, onClose }: { member: Member; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  const badge = ROLE_BADGE[member.role as Role] ?? ROLE_BADGE.VIEWER;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
      <div ref={ref} className="w-full max-w-sm rounded-2xl border border-[var(--color-border-default)] bg-white p-6 shadow-2xl">
        <div className="flex items-center gap-4">
          {member.avatar ? (
            <img src={member.avatar} alt={member.fullName} className="h-14 w-14 rounded-full object-cover" />
          ) : (
            <div
              className="flex h-14 w-14 items-center justify-center rounded-full text-lg font-semibold text-white"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              {member.fullName.trim().split(" ").length > 1
                ? member.fullName.trim().split(" ")[0][0] + member.fullName.trim().split(" ").slice(-1)[0][0]
                : member.fullName.slice(0, 2)
              }
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>{member.fullName}</h3>
              {isOnline(member.lastActiveAt) && (
                <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "var(--color-success)" }} />
              )}
            </div>
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{member.email}</p>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <div className="flex justify-between text-sm">
            <span style={{ color: "var(--color-text-secondary)" }}>Role</span>
            <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ backgroundColor: badge.bg, color: badge.color }}>
              {roleLabel(member.role)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: "var(--color-text-secondary)" }}>Sites Access</span>
            <span style={{ color: "var(--color-text-primary)" }}>{member.sitesAccess}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: "var(--color-text-secondary)" }}>Last Active</span>
            <span style={{ color: "var(--color-text-primary)" }}>{relativeTime(member.lastActiveAt)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: "var(--color-text-secondary)" }}>Joined</span>
            <span style={{ color: "var(--color-text-primary)" }}>{formatDate(member.joinedAt)}</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full rounded-lg border border-[var(--color-border-default)] py-2 text-sm font-medium transition-colors hover:bg-[var(--color-bg-subtle)]"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Close
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
}

const ASSIGNABLE_ROLES: Role[] = ["ADMIN", "EDITOR", "DESIGNER", "VIEWER"];

export function MembersTable({ members, currentUserId, onAction, onChangeRole }: MembersTableProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>("fullName");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [detailMember, setDetailMember] = useState<Member | null>(null);
  // "Change Role" used to dispatch onAction("changeRole"), which the page's
  // switch ignored — a silent dead end. Intercept it here and open a role
  // picker that calls the (already-wired) onChangeRole mutation.
  const [roleEditMember, setRoleEditMember] = useState<Member | null>(null);

  function handleMemberAction(action: MemberAction, memberId: string) {
    if (action === "changeRole") {
      const m = members.find((x) => x.id === memberId);
      if (m) setRoleEditMember(m);
      return;
    }
    onAction(action, memberId);
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  }

  function toggleAll() {
    if (selected.size === members.length) setSelected(new Set());
    else setSelected(new Set(members.map((m) => m.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const sorted = [...members].sort((a, b) => {
    let av: string | number | null = null;
    let bv: string | number | null = null;
    if (sortKey === "fullName") { av = a.fullName.toLowerCase(); bv = b.fullName.toLowerCase(); }
    else if (sortKey === "role") { av = a.role; bv = b.role; }
    else if (sortKey === "status") { av = a.status; bv = b.status; }
    else if (sortKey === "lastActiveAt") {
      av = a.lastActiveAt ? new Date(a.lastActiveAt).getTime() : 0;
      bv = b.lastActiveAt ? new Date(b.lastActiveAt).getTime() : 0;
    }
    if (av === null || bv === null) return 0;
    if (av < bv) return sortDir === "asc" ? -1 : 1;
    if (av > bv) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const allSelected = selected.size === members.length && members.length > 0;

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-[var(--color-border-default)] bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border-default)]" style={{ backgroundColor: "var(--color-bg-page)" }}>
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="accent-[var(--color-primary)]"
                />
              </th>
              {(
                [
                  { key: "fullName", label: "Name" },
                  { key: "role", label: "Role" },
                  { key: "status", label: "Status" },
                  { key: "lastActiveAt", label: "Last Active" },
                ] as { key: SortKey; label: string }[]
              ).map((col) => (
                <th
                  key={col.key}
                  className="cursor-pointer select-none px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                  style={{ color: "var(--color-text-secondary)" }}
                  onClick={() => toggleSort(col.key)}
                >
                  {col.label}
                  <SortIcon active={sortKey === col.key} dir={sortDir} />
                </th>
              ))}
              <th
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Sites Access
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-secondary)" }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((member) => {
              const badge = ROLE_BADGE[member.role as Role] ?? ROLE_BADGE.VIEWER;
              const statusInfo = STATUS_BADGE[member.status as Status] ?? STATUS_BADGE.ACTIVE;
              const isCurrentUser = member.userId === currentUserId;
              const isOwner = member.role === "OWNER";
              const online = isOnline(member.lastActiveAt);

              return (
                <tr
                  key={member.id}
                  className={cn(
                    "cursor-pointer border-b border-[var(--color-border-default)] transition-colors last:border-0 hover:bg-[var(--color-bg-page)]",
                    selected.has(member.id) && "bg-red-50"
                  )}
                  onClick={() => setDetailMember(member)}
                >
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected.has(member.id)}
                      onChange={() => toggleOne(member.id)}
                      className="accent-[var(--color-primary)]"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        {member.avatar ? (
                          <img src={member.avatar} alt={member.fullName} className="h-8 w-8 rounded-full object-cover" />
                        ) : (
                          <Initials name={member.fullName} />
                        )}
                        {online && (
                          <span
                            className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white"
                            style={{ backgroundColor: "var(--color-success)" }}
                          />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium" style={{ color: "var(--color-text-primary)" }}>
                            {member.fullName}
                          </span>
                          {isOwner && (
                            <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold" style={{ backgroundColor: "#FEF2F2", color: "var(--color-primary)" }}>
                              Owner
                            </span>
                          )}
                          {isCurrentUser && (
                            <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold" style={{ backgroundColor: "#F3F4F6", color: "var(--color-text-secondary)" }}>
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                          {member.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="rounded-full px-2.5 py-1 text-xs font-semibold"
                      style={{ backgroundColor: badge.bg, color: badge.color }}
                    >
                      {roleLabel(member.role)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="flex items-center gap-1.5 text-xs font-medium"
                      style={{ color: statusInfo.color }}
                    >
                      <span
                        className="inline-block h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: statusInfo.color }}
                      />
                      {statusInfo.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                    {relativeTime(member.lastActiveAt)}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                    {member.sitesAccess}
                  </td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
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

      {detailMember && (
        <MemberDetailCard member={detailMember} onClose={() => setDetailMember(null)} />
      )}

      {roleEditMember && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-sm rounded-2xl border border-[var(--color-border-default)] bg-white p-6 shadow-2xl">
            <h3 className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>
              Change role
            </h3>
            <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
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
                    className="flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-[var(--color-bg-subtle)] disabled:cursor-not-allowed disabled:opacity-50"
                    style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-primary)" }}
                  >
                    <span>{roleLabel(role)}</span>
                    {isCurrent && (
                      <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>current</span>
                    )}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setRoleEditMember(null)}
              className="mt-4 w-full rounded-lg border border-[var(--color-border-default)] py-2 text-sm font-medium transition-colors hover:bg-[var(--color-bg-subtle)]"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
