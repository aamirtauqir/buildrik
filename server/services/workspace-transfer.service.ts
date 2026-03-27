import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import {
  sendWSTransferInviteEmail,
  sendWSTransferOutEmail,
  sendWSTransferInEmail,
} from "@/server/services/email.service";

export async function initiateTransfer(
  workspaceId: string,
  fromUserId: string,
  toEmail: string,
) {
  const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
  if (!workspace) throw new Error("WORKSPACE_NOT_FOUND");
  if (workspace.ownerId !== fromUserId) throw new Error("NOT_OWNER");

  const existing = await prisma.workspaceTransfer.findFirst({
    where: { workspaceId, status: "PENDING", expiresAt: { gt: new Date() } },
  });
  if (existing) throw new Error("TRANSFER_PENDING");

  const toUser = await prisma.user.findUnique({
    where: { email: toEmail },
    select: { id: true },
  });

  const fromUser = await prisma.user.findUnique({
    where: { id: fromUserId },
    select: { email: true },
  });

  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48h

  await prisma.workspaceTransfer.create({
    data: {
      workspaceId,
      fromUserId,
      toUserId: toUser?.id ?? null,
      toEmail,
      token,
      status: "PENDING",
      expiresAt,
    },
  });

  sendWSTransferInviteEmail(toEmail, workspace.name, token).catch(() => {});
  if (fromUser?.email) {
    sendWSTransferOutEmail(fromUser.email, workspace.name, toEmail).catch(() => {});
  }

  return { ok: true };
}

export async function acceptTransfer(token: string, acceptingUserId: string) {
  const transfer = await prisma.workspaceTransfer.findUnique({ where: { token } });
  if (!transfer || transfer.status !== "PENDING") throw new Error("TRANSFER_NOT_FOUND");
  if (transfer.expiresAt < new Date()) throw new Error("TRANSFER_EXPIRED");

  const acceptingUser = await prisma.user.findUnique({
    where: { id: acceptingUserId },
    select: { email: true },
  });
  if (!acceptingUser) throw new Error("USER_NOT_FOUND");
  if (acceptingUser.email.toLowerCase() !== transfer.toEmail.toLowerCase()) {
    throw new Error("EMAIL_MISMATCH");
  }

  await prisma.$transaction(async (tx) => {
    // Update workspace owner
    await tx.workspace.update({
      where: { id: transfer.workspaceId },
      data: { ownerId: acceptingUserId },
    });

    // Ensure new owner has OWNER role in workspace
    await tx.workspaceMember.upsert({
      where: { userId_workspaceId: { userId: acceptingUserId, workspaceId: transfer.workspaceId } },
      create: { userId: acceptingUserId, workspaceId: transfer.workspaceId, role: "OWNER" },
      update: { role: "OWNER" },
    });

    // Demote old owner to EDITOR
    await tx.workspaceMember.updateMany({
      where: { userId: transfer.fromUserId, workspaceId: transfer.workspaceId },
      data: { role: "EDITOR" },
    });

    // Mark transfer complete
    await tx.workspaceTransfer.update({
      where: { id: transfer.id },
      data: { status: "COMPLETED", toUserId: acceptingUserId },
    });
  });

  const workspace = await prisma.workspace.findUnique({
    where: { id: transfer.workspaceId },
    select: { name: true },
  });
  sendWSTransferInEmail(acceptingUser.email, workspace?.name ?? "your workspace").catch(() => {});

  return { workspaceId: transfer.workspaceId };
}

export async function cancelTransfer(workspaceId: string, userId: string) {
  const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
  if (!workspace) throw new Error("WORKSPACE_NOT_FOUND");
  if (workspace.ownerId !== userId) throw new Error("NOT_OWNER");

  const updated = await prisma.workspaceTransfer.updateMany({
    where: { workspaceId, status: "PENDING" },
    data: { status: "CANCELLED" },
  });

  return { cancelled: updated.count };
}

export async function getPendingTransfer(workspaceId: string) {
  return prisma.workspaceTransfer.findFirst({
    where: { workspaceId, status: "PENDING", expiresAt: { gt: new Date() } },
    select: { id: true, toEmail: true, expiresAt: true, createdAt: true },
  });
}
