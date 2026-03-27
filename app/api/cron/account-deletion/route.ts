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

  for (const req of pending) {
    const userExists = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true },
    });
    if (!userExists) {
      await prisma.accountDeletionReq.update({
        where: { id: req.id },
        data: { processedAt: now },
      });
      continue;
    }

    await prisma.workspace.deleteMany({ where: { ownerId: req.userId } });
    await prisma.workspaceMember.deleteMany({ where: { userId: req.userId } });
    await prisma.user.delete({ where: { id: req.userId } });
    await prisma.accountDeletionReq.update({
      where: { id: req.id },
      data: { processedAt: now },
    });
    deleted++;
  }

  return Response.json({ ok: true, deleted });
}
