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
      await tx.workspace.deleteMany({ where: { ownerId: deletionReq.userId } });
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
