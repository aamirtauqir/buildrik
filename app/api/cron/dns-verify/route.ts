import { type NextRequest } from "next/server";
import { promises as dns } from "dns";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const unverified = await prisma.dnsRecord.findMany({
    where: { verified: false },
    take: 50,
    include: { domain: { select: { domain: true } } },
  });

  let verified = 0;

  for (const record of unverified) {
    if (record.type !== "CNAME") continue;

    const hostname =
      record.host === "@"
        ? record.domain.domain
        : `${record.host}.${record.domain.domain}`;

    let results: string[];
    try {
      results = await dns.resolve(hostname, "CNAME");
    } catch {
      // DNS resolution failures (ENOTFOUND, ENODATA, SERVFAIL) are expected during propagation
      continue;
    }

    if (results.some((r) => r === "sites.buildrik.app")) {
      await prisma.dnsRecord.update({
        where: { id: record.id },
        data: { verified: true },
      });
      verified++;

      const remaining = await prisma.dnsRecord.count({
        where: { domainId: record.domainId, verified: false },
      });
      if (remaining === 0) {
        await prisma.domain.update({
          where: { id: record.domainId },
          data: { status: "VERIFIED", lastCheckedAt: new Date() },
        });
      }
    }
  }

  return Response.json({ ok: true, verified });
}
