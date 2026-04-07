"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@lib/utils";
import { MemberActions, type MemberAction } from "./member-actions";

type Role = "OWNER" | "ADMIN" | "EDITOR" | "VIEWER";
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
      style={{ backgroundColor: "#E42313" }}
    >
      {initials.toUpperCase()}
    </div>
  );
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <span className="ml-1 text-[#B0B0B0]">{"\u2195"}</span>;
  return <span className="ml-1" style={{ color: "#E42313" }}>{dir === "asc" ? "\u2191" : "\u2193"}</span>;
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
      <div ref={ref} className="w-full max-w-sm rounded-2xl border border-[#E8E8E8] bg-white p-6 shadow-2xl">
        <div className="flex items-center gap-4">
          {member.avatar ? (
            <img src={member.avatar} alt={member.fullName} className="h-14 w-14 rounded-full object-cover" />
          ) : (
            <div
              className="flex h-14 w-14 items-center justify-center rounded-full text-lg font-semibold text-white"
              style={{ backgroundColor: "#E42313" }}
            >
              {member.fullName.trim().split(" ").length > 1
                ? member.fullName.trim().split(" ")[0][0] + member.fullName.trim().split(" ").slice(-1)[0][0]
                : member.fullName.slice(0, 2)
              }
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold" style={{ color: "#0D0D0D" }}>{member.fullName}</h3>
              {isOnline(member.lastActiveAt) && (
                <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#22C55E" }} />
              )}
            </div>
            <p className="text-sm" style={{ color: "#7A7A7A" }}>{member.email}</p>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <div className="flex justify-between text-sm">
            <span style={{ color: "#7A7A7A" }}>Role</span>
            <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ backgroundColor: badge.bg, color: badge.color }}>
              {member.role}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: "#7A7A7A" }}>Sites Access</span>
            <span style={{ color: "#0D0D0D" }}>{member.sitesAccess}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: "#7A7A7A" }}>Last Active</span>
            <span style={{ color: "#0D0D0D" }}>{relativeTime(member.lastActiveAt)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: "#7A7A7A" }}>Joined</span>
            <span style={{ color: "#0D0D0D" }}>{formatDate(member.joinedAt)}</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full rounded-lg border border-[#E8E8E8] py-2 text-sm font-medium transition-colors hover:bg-[#F4F4F4]"
          style={{ color: "#7A7A7A" }}
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

export function MembersTable({ members, currentUserId, onAction }: MembersTableProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>("fullName");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [detailMember, setDetailMember] = useState<Member | null>(null);

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
              <th
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                style={{ color: "#7A7A7A" }}
              >
                Sites Access
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: "#7A7A7A" }}>
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
                    "cursor-pointer border-b border-[#E8E8E8] transition-colors last:border-0 hover:bg-[#FAFAFA]",
                    selected.has(member.id) && "bg-red-50"
                  )}
                  onClick={() => setDetailMember(member)}
                >
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected.has(member.id)}
                      onChange={() => toggleOne(member.id)}
                      className="accent-[#E42313]"
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
                            style={{ backgroundColor: "#22C55E" }}
                          />
                        )}
                      </div>
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
                  <td className="px-4 py-3 text-xs" style={{ color: "#7A7A7A" }}>
                    {member.sitesAccess}
                  </td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
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

      {detailMember && (
        <MemberDetailCard member={detailMember} onClose={() => setDetailMember(null)} />
      )}
    </>
  );
}
