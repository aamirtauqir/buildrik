import { prisma } from "@/lib/prisma";
import { csvCell } from "@/lib/utils";
import { PLAN_LIMITS, type PlanName } from "@/lib/constants/plan-limits";

const IMPORT_MAX_ROWS = 1000;

export async function listRedirects(siteId: string) {
  return prisma.redirect.findMany({
    where: { siteId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * One rule per source path. Two rows with the same `fromPath` would ship two
 * `vercel.json` redirects for one request, and only the first would ever
 * fire — so the second is refused (REDIRECT_EXISTS) rather than stored.
 * There is no unique index behind this (S3 added only the two columns), so
 * the check is here, on create and on a rename.
 */
async function assertFromPathFree(siteId: string, fromPath: string, exceptId?: string) {
  const clash = await prisma.redirect.findFirst({
    where: { siteId, fromPath, ...(exceptId ? { id: { not: exceptId } } : {}) },
    select: { id: true },
  });
  if (clash) throw new Error("REDIRECT_EXISTS");
}

export async function createRedirect(
  siteId: string,
  data: { fromPath: string; toUrl: string; type: string; matchQuery?: boolean; notes?: string | null },
  plan: PlanName
) {
  const limit = PLAN_LIMITS[plan].urlRedirects as number;

  if (limit !== -1) {
    const count = await prisma.redirect.count({ where: { siteId } });
    if (count >= limit) throw new Error("REDIRECT_LIMIT");
  }
  await assertFromPathFree(siteId, data.fromPath);

  return prisma.redirect.create({
    data: {
      siteId,
      fromPath: data.fromPath,
      toUrl: data.toUrl,
      type: data.type,
      matchQuery: data.matchQuery ?? false,
      notes: data.notes ?? null,
    },
  });
}

export async function updateRedirect(
  id: string,
  siteId: string,
  data: { fromPath?: string; toUrl?: string; type?: string; matchQuery?: boolean; notes?: string | null }
) {
  if (data.fromPath !== undefined) await assertFromPathFree(siteId, data.fromPath, id);
  return prisma.redirect.update({ where: { id }, data });
}

export async function deleteRedirect(id: string) {
  return prisma.redirect.delete({ where: { id } });
}

export async function importRedirects(siteId: string, csv: string, plan: PlanName) {
  const lines = csv.trim().split(/\r?\n/);
  const rows = lines.slice(1).filter((l) => l.trim());
  if (rows.length > IMPORT_MAX_ROWS) throw new Error("CSV_TOO_LARGE");

  // The naive split previously shipped whatever the file contained straight
  // to createMany — a short row produced undefined fromPath/toUrl and the
  // NOT NULL constraint aborted mid-batch. Validate every row up front and
  // report the first bad line (1-based, +1 for the header).
  const data = rows.map((row, idx) => {
    // Accept both bare and quoted cells (our own export quotes per RFC 4180).
    const unquote = (s: string) =>
      s.startsWith('"') && s.endsWith('"') && s.length >= 2
        ? s.slice(1, -1).replace(/""/g, '"')
        : s;
    const parts = row.split(",").map((s) => unquote(s.trim()));
    const [fromPath, toUrl] = parts;
    if (!fromPath || !fromPath.startsWith("/") || !toUrl) {
      throw new Error(`INVALID_CSV_ROW:${idx + 2}`);
    }
    return { siteId, fromPath, toUrl, type: parts[2] === "302" ? "302" : "301" };
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
  // fromPath/toUrl are user input — csvCell neutralizes formula payloads.
  const rows = redirects.map((r) => [r.fromPath, r.toUrl, r.type].map(csvCell).join(","));
  return [header, ...rows].join("\n");
}
