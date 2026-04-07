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
  const [total, active, pending] = await Promise.all([
    prisma.workspaceMember.count({ where: { workspaceId } }),
    prisma.workspaceMember.count({ where: { workspaceId, status: "ACTIVE" } }),
    prisma.invite.count({ where: { workspaceId, status: "PENDING" } }),
  ]);
  return { total, active, pending };
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
  const memberEmails = new Set(existingMembers.map((m: any) => m.user.email));

  const pendingInvites = await prisma.invite.findMany({
    where: { workspaceId, status: "PENDING" },
    select: { email: true },
  });
  const pendingEmails = new Set(pendingInvites.map((i: any) => i.email));

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
  actorId: string,
) {
  const member = await prisma.workspaceMember.findUnique({
    where: { id: memberId },
  });
  if (!member) throw new Error("MEMBER_NOT_FOUND");
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

export async function revokeMember(memberId: string) {
  const member = await prisma.workspaceMember.findUnique({
    where: { id: memberId },
  });
  if (!member) throw new Error("MEMBER_NOT_FOUND");
  if (member.role === "OWNER") throw new Error("CANNOT_REVOKE_OWNER");

  return prisma.workspaceMember.update({
    where: { id: memberId },
    data: { status: "SUSPENDED", suspendedAt: new Date() },
  });
}

export async function deleteMember(memberId: string) {
  const member = await prisma.workspaceMember.findUnique({
    where: { id: memberId },
  });
  if (!member) throw new Error("MEMBER_NOT_FOUND");
  if (member.role === "OWNER") throw new Error("CANNOT_DELETE_OWNER");

  return prisma.workspaceMember.delete({ where: { id: memberId } });
}

export async function listPendingInvites(workspaceId: string) {
  return prisma.invite.findMany({
    where: { workspaceId, status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });
}

export async function revokeInvite(inviteId: string) {
  return prisma.invite.delete({ where: { id: inviteId } });
}

export async function resendInvite(inviteId: string) {
  const invite = await prisma.invite.findUnique({ where: { id: inviteId } });
  if (!invite) throw new Error("INVITE_NOT_FOUND");
  if (invite.resendCount >= 2) throw new Error("MAX_RESENDS");

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  return prisma.invite.update({
    where: { id: inviteId },
    data: { expiresAt, resendCount: { increment: 1 } },
  });
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
