import { prisma } from "@/lib/prisma";
import { csvCell } from "@/lib/utils";
import { PLAN_LIMITS, type PlanName } from "@/lib/constants/plan-limits";
import { createRedirectSchema } from "@buildrik/shared/schemas/site-detail";

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

/**
 * BE-7: a CSV of `from,to[,301|302]` rows under a header line. Every row goes
 * through `createRedirectSchema` — the same rule as the Add-redirect dialog, so
 * a `javascript:` target or a bare `new-page` (which fails the whole publish
 * in `vercel.json`) is refused here too — and a `from` that already has a rule,
 * on the site or earlier in the file, is refused as a duplicate. All or
 * nothing: the first bad line throws (1-based, the header is line 1) and no
 * row is written.
 *
 * @throws INVALID_CSV_ROW:<line> · DUPLICATE_CSV_ROW:<line>:<fromPath> · CSV_TOO_LARGE · REDIRECT_LIMIT
 */
export async function importRedirects(siteId: string, csv: string, plan: PlanName): Promise<{ created: number }> {
  const lines = csv.trim().split(/\r?\n/);
  const rows = lines
    .slice(1)
    .map((text, idx) => ({ text, line: idx + 2 }))
    .filter((row) => row.text.trim());
  if (rows.length > IMPORT_MAX_ROWS) throw new Error("CSV_TOO_LARGE");

  // Accept both bare and quoted cells (our own export quotes per RFC 4180).
  const unquote = (cell: string) =>
    cell.startsWith('"') && cell.endsWith('"') && cell.length >= 2 ? cell.slice(1, -1).replace(/""/g, '"') : cell;

  const data = rows.map(({ text, line }) => {
    const [fromPath = "", toUrl = "", type = "301"] = text.split(",").map((cell) => unquote(cell.trim()));
    const parsed = createRedirectSchema.safeParse({ siteId, fromPath, toUrl, type: type || "301" });
    if (!parsed.success) throw new Error(`INVALID_CSV_ROW:${line}`);
    const { fromPath: from, toUrl: to, type: kind } = parsed.data;
    return { line, data: { siteId, fromPath: from, toUrl: to, type: kind } };
  });

  return prisma.$transaction(async (tx) => {
    const existing = await tx.redirect.findMany({ where: { siteId }, select: { fromPath: true } });
    const taken = new Set(existing.map((r) => r.fromPath));
    for (const row of data) {
      if (taken.has(row.data.fromPath)) throw new Error(`DUPLICATE_CSV_ROW:${row.line}:${row.data.fromPath}`);
      taken.add(row.data.fromPath);
    }

    const limit = PLAN_LIMITS[plan].urlRedirects as number;
    if (limit !== -1 && existing.length + data.length > limit) throw new Error("REDIRECT_LIMIT");

    const { count } = await tx.redirect.createMany({ data: data.map((row) => row.data) });
    return { created: count };
  });
}

export async function exportRedirects(siteId: string): Promise<string> {
  const redirects = await prisma.redirect.findMany({ where: { siteId }, orderBy: { createdAt: "asc" } });
  const header = "from,to,type";
  // fromPath/toUrl are user input — csvCell neutralizes formula payloads.
  const rows = redirects.map((r) => [r.fromPath, r.toUrl, r.type].map(csvCell).join(","));
  return [header, ...rows].join("\n");
}
