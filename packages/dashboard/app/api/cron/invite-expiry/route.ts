import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { count } = await prisma.invite.updateMany({
    where: { expiresAt: { lt: new Date() }, status: "PENDING" },
    data: { status: "EXPIRED" },
  });

  return Response.json({ ok: true, expired: count });
}
