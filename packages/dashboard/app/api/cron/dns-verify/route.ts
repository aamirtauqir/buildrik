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

  // Normalize for comparison: trim, drop a trailing dot, lowercase.
  const norm = (s: string) => s.trim().replace(/\.$/, "").toLowerCase();

  // Vercel verification records store `host` as an absolute FQDN (e.g.
  // `_vercel.example.com`); the default CNAME records use relative `@`/`www`.
  const toFqdn = (host: string, domain: string) => {
    const h = norm(host);
    if (h === "@" || h === "") return norm(domain);
    if (h === norm(domain) || h.endsWith(`.${norm(domain)}`)) return h;
    return `${h}.${norm(domain)}`;
  };

  for (const record of unverified) {
    const fqdn = toFqdn(record.host, record.domain.domain);
    const expected = norm(record.value);

    let matched = false;
    try {
      // Match the actual DNS answer against THIS record's expected value
      // (was hardcoded to the dead host `sites.buildrik.app`), per record type.
      switch (record.type.toUpperCase()) {
        case "CNAME":
          matched = (await dns.resolveCname(fqdn)).some((r) => norm(r) === expected);
          break;
        case "A":
          matched = (await dns.resolve4(fqdn)).some((r) => norm(r) === expected);
          break;
        case "AAAA":
          matched = (await dns.resolve6(fqdn)).some((r) => norm(r) === expected);
          break;
        case "TXT":
          matched = (await dns.resolveTxt(fqdn)).some((chunks) => norm(chunks.join("")) === expected);
          break;
        default:
          continue; // unsupported record type — leave unverified
      }
    } catch {
      // DNS resolution failures (ENOTFOUND, ENODATA, SERVFAIL) are expected during propagation
      continue;
    }

    if (matched) {
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
