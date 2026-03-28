import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS, type PlanName } from "@/lib/constants/plan-limits";

export async function listDomains(siteId: string) {
  return prisma.domain.findMany({
    where: { siteId },
    include: { dnsRecords: true },
  });
}

export async function connectDomain(siteId: string, domain: string) {
  const site = await prisma.site.findUnique({ where: { id: siteId }, select: { workspaceId: true } });
  if (!site) throw new Error("SITE_NOT_FOUND");

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

  await prisma.dnsRecord.createMany({
    data: [
      { domainId: created.id, type: "CNAME", host: "@", value: "sites.buildrik.app" },
      { domainId: created.id, type: "CNAME", host: "www", value: "sites.buildrik.app" },
    ],
  });

  return created;
}

export async function removeDomain(id: string, siteId: string) {
  return prisma.domain.deleteMany({ where: { id, siteId } });
}

export async function setPrimaryDomain(id: string, siteId: string) {
  return prisma.$transaction([
    prisma.domain.updateMany({ where: { siteId }, data: { isPrimary: false } }),
    prisma.domain.update({ where: { id }, data: { isPrimary: true } }),
  ]);
}
