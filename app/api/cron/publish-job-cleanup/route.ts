import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const cutoff = new Date(Date.now() - 60 * 60 * 1000);

  const { count } = await prisma.publishBuildJob.updateMany({
    where: {
      status: { in: ["QUEUED", "IN_PROGRESS"] },
      createdAt: { lt: cutoff },
    },
    data: { status: "FAILED", error: "Timed out — cleaned by cron" },
  });

  return Response.json({ ok: true, cleaned: count });
}
