"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { MemberActions, type MemberAction } from "./member-actions";

type Role = "OWNER" | "ADMIN" | "EDITOR" | "VIEWER";
type Status = "ACTIVE" | "PENDING" | "SUSPENDED";

export interface Member {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  avatar: string | null;
  role: Role;
  status: Status;
  lastActiveAt: Date | null;
  joinedAt: Date;
}

type SortKey = "fullName" | "role" | "status" | "lastActiveAt";
type SortDir = "asc" | "desc";

const ROLE_BADGE: Record<Role, { bg: string; color: string }> = {
  OWNER: { bg: "#FEF2F2", color: "#E42313" },
  ADMIN: { bg: "#EFF6FF", color: "#3B82F6" },
  EDITOR: { bg: "#F0FDF4", color: "#22C55E" },
  VIEWER: { bg: "#F3F4F6", color: "#7A7A7A" },
};

const STATUS_BADGE: Record<Status, { label: string; color: string }> = {
  ACTIVE: { label: "Active", color: "#22C55E" },
  PENDING: { label: "Pending", color: "#F59E0B" },
  SUSPENDED: { label: "Suspended", color: "#E42313" },
};

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

function Initials({ name }: { name: string }) {
  const parts = name.trim().split(" ");
  const initials = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : parts[0].slice(0, 2);
  return (
    <div
      className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white"
      style={{ backgroundColor: "#E42313" }}
    >
      {initials.toUpperCase()}
    </div>
  );
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <span className="ml-1 text-[#B0B0B0]">↕</span>;
  return <span className="ml-1" style={{ color: "#E42313" }}>{dir === "asc" ? "↑" : "↓"}</span>;
}

interface MembersTableProps {
  members: Member[];
  currentUserId: string;
  onAction: (action: MemberAction, memberId: string) => void;
}

export function MembersTable({ members, currentUserId, onAction }: MembersTableProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>("fullName");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

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
    <div className="overflow-x-auto rounded-xl border border-[#E8E8E8] bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#E8E8E8]" style={{ backgroundColor: "#FAFAFA" }}>
            <th className="w-10 px-4 py-3">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className="accent-[#E42313]"
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
                style={{ color: "#7A7A7A" }}
                onClick={() => toggleSort(col.key)}
              >
                {col.label}
                <SortIcon active={sortKey === col.key} dir={sortDir} />
              </th>
            ))}
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: "#7A7A7A" }}>
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((member) => {
            const badge = ROLE_BADGE[member.role];
            const statusInfo = STATUS_BADGE[member.status];
            const isCurrentUser = member.userId === currentUserId;
            const isOwner = member.role === "OWNER";

            return (
              <tr
                key={member.id}
                className={cn(
                  "border-b border-[#E8E8E8] transition-colors last:border-0 hover:bg-[#FAFAFA]",
                  selected.has(member.id) && "bg-red-50"
                )}
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(member.id)}
                    onChange={() => toggleOne(member.id)}
                    className="accent-[#E42313]"
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {member.avatar ? (
                      <img src={member.avatar} alt={member.fullName} className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <Initials name={member.fullName} />
                    )}
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium" style={{ color: "#0D0D0D" }}>
                          {member.fullName}
                        </span>
                        {isOwner && (
                          <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold" style={{ backgroundColor: "#FEF2F2", color: "#E42313" }}>
                            Owner
                          </span>
                        )}
                        {isCurrentUser && (
                          <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold" style={{ backgroundColor: "#F3F4F6", color: "#7A7A7A" }}>
                            You
                          </span>
                        )}
                      </div>
                      <p className="text-xs" style={{ color: "#7A7A7A" }}>
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
                    {member.role}
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
                <td className="px-4 py-3 text-xs" style={{ color: "#7A7A7A" }}>
                  {relativeTime(member.lastActiveAt)}
                </td>
                <td className="px-4 py-3 text-right">
                  <MemberActions
                    memberId={member.id}
                    isOwner={isOwner}
                    isCurrentUser={isCurrentUser}
                    onAction={onAction}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
