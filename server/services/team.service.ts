import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS, type PlanName } from "@/lib/constants/plan-limits";
import type { ListMembersInput, InviteMembersInput, MemberData } from "@buildrik/shared/schemas/team";
import { sendTeamInviteEmail } from "@/server/services/email.service";

const TEAM_ACTIONS = [
  "MEMBER_INVITED",
  "MEMBER_JOINED",
  "MEMBER_REMOVED",
  "MEMBER_ROLE_CHANGED",
];

export async function getTeamStats(workspaceId: string) {
  const [total, active, pending, workspace] = await Promise.all([
    prisma.workspaceMember.count({ where: { workspaceId } }),
    prisma.workspaceMember.count({ where: { workspaceId, status: "ACTIVE" } }),
    prisma.invite.count({ where: { workspaceId, status: "PENDING" } }),
    prisma.workspace.findUnique({ where: { id: workspaceId }, select: { plan: true } }),
  ]);
  // Seat capacity = the plan's team-member limit, so the UI can show
  // "used / capacity" instead of members/members ("4 / 4" on a 25-seat plan).
  const plan = (workspace?.plan ?? "FREE") as PlanName;
  const limit = PLAN_LIMITS[plan].teamMembers as number;
  return { total, active, pending, limit };
}

export async function listMembers(
  workspaceId: string,
  input: ListMembersInput,
) {
  const { page = 1, perPage = 20, role, status } = input;

  const where: Record<string, unknown> = { workspaceId };
  if (role) where.role = role;
  if (status) where.status = status;

  const [total, members, totalSites] = await Promise.all([
    prisma.workspaceMember.count({ where }),
    prisma.workspaceMember.findMany({
      where,
      include: {
        user: { select: { fullName: true, email: true, avatar: true } },
        sitePermissions: { select: { id: true } },
      },
      skip: (page - 1) * perPage,
      take: perPage,
      orderBy: { joinedAt: "desc" },
    }),
    prisma.site.count({ where: { workspaceId, deletedAt: null } }),
  ]);

  const data: MemberData[] = members.map((m) => ({
    id: m.id,
    userId: m.userId,
    fullName: m.user.fullName,
    email: m.user.email,
    avatar: m.user.avatar,
    role: m.role,
    status: m.status,
    lastActiveAt: m.lastActiveAt,
    joinedAt: m.joinedAt,
    sitesAccess: m.sitePermissions.length === 0 ? "All sites" : `${m.sitePermissions.length} of ${totalSites}`,
  }));

  return { data, total, page, perPage };
}

export async function inviteMembers(
  workspaceId: string,
  inviterId: string,
  input: InviteMembersInput,
  plan: PlanName,
) {
  const limit = PLAN_LIMITS[plan].teamMembers as number;
  const currentCount = await prisma.workspaceMember.count({ where: { workspaceId } });

  const existingMembers = await prisma.workspaceMember.findMany({
    where: { workspaceId },
    select: { user: { select: { email: true } } },
  });
  const memberEmails = new Set(existingMembers.map((m) => m.user.email));

  const pendingInvites = await prisma.invite.findMany({
    where: { workspaceId, status: "PENDING" },
    select: { email: true },
  });
  const pendingEmails = new Set(pendingInvites.map((i) => i.email));

  const toInvite: string[] = [];
  let skipped = 0;

  for (const email of input.emails) {
    if (memberEmails.has(email) || pendingEmails.has(email)) {
      skipped++;
      continue;
    }
    toInvite.push(email);
  }

  const effectiveLimit = limit as number;
  if (effectiveLimit > 0 && currentCount + toInvite.length + pendingEmails.size > effectiveLimit) {
    throw new Error("TEAM_LIMIT");
  }

  const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId }, select: { name: true } });
  const inviter = await prisma.user.findUnique({ where: { id: inviterId }, select: { fullName: true } });

  for (const email of toInvite) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invite = await prisma.invite.create({
      data: {
        workspaceId,
        email,
        role: input.role,
        message: input.message,
        token: crypto.randomUUID(),
        status: "PENDING",
        invitedBy: inviterId,
        siteIds: input.siteIds ?? [],
        expiresAt,
      },
    });

    try {
      await sendTeamInviteEmail(email, workspace?.name ?? "Workspace", inviter?.fullName ?? "A team member", invite.token);
    } catch { /* Email failure shouldn't block invite */ }
  }

  return { sent: toInvite.length, skipped };
}

export async function changeRole(
  memberId: string,
  role: string,
  workspaceId: string,
  actorUserId: string,
) {
  const member = await prisma.workspaceMember.findUnique({
    where: { id: memberId },
  });
  // Scope to the actor's workspace: a valid memberId from another workspace
  // must not be mutable here (IDOR guard).
  if (!member || member.workspaceId !== workspaceId) throw new Error("MEMBER_NOT_FOUND");
  // No self-demotion — an admin could otherwise strand themselves as VIEWER
  // with no way back (there is no self re-promote path).
  if (member.userId === actorUserId) throw new Error("CANNOT_MODIFY_SELF");
  if (member.role === "OWNER") throw new Error("CANNOT_CHANGE_OWNER");

  if (member.role === "ADMIN" && role !== "ADMIN") {
    const adminCount = await prisma.workspaceMember.count({
      where: {
        workspaceId: member.workspaceId,
        role: { in: ["ADMIN", "OWNER"] },
      },
    });
    if (adminCount <= 1) throw new Error("LAST_ADMIN");
  }

  return prisma.workspaceMember.update({
    where: { id: memberId },
    data: { role },
  });
}

export async function revokeMember(memberId: string, workspaceId: string, actorUserId: string) {
  const member = await prisma.workspaceMember.findUnique({
    where: { id: memberId },
  });
  if (!member || member.workspaceId !== workspaceId) throw new Error("MEMBER_NOT_FOUND");
  // No self-revoke — it deletes the actor's own sessions (instant lockout) with
  // no self-reactivate path.
  if (member.userId === actorUserId) throw new Error("CANNOT_MODIFY_SELF");
  if (member.role === "OWNER") throw new Error("CANNOT_REVOKE_OWNER");

  const updated = await prisma.workspaceMember.update({
    where: { id: memberId },
    data: { status: "SUSPENDED", suspendedAt: new Date() },
  });
  // Cut the suspended member's active sessions immediately (defense-in-depth;
  // per-request resolveWorkspaceId also revokes their workspace access).
  await prisma.session.deleteMany({ where: { userId: member.userId } });
  return updated;
}

/**
 * Restore a suspended member to ACTIVE. Revoke ("Revoke Access") set SUSPENDED
 * with no way back — re-invite was skipped as an existing member and re-accept
 * threw CONFLICT, so a mis-click stranded the person. This is the reverse.
 */
export async function reactivateMember(memberId: string, workspaceId: string) {
  const member = await prisma.workspaceMember.findUnique({ where: { id: memberId } });
  if (!member || member.workspaceId !== workspaceId) throw new Error("MEMBER_NOT_FOUND");
  if (member.status !== "SUSPENDED") throw new Error("NOT_SUSPENDED");
  return prisma.workspaceMember.update({
    where: { id: memberId },
    data: { status: "ACTIVE", suspendedAt: null },
  });
}

export async function deleteMember(memberId: string, workspaceId: string) {
  const member = await prisma.workspaceMember.findUnique({
    where: { id: memberId },
  });
  if (!member || member.workspaceId !== workspaceId) throw new Error("MEMBER_NOT_FOUND");
  if (member.role === "OWNER") throw new Error("CANNOT_DELETE_OWNER");

  await prisma.session.deleteMany({ where: { userId: member.userId } });
  return prisma.workspaceMember.delete({ where: { id: memberId } });
}

export async function listPendingInvites(workspaceId: string) {
  return prisma.invite.findMany({
    where: { workspaceId, status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });
}

export async function revokeInvite(inviteId: string, workspaceId: string) {
  // Scoped delete: a cross-workspace inviteId matches zero rows (no-op),
  // never another workspace's invite.
  const result = await prisma.invite.deleteMany({ where: { id: inviteId, workspaceId } });
  if (result.count === 0) throw new Error("INVITE_NOT_FOUND");
  return result;
}

export async function resendInvite(inviteId: string, workspaceId: string) {
  const invite = await prisma.invite.findUnique({ where: { id: inviteId } });
  if (!invite || invite.workspaceId !== workspaceId) throw new Error("INVITE_NOT_FOUND");
  if (invite.resendCount >= 2) throw new Error("MAX_RESENDS");

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const updated = await prisma.invite.update({
    where: { id: inviteId },
    data: { expiresAt, resendCount: { increment: 1 } },
  });

  // Actually re-send the email — the whole point of "resend". Without this the
  // UI toasted "Invitation resent" while the invitee received nothing.
  const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId }, select: { name: true } });
  const inviter = await prisma.user.findUnique({ where: { id: invite.invitedBy }, select: { fullName: true } });
  try {
    await sendTeamInviteEmail(invite.email, workspace?.name ?? "Workspace", inviter?.fullName ?? "A team member", invite.token);
  } catch { /* Email failure shouldn't block the resend bookkeeping */ }

  return updated;
}

export async function getTeamActivity(workspaceId: string, limit = 5) {
  const logs = await prisma.activityLog.findMany({
    where: {
      workspaceId,
      action: { in: TEAM_ACTIONS },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  const actorIds = [...new Set(logs.map((l) => l.actorId).filter(Boolean))] as string[];
  const actors = actorIds.length > 0
    ? await prisma.user.findMany({ where: { id: { in: actorIds } }, select: { id: true, fullName: true } })
    : [];
  const actorMap = new Map(actors.map((a) => [a.id, a.fullName]));

  return logs.map((log) => ({
    ...log,
    actorName: (log.actorId && actorMap.get(log.actorId)) ?? null,
  }));
}
