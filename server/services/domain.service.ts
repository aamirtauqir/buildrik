import dns from "node:dns/promises";
import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS, type PlanName } from "@/lib/constants/plan-limits";
import {
  addDomainToVercelProject,
  getVercelDomainConfig,
  removeDomainFromVercelProject,
  resolveVercelProjectName,
  VercelApiError,
} from "@/lib/vercel";
import { getActiveVercelConnection } from "@server/services/integrations.service";
import { siteScopeWhere } from "@/server/services/permission.service";
import { domainNameSchema, type DomainAvailability, type DomainKind } from "@buildrik/shared/schemas/site-detail";
import { apexOf, expectedDnsRecords, recordFqdn, type ExpectedDnsRecord } from "@buildrik/shared/dns/records";

/**
 * The `TXT _buildrick brk-verify-…` record the Add-a-domain dialog draws
 * (Clone 3737:43669). Derived from the row id, so it is stable across reads
 * without a column of its own; it proves the person editing the zone is the
 * one who connected the domain here, nothing more.
 */
export function dnsVerificationToken(domainId: string): string {
  return `brk-verify-${createHash("sha256").update(domainId).digest("hex").slice(0, 16)}`;
}

/**
 * Re-check a domain's DNS against its expected records (P6 "⟳ Check now",
 * Figma Domains boards). Resolves A/CNAME/TXT live via node:dns, marks each
 * DnsRecord verified, and flips Domain.status PENDING → VERIFIED when every
 * record answers (FAILED when none do after a lookup). SSL issuance stays
 * with the deploy pipeline — status VERIFIED + sslStatus PENDING is the
 * "issuing certificate" board state.
 */
export async function checkDomainDns(domainId: string, siteId: string) {
  const domain = await prisma.domain.findUnique({
    where: { id: domainId },
    include: { dnsRecords: true },
  });
  // Site-bound BEFORE any write: the caller's role was checked on `siteId`,
  // and a domain id from another site used to get its records rewritten
  // before the router noticed the mismatch (audit 2026-09-24).
  if (!domain || domain.siteId !== siteId) return null;

  let anyVerified = false;
  let allVerified = domain.dnsRecords.length > 0;
  for (const rec of domain.dnsRecords) {
    const fqdn = recordFqdn(rec.host, apexOf(domain.domain));
    let ok = false;
    try {
      if (rec.type.toUpperCase() === "A") {
        const answers = await dns.resolve4(fqdn);
        ok = answers.includes(rec.value);
      } else if (rec.type.toUpperCase() === "CNAME") {
        const answers = await dns.resolveCname(fqdn);
        ok = answers.some((a) => a.replace(/\.$/, "") === rec.value.replace(/\.$/, ""));
      } else if (rec.type.toUpperCase() === "TXT") {
        // A TXT answer arrives as character-string chunks; the record is one value.
        const answers = await dns.resolveTxt(fqdn);
        ok = answers.some((chunks) => chunks.join("") === rec.value);
      }
    } catch {
      ok = false;
    }
    anyVerified = anyVerified || ok;
    allVerified = allVerified && ok;
    if (ok !== rec.verified) {
      await prisma.dnsRecord.update({ where: { id: rec.id }, data: { verified: ok } });
    }
  }

  const status = allVerified ? "VERIFIED" : anyVerified ? "PENDING" : "FAILED";
  return prisma.domain.update({
    where: { id: domainId },
    data: { status, lastCheckedAt: new Date() },
    include: { dnsRecords: true },
  });
}

// Primary first (one Custom-domain card per domain, Clone 3397:32206); records
// by type so the DNS table reads A · CNAME · TXT like the frame.
export async function listDomains(siteId: string) {
  return prisma.domain.findMany({
    where: { siteId },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
    include: { dnsRecords: { orderBy: { type: "asc" } } },
  });
}

/**
 * The Add-a-domain dialog's `Available` / `Already connected` tag. Availability
 * here means "no site in this database has it" — `Domain.domain` compared
 * case-insensitively (DNS names are). Whether the registrar has it for sale is
 * an external lookup this deliberately does not make.
 */
export async function checkDomainAvailability(domain: string): Promise<DomainAvailability> {
  const parsed = domainNameSchema.safeParse(domain.trim());
  if (!parsed.success) return { available: false, reason: "invalid" };
  const taken = await prisma.domain.findFirst({
    where: { domain: { equals: parsed.data.replace(/\.$/, ""), mode: "insensitive" } },
    select: { id: true },
  });
  return taken ? { available: false, reason: "connected" } : { available: true };
}

/** The card's Force HTTPS toggle. Stored only — see the publish note in phase2-backend.md. */
export async function updateDomain(id: string, data: { forceHttps: boolean }) {
  return prisma.domain.update({
    where: { id },
    data,
    include: { dnsRecords: { orderBy: { type: "asc" } } },
  });
}

export interface WorkspaceDomainRow {
  id: string;
  domain: string;
  status: string;
  sslStatus: string;
  isPrimary: boolean;
  siteId: string;
  siteName: string;
}

// Cross-site domains monitor (prototype 15-domains): every custom domain in the
// workspace with its site, status, and SSL — the agency "all domains at once" view.
export async function listWorkspaceDomains(workspaceId: string, userId: string): Promise<WorkspaceDomainRow[]> {
  // S-9: a member scoped to specific sites must never see another site's
  // domain in this cross-site monitor.
  const scope = await siteScopeWhere(prisma, userId, workspaceId);
  const rows = await prisma.domain.findMany({
    where: { site: { workspaceId, deletedAt: null, ...scope } },
    orderBy: [{ status: "asc" }, { domain: "asc" }],
    select: {
      id: true,
      domain: true,
      status: true,
      sslStatus: true,
      isPrimary: true,
      siteId: true,
      site: { select: { name: true } },
    },
  });
  return rows.map(({ site, ...r }) => ({ ...r, siteName: site.name }));
}

export interface ConnectDomainOptions {
  domain: string;
  kind?: DomainKind;
  dnsProvider?: string;
  forceHttps?: boolean;
}

type VercelConnection = { token: string; teamId: string | null };

/**
 * The records a domain's owner must add, apex vs subdomain (shared
 * `expectedDnsRecords`). With a Vercel connection the apex comes from
 * Vercel's `apexName` and the targets from its domain config
 * (`recommendedIPv4` / `recommendedCNAME`, rank 1); without one, or when the
 * config read fails, the static Vercel targets and `apexOf`. Any ownership
 * challenge Vercel issued (`verification[]`, a TXT) is added as given.
 */
async function instructionsFor(opts: {
  domain: string;
  projectName: string;
  conn: VercelConnection | null;
  attached: { apexName: string | null; verification: Array<{ type: string; domain: string; value: string }> } | null;
  ownershipToken: string | null;
}): Promise<ExpectedDnsRecord[]> {
  let config: { recommendedIPv4: string | null; recommendedCNAME: string | null } | null = null;
  if (opts.conn) {
    try {
      config = await getVercelDomainConfig({ ...opts.conn, projectName: opts.projectName, domain: opts.domain });
    } catch (err) {
      console.error(`[domain] Vercel config read failed for ${opts.domain}:`, err);
    }
  }
  return [
    ...expectedDnsRecords({
      domain: opts.domain,
      apex: opts.attached?.apexName ?? apexOf(opts.domain),
      ipv4: config?.recommendedIPv4,
      cname: config?.recommendedCNAME,
      ownershipToken: opts.ownershipToken,
    }),
    ...(opts.attached?.verification ?? []).map((v) => ({ type: v.type.toUpperCase(), host: v.domain, value: v.value })),
  ];
}

export async function connectDomain(siteId: string, input: ConnectDomainOptions) {
  const { domain } = input;
  const site = await prisma.site.findUnique({ where: { id: siteId }, select: { workspaceId: true, slug: true, vercelProjectName: true, deletedAt: true } });
  if (!site || site.deletedAt) throw new Error("SITE_NOT_FOUND");

  const ws = await prisma.workspace.findUnique({ where: { id: site.workspaceId }, select: { plan: true } });
  const plan = (ws?.plan ?? "FREE") as PlanName;
  const maxDomains = PLAN_LIMITS[plan].customDomains as number;

  if (maxDomains === 0) throw new Error("DOMAIN_LIMIT");

  const currentDomainCount = await prisma.domain.count({ where: { site: { workspaceId: site.workspaceId } } });
  if (maxDomains > 0 && currentDomainCount >= maxDomains) throw new Error("DOMAIN_LIMIT");

  const existing = await prisma.domain.findFirst({ where: { domain } });
  if (existing) throw new Error("DOMAIN_IN_USE");

  // The domain lives on this project from now on — pin it, so a slug change
  // before the first publish can't move the site to a project without it.
  const projectName = resolveVercelProjectName(site);
  if (!site.vercelProjectName) {
    try {
      await prisma.site.update({ where: { id: siteId }, data: { vercelProjectName: projectName } });
    } catch (e: unknown) {
      // Another site is pinned to the name this slug derives (legacy slug reuse).
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002" &&
        String(e.meta?.target ?? "").includes("vercelProjectName")
      ) {
        throw new Error("PROJECT_NAME_TAKEN");
      }
      throw e;
    }
  }

  /* Attach first, so a domain Vercel refuses never becomes a row here. A 409
     means the domain is assigned to ANOTHER Vercel project (docs: "add a
     domain to a project"); it used to be read as verified, so the domain
     showed Connected while it served someone else's site. Any other failure
     is an integration hiccup: keep the fallback instructions, leave the domain
     PENDING, and let the dns-verify cron re-check — but log it. */
  let attached: Awaited<ReturnType<typeof addDomainToVercelProject>> | null = null;
  let attachedWith: VercelConnection | null = null;
  try {
    const conn = await getActiveVercelConnection(site.workspaceId);
    if (conn) {
      attachedWith = conn;
      attached = await addDomainToVercelProject({
        token: conn.token,
        teamId: conn.teamId,
        projectName,
        domain,
      });
    }
  } catch (err) {
    if (err instanceof VercelApiError && err.status === 409) throw new Error("DOMAIN_ATTACHED_ELSEWHERE");
    console.error(`[domain] Vercel attach failed for ${domain} (site ${siteId}):`, err);
  }

  const created = await prisma.domain.create({
    data: {
      siteId,
      domain,
      status: attached?.verified ? "VERIFIED" : "PENDING",
      sslStatus: "PENDING",
      kind: input.kind ?? "PRIMARY",
      forceHttps: input.forceHttps ?? true,
      dnsProvider: input.dnsProvider ?? null,
    },
  });

  const dnsRecords = await instructionsFor({
    domain,
    projectName,
    conn: attachedWith,
    attached,
    ownershipToken: dnsVerificationToken(created.id),
  });

  await prisma.dnsRecord.createMany({
    data: dnsRecords.map((r) => ({ domainId: created.id, type: r.type, host: r.host, value: r.value })),
  });

  // The dialog shows the provider's expected shape before and the REAL rows
  // after — so the answer carries the records just written, not the bare row.
  return prisma.domain.findUniqueOrThrow({
    where: { id: created.id },
    include: { dnsRecords: { orderBy: { type: "asc" } } },
  });
}

export async function removeDomain(id: string) {
  // Detach from Vercel before dropping our row, otherwise the domain stays
  // attached to the Vercel project as an orphan. Best-effort: a Vercel hiccup
  // must not block the user from removing the domain locally.
  const domain = await prisma.domain.findUnique({
    where: { id },
    select: { domain: true, site: { select: { slug: true, vercelProjectName: true, workspaceId: true } } },
  });
  if (domain?.site) {
    try {
      const conn = await getActiveVercelConnection(domain.site.workspaceId);
      if (conn) {
        await removeDomainFromVercelProject({
          token: conn.token,
          teamId: conn.teamId,
          projectName: resolveVercelProjectName(domain.site),
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
    const target = await tx.domain.findFirst({ where: { id, siteId }, select: { status: true } });
    if (!target) throw new Error("DOMAIN_NOT_FOUND");
    // Only a VERIFIED domain can be primary — the publish worker ignores an
    // unverified primary, so promoting a PENDING one was a silent no-op at
    // publish with no explanation.
    if (target.status !== "VERIFIED") throw new Error("DOMAIN_NOT_VERIFIED");
    await tx.domain.updateMany({ where: { siteId }, data: { isPrimary: false } });
    await tx.domain.update({ where: { id }, data: { isPrimary: true } });
  });
}
