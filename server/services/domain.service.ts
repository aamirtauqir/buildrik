import dns from "node:dns/promises";
import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS, type PlanName } from "@/lib/constants/plan-limits";
import {
  addDomainToVercelProject,
  getVercelDomainConfig,
  getVercelProjectDomain,
  removeDomainFromVercelProject,
  resolveVercelProjectName,
  VercelApiError,
  type VercelDomainConfig,
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

/** Our own `TXT _buildrick[.<sub>] brk-verify-…` row (not one Vercel issued). */
function isOwnershipTxt(rec: { type: string; host: string }): boolean {
  return rec.type.toUpperCase() === "TXT" && /^_buildrick(\.|$)/i.test(rec.host);
}

/** Does public DNS answer this record with its expected value? */
async function recordAnswers(rec: { type: string; host: string; value: string }, apex: string): Promise<boolean> {
  const fqdn = recordFqdn(rec.host, apex);
  const norm = (v: string) => v.trim().replace(/\.$/, "").toLowerCase();
  try {
    switch (rec.type.toUpperCase()) {
      case "A":
        return (await dns.resolve4(fqdn)).includes(rec.value);
      case "AAAA":
        return (await dns.resolve6(fqdn)).some((a) => norm(a) === norm(rec.value));
      case "CNAME":
        return (await dns.resolveCname(fqdn)).some((a) => norm(a) === norm(rec.value));
      case "TXT":
        // A TXT answer arrives as character-string chunks; the record is one value.
        return (await dns.resolveTxt(fqdn)).some((chunks) => chunks.join("") === rec.value);
      default:
        return false;
    }
  } catch {
    // ENOTFOUND / ENODATA / SERVFAIL are expected while DNS propagates.
    return false;
  }
}

/** Resolve every record, persist each row's `verified`, report any/all. */
async function resolveRecords(records: ReadonlyArray<{ id: string; type: string; host: string; value: string; verified: boolean }>, apex: string) {
  let any = false;
  let all = records.length > 0;
  for (const rec of records) {
    const ok = await recordAnswers(rec, apex);
    any = any || ok;
    all = all && ok;
    if (ok !== rec.verified) await prisma.dnsRecord.update({ where: { id: rec.id }, data: { verified: ok } });
  }
  return { any, all };
}

function sameRecords(a: ReadonlyArray<ExpectedDnsRecord>, b: ReadonlyArray<ExpectedDnsRecord>): boolean {
  const key = (r: ExpectedDnsRecord) => `${r.type.toUpperCase()} ${r.host.toLowerCase()} ${r.value.toLowerCase()}`;
  const ka = a.map(key).sort();
  const kb = b.map(key).sort();
  return ka.length === kb.length && ka.every((k, i) => k === kb[i]);
}

/**
 * The project does not hold the domain (404): the attach at connect time
 * failed, or the domain was removed in Vercel. Attach it again so the check
 * can re-verify it, instead of leaving it FAILED forever (QA D7). A refusal —
 * 409 (another project holds it) or any other error — keeps it unattached,
 * which the caller reads as FAILED.
 */
async function reattachToProject(opts: { token: string; teamId: string | null; projectName: string; domain: string }) {
  try {
    return await addDomainToVercelProject(opts);
  } catch (err) {
    if (!(err instanceof VercelApiError && err.status === 409)) {
      console.error(`[domain] Vercel re-attach failed for ${opts.domain}:`, err);
    }
    return null;
  }
}

/**
 * Re-check one domain (P6 "⟳ Check now" and the dns-verify cron — the ONE
 * implementation; the cron used to carry its own copy of the node:dns match).
 *
 * With a Vercel connection, Vercel decides (owner decision Q7): the project
 * domain's `verified` (ownership on THIS project) and the domain config's
 * `misconfigured` (false = "configured AND we can automatically generate a
 * TLS certificate"). Both good → status VERIFIED and sslStatus ACTIVE —
 * nothing ever set ACTIVE before, so "SSL active" could never show. A domain
 * the project does not hold (404 — e.g. a row an old 409 marked VERIFIED)
 * is FAILED. The required records are re-derived from Vercel's apexName and
 * recommendations, which also repairs rows written with the old apex-only
 * instructions, and surfaces any `verification[]` ownership challenge (a TXT
 * Vercel issues when the domain is claimed elsewhere) as a record to add.
 * Per-record `verified` stays a public-DNS reading, for the records table
 * only — it never decides status here. If Vercel cannot be read, status and
 * SSL are left unchanged.
 *
 * AUTHORIZATION: with a Vercel connection a domain is VERIFIED only when
 * Vercel's project-domain `verified` is true AND config `misconfigured` is
 * false. DNS answering, or `misconfigured: false` alone, is never enough.
 *
 * Without a Vercel connection the resolver decides, and every stored record
 * — our `_buildrick` TXT included — must answer.
 */
export async function checkDomainDns(domainId: string, siteId: string) {
  const domain = await prisma.domain.findUnique({
    where: { id: domainId },
    include: { dnsRecords: true, site: { select: { workspaceId: true, slug: true, vercelProjectName: true } } },
  });
  // Site-bound BEFORE any write: the caller's role was checked on `siteId`,
  // and a domain id from another site used to get its records rewritten
  // before the router noticed the mismatch (audit 2026-09-24).
  if (!domain || domain.siteId !== siteId) return null;

  const conn = await getActiveVercelConnection(domain.site.workspaceId);
  let data: { status: string; sslStatus?: string };

  if (!conn) {
    /* A row written while the workspace had Vercel carries no `_buildrick`
       TXT (Q6), nor does a legacy one; judged on A + CNAME alone it would
       turn VERIFIED with no ownership proof. Give it its TXT first. */
    let records = domain.dnsRecords;
    if (!records.some(isOwnershipTxt)) {
      const ownership = expectedDnsRecords({
        domain: domain.domain,
        apex: apexOf(domain.domain),
        ownershipToken: dnsVerificationToken(domainId),
      }).filter(isOwnershipTxt);
      await prisma.dnsRecord.createMany({ data: ownership.map((r) => ({ domainId, ...r })), skipDuplicates: true });
      records = await prisma.dnsRecord.findMany({ where: { domainId } });
    }
    const { any, all } = await resolveRecords(records, apexOf(domain.domain));
    const status = all ? "VERIFIED" : any ? "PENDING" : "FAILED";
    // SSL is never ACTIVE on a domain that is not VERIFIED.
    data = status === "VERIFIED" ? { status } : { status, sslStatus: "PENDING" };
  } else {
    const projectName = resolveVercelProjectName(domain.site);
    let vercel: { project: Awaited<ReturnType<typeof getVercelProjectDomain>>; config: VercelDomainConfig | null } | null = null;
    try {
      let project = await getVercelProjectDomain({ ...conn, projectName, domain: domain.domain });
      if (!project) project = await reattachToProject({ ...conn, projectName, domain: domain.domain });
      const config = project ? await getVercelDomainConfig({ ...conn, projectName, domain: domain.domain }) : null;
      vercel = { project, config };
    } catch (err) {
      console.error(`[domain] Vercel status read failed for ${domain.domain}:`, err);
    }

    let records = domain.dnsRecords;
    const apex = vercel?.project?.apexName ?? apexOf(domain.domain);
    if (vercel?.project && vercel.config) {
      const expected = instructionsFrom({ domain: domain.domain, attached: vercel.project, config: vercel.config, ownershipToken: null });
      if (!sameRecords(expected, records)) {
        /* Cron + "Check DNS" can run this at once. Delete only rows that are
           stale (by id) and insert only what is missing with skipDuplicates,
           backed by the unique (domainId, type, host, value) index — a
           delete-all + create-all interleaved into doubled rows. */
        const recordKey = (r: ExpectedDnsRecord) => `${r.type}\u0000${r.host}\u0000${r.value}`;
        const wanted = new Set(expected.map(recordKey));
        const held = new Set(records.map(recordKey));
        const stale = records.filter((r) => !wanted.has(recordKey(r)));
        if (stale.length) await prisma.dnsRecord.deleteMany({ where: { domainId, id: { in: stale.map((r) => r.id) } } });
        await prisma.dnsRecord.createMany({
          data: expected.filter((r) => !held.has(recordKey(r))).map((r) => ({ domainId, ...r })),
          skipDuplicates: true,
        });
        records = await prisma.dnsRecord.findMany({ where: { domainId } });
      }
    }

    const { any } = await resolveRecords(
      records.filter((rec) => !isOwnershipTxt(rec)),
      apex,
    );
    if (!vercel) {
      /* Vercel unreadable: we cannot know ownership, so status and SSL are
         left exactly as they were. DNS that answers is NEVER promoted to
         VERIFIED here — pointing records at Vercel proves nothing about who
         owns the domain on this project. */
      return prisma.domain.update({
        where: { id: domainId },
        data: { lastCheckedAt: new Date() },
        include: { dnsRecords: true },
      });
    } else if (!vercel.project) {
      data = { status: "FAILED", sslStatus: "PENDING" };
    } else {
      const configured = vercel.project.verified && vercel.config?.misconfigured === false;
      data = {
        status: configured ? "VERIFIED" : any ? "PENDING" : "FAILED",
        sslStatus: configured ? "ACTIVE" : "PENDING",
      };
    }
  }

  return prisma.domain.update({
    where: { id: domainId },
    data: { ...data, lastCheckedAt: new Date() },
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

/**
 * Whether the site's workspace has a Vercel connection — i.e. whether `connect`
 * will skip our `_buildrick` TXT (Q6), so the Add-a-domain dialog must not draw it.
 */
export async function siteUsesVercel(siteId: string): Promise<boolean> {
  const site = await prisma.site.findUnique({ where: { id: siteId }, select: { workspaceId: true } });
  return site ? (await getActiveVercelConnection(site.workspaceId)) !== null : false;
}

export interface ConnectDomainOptions {
  domain: string;
  kind?: DomainKind;
  dnsProvider?: string;
  forceHttps?: boolean;
}

/**
 * The records a domain's owner must add, apex vs subdomain (shared
 * `expectedDnsRecords`). The apex comes from Vercel's `apexName` and the
 * targets from its domain config (`recommendedIPv4` / `recommendedCNAME`,
 * rank 1) when we have them, else `apexOf` and the static Vercel targets. Any
 * ownership challenge Vercel issued (`verification[]`, a TXT) is added as given.
 */
function instructionsFrom(opts: {
  domain: string;
  attached: { apexName: string | null; verification: Array<{ type: string; domain: string; value: string }> } | null;
  config: Pick<VercelDomainConfig, "recommendedIPv4" | "recommendedCNAME"> | null;
  ownershipToken: string | null;
}): ExpectedDnsRecord[] {
  return [
    ...expectedDnsRecords({
      domain: opts.domain,
      apex: opts.attached?.apexName ?? apexOf(opts.domain),
      ipv4: opts.config?.recommendedIPv4,
      cname: opts.config?.recommendedCNAME,
      ownershipToken: opts.ownershipToken,
    }),
    ...(opts.attached?.verification ?? []).map((v) => ({ type: v.type.toUpperCase(), host: v.domain, value: v.value })),
  ];
}

export async function connectDomain(siteId: string, input: ConnectDomainOptions) {
  // DNS names are case-insensitive and `bella.com.` is `bella.com`; the schema
  // accepts both spellings, so one name is stored — and refused — one way.
  const domain = input.domain.trim().toLowerCase().replace(/\.$/, "");
  const site = await prisma.site.findUnique({ where: { id: siteId }, select: { workspaceId: true, slug: true, vercelProjectName: true, deletedAt: true } });
  if (!site || site.deletedAt) throw new Error("SITE_NOT_FOUND");

  const ws = await prisma.workspace.findUnique({ where: { id: site.workspaceId }, select: { plan: true } });
  const plan = (ws?.plan ?? "FREE") as PlanName;
  const maxDomains = PLAN_LIMITS[plan].customDomains as number;

  if (maxDomains === 0) throw new Error("DOMAIN_LIMIT");

  const currentDomainCount = await prisma.domain.count({ where: { site: { workspaceId: site.workspaceId } } });
  if (maxDomains > 0 && currentDomainCount >= maxDomains) throw new Error("DOMAIN_LIMIT");

  const existing = await prisma.domain.findFirst({ where: { domain: { equals: domain, mode: "insensitive" } } });
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
  let attachedWith: { token: string; teamId: string | null } | null = null;
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
    if (err instanceof VercelApiError && err.status === 409) {
      /* 409 is "already assigned" — to another project, or to OURS (a failed
         detach, a domain added by hand in Vercel). Only the project's own
         read tells them apart. */
      try {
        attached = attachedWith ? await getVercelProjectDomain({ ...attachedWith, projectName, domain }) : null;
      } catch {
        attached = null;
      }
      if (!attached) throw new Error("DOMAIN_ATTACHED_ELSEWHERE");
    } else {
      console.error(`[domain] Vercel attach failed for ${domain} (site ${siteId}):`, err);
    }
  }

  const created = await prisma.domain.create({
    data: {
      siteId,
      domain,
      status: "PENDING",
      sslStatus: "PENDING",
      kind: input.kind ?? "PRIMARY",
      forceHttps: input.forceHttps ?? true,
      dnsProvider: input.dnsProvider ?? null,
    },
  });

  let config: VercelDomainConfig | null = null;
  if (attachedWith) {
    try {
      config = await getVercelDomainConfig({ ...attachedWith, projectName, domain });
    } catch (err) {
      console.error(`[domain] Vercel config read failed for ${domain}:`, err);
    }
  }
  const dnsRecords = instructionsFrom({
    domain,
    attached,
    config,
    // Q6: only the no-Vercel path needs our ownership TXT.
    ownershipToken: attachedWith ? null : dnsVerificationToken(created.id),
  });

  await prisma.dnsRecord.createMany({
    data: dnsRecords.map((r) => ({ domainId: created.id, type: r.type, host: r.host, value: r.value })),
  });

  /* Connected = Vercel holds it on this project AND its config is not
     misconfigured (Q7) — `verified` alone is only ownership. A domain already
     pointed at Vercel is live the moment it is attached. */
  if (attached?.verified && config?.misconfigured === false) {
    await prisma.domain.update({ where: { id: created.id }, data: { status: "VERIFIED", sslStatus: "ACTIVE" } });
  }

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

/**
 * The dns-verify cron's whole job: re-check the domains that are not yet
 * Connected with SSL, oldest check first, through `checkDomainDns` — the same
 * function "Check DNS" runs. The cron route used to carry its own copy of the
 * node:dns match (and its own VERIFIED rule), which is how the two drifted.
 * Capped per run (Vercel's domain endpoints are rate limited); one domain's
 * failure is logged and does not stop the rest.
 */
export async function verifyPendingDomains(limit = 20): Promise<{ checked: number; verified: number }> {
  const due = await prisma.domain.findMany({
    where: { OR: [{ status: { not: "VERIFIED" } }, { sslStatus: { not: "ACTIVE" } }], site: { deletedAt: null } },
    orderBy: [{ lastCheckedAt: { sort: "asc", nulls: "first" } }],
    take: limit,
    select: { id: true, siteId: true },
  });
  let verified = 0;
  for (const d of due) {
    try {
      const result = await checkDomainDns(d.id, d.siteId);
      if (result?.status === "VERIFIED") verified++;
    } catch (err) {
      console.error(`[domain] scheduled DNS check failed for domain ${d.id}:`, err);
    }
  }
  return { checked: due.length, verified };
}
