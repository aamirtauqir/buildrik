import { prisma } from "@/lib/prisma";

export async function listDomains(siteId: string) {
  return prisma.domain.findMany({
    where: { siteId },
    include: { dnsRecords: true },
  });
}

export async function connectDomain(siteId: string, domain: string) {
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

export async function removeDomain(id: string) {
  return prisma.domain.delete({ where: { id } });
}
