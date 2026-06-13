import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS, type PlanName } from "@/lib/constants/plan-limits";
import { addDomainToVercelProject, removeDomainFromVercelProject, slugifyProjectName } from "@/lib/vercel";
import { getActiveVercelConnection } from "@server/services/integrations.service";

// Vercel's canonical CNAME target — what a domain should point at when we have
// no live verification records yet. Replaces the old dead "sites.buildrik.app"
// host that nothing ever served.
const VERCEL_CNAME = "cname.vercel-dns.com";

export async function listDomains(siteId: string) {
  return prisma.domain.findMany({
    where: { siteId },
    include: { dnsRecords: true },
  });
}

export async function connectDomain(siteId: string, domain: string) {
  const site = await prisma.site.findUnique({ where: { id: siteId }, select: { workspaceId: true, slug: true, deletedAt: true } });
  if (!site || site.deletedAt) throw new Error("SITE_NOT_FOUND");

  const ws = await prisma.workspace.findUnique({ where: { id: site.workspaceId }, select: { plan: true } });
  const plan = (ws?.plan ?? "FREE") as PlanName;
  const maxDomains = PLAN_LIMITS[plan].customDomains as number;

  if (maxDomains === 0) throw new Error("DOMAIN_LIMIT");

  const currentDomainCount = await prisma.domain.count({ where: { site: { workspaceId: site.workspaceId } } });
  if (maxDomains > 0 && currentDomainCount >= maxDomains) throw new Error("DOMAIN_LIMIT");

  const existing = await prisma.domain.findFirst({ where: { domain } });
  if (existing) throw new Error("DOMAIN_IN_USE");

  const created = await prisma.domain.create({
    data: {
      siteId,
      domain,
      status: "PENDING",
      sslStatus: "PENDING",
    },
  });

  // Attach the domain to the workspace's Vercel project so it actually serves
  // traffic, and use Vercel's real verification records as the DNS instructions.
  // Falls back to the canonical Vercel CNAME if the workspace has no Vercel
  // connection (dev / not yet authed) or the API call fails — the domain stays
  // PENDING and the dns-verify cron can re-attempt.
  let dnsRecords: Array<{ type: string; host: string; value: string }> = [
    { type: "CNAME", host: "@", value: VERCEL_CNAME },
    { type: "CNAME", host: "www", value: VERCEL_CNAME },
  ];

  try {
    const conn = await getActiveVercelConnection(site.workspaceId);
    if (conn) {
      const result = await addDomainToVercelProject({
        token: conn.token,
        teamId: conn.teamId,
        projectName: slugifyProjectName(site.slug),
        domain,
      });
      if (result.verification.length > 0) {
        dnsRecords = result.verification.map((v) => ({
          type: v.type.toUpperCase(),
          host: v.domain,
          value: v.value,
        }));
      }
      if (result.verified) {
        await prisma.domain.update({ where: { id: created.id }, data: { status: "VERIFIED" } });
      }
    }
  } catch (err) {
    // Vercel attach failed — keep the fallback CNAME instructions and leave the
    // domain PENDING (the dns-verify cron re-attempts). Never fail the whole
    // connect on an integration hiccup, but log it so the silent swallow is
    // diagnosable rather than invisible.
    console.error(`[domain] Vercel attach failed for ${domain} (site ${siteId}):`, err);
  }

  await prisma.dnsRecord.createMany({
    data: dnsRecords.map((r) => ({ domainId: created.id, type: r.type, host: r.host, value: r.value })),
  });

  return created;
}

export async function removeDomain(id: string) {
  // Detach from Vercel before dropping our row, otherwise the domain stays
  // attached to the Vercel project as an orphan. Best-effort: a Vercel hiccup
  // must not block the user from removing the domain locally.
  const domain = await prisma.domain.findUnique({
    where: { id },
    select: { domain: true, site: { select: { slug: true, workspaceId: true } } },
  });
  if (domain?.site) {
    try {
      const conn = await getActiveVercelConnection(domain.site.workspaceId);
      if (conn) {
        await removeDomainFromVercelProject({
          token: conn.token,
          teamId: conn.teamId,
          projectName: slugifyProjectName(domain.site.slug),
          domain: domain.domain,
        });
      }
    } catch (err) {
      console.error(`[domain] Vercel detach failed for ${domain.domain}:`, err);
    }
  }
  return prisma.domain.delete({ where: { id } });
}

export async function setPrimaryDomain(id: string, siteId: string) {
  // Scope the promotion to {id, siteId}: a domain id belonging to another site
  // matches zero rows instead of being mutated under this site's authz check.
  return prisma.$transaction(async (tx) => {
    await tx.domain.updateMany({ where: { siteId }, data: { isPrimary: false } });
    const promoted = await tx.domain.updateMany({
      where: { id, siteId },
      data: { isPrimary: true },
    });
    if (promoted.count === 0) throw new Error("DOMAIN_NOT_FOUND");
  });
}
