import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const now = new Date();

  const pending = await prisma.accountDeletionReq.findMany({
    where: {
      scheduledAt: { lte: now },
      processedAt: null,
      cancelledAt: null,
    },
  });

  let deleted = 0;

  for (const deletionReq of pending) {
    const userExists = await prisma.user.findUnique({
      where: { id: deletionReq.userId },
      select: { id: true },
    });
    if (!userExists) {
      await prisma.accountDeletionReq.update({
        where: { id: deletionReq.id },
        data: { processedAt: now },
      });
      continue;
    }

    await prisma.$transaction(async (tx) => {
      // A workspace owned by the departing user may still have OTHER active
      // members (a team). deleteMany({ownerId}) would destroy every
      // co-member's shared sites — data loss. Transfer ownership to the
      // longest-tenured remaining active member; only delete solo workspaces.
      const ownedWorkspaces = await tx.workspace.findMany({
        where: { ownerId: deletionReq.userId },
        select: { id: true },
      });
      for (const ws of ownedWorkspaces) {
        const heir = await tx.workspaceMember.findFirst({
          where: { workspaceId: ws.id, status: "ACTIVE", userId: { not: deletionReq.userId } },
          orderBy: { joinedAt: "asc" },
          select: { id: true, userId: true },
        });
        if (heir) {
          await tx.workspace.update({ where: { id: ws.id }, data: { ownerId: heir.userId } });
          await tx.workspaceMember.update({ where: { id: heir.id }, data: { role: "OWNER" } });
        } else {
          await tx.workspace.delete({ where: { id: ws.id } });
        }
      }
      await tx.workspaceMember.deleteMany({ where: { userId: deletionReq.userId } });
      await tx.user.delete({ where: { id: deletionReq.userId } });
      await tx.accountDeletionReq.update({
        where: { id: deletionReq.id },
        data: { processedAt: now },
      });
    });
    deleted++;
  }

  return Response.json({ ok: true, deleted });
}
