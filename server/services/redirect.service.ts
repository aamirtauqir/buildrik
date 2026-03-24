import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS, type PlanName } from "@/lib/constants/plan-limits";

export async function listRedirects(siteId: string) {
  return prisma.redirect.findMany({
    where: { siteId },
    orderBy: { createdAt: "desc" },
  });
}

export async function createRedirect(
  siteId: string,
  data: { fromPath: string; toUrl: string; type: string },
  plan: PlanName
) {
  const limit = PLAN_LIMITS[plan].urlRedirects as number;

  if (limit !== -1) {
    const count = await prisma.redirect.count({ where: { siteId } });
    if (count >= limit) throw new Error("REDIRECT_LIMIT");
  }

  return prisma.redirect.create({
    data: {
      siteId,
      fromPath: data.fromPath,
      toUrl: data.toUrl,
      type: data.type,
    },
  });
}

export async function updateRedirect(
  id: string,
  data: { fromPath?: string; toUrl?: string; type?: string }
) {
  return prisma.redirect.update({ where: { id }, data });
}

export async function deleteRedirect(id: string) {
  return prisma.redirect.delete({ where: { id } });
}

export async function importRedirects(siteId: string, csv: string, plan: PlanName) {
  const lines = csv.trim().split("\n");
  const rows = lines.slice(1).filter(l => l.trim());
  const data = rows.map(row => {
    const parts = row.split(",").map(s => s.trim());
    return { siteId, fromPath: parts[0], toUrl: parts[1], type: parts[2] === "302" ? "302" : "301" };
  });

  const limit = PLAN_LIMITS[plan].urlRedirects as number;
  if (limit !== -1) {
    const existing = await prisma.redirect.count({ where: { siteId } });
    if (existing + data.length > limit) throw new Error("REDIRECT_LIMIT");
  }

  return prisma.redirect.createMany({ data });
}

export async function exportRedirects(siteId: string): Promise<string> {
  const redirects = await prisma.redirect.findMany({ where: { siteId }, orderBy: { createdAt: "asc" } });
  const header = "from,to,type";
  const rows = redirects.map(r => `${r.fromPath},${r.toUrl},${r.type}`);
  return [header, ...rows].join("\n");
}
