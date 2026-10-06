/**
 * domain.service — Settings · Clone S2 (Domains 3397:32206, Add a domain
 * 3737:43669).
 *
 * `connect` stores the dialog's type / provider / Force HTTPS and, without a
 * Vercel attachment, writes the three records the dialog draws (apex A, `www`
 * CNAME, `_buildrick` TXT); `checkAvailability` is the dialog's tag; `update`
 * is the card's toggle; `check` now resolves TXT so the `_buildrick` row can
 * leave PENDING. Prisma is mocked; DNS is spied on the promises API the
 * service imports.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { promises as dnsPromises } from "dns";
import { Prisma } from "@prisma/client";

const { db, vercelConnection } = vi.hoisted(() => ({
  db: {
    site: { findUnique: vi.fn(), update: vi.fn() },
    workspace: { findUnique: vi.fn() },
    domain: {
      count: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
    dnsRecord: { createMany: vi.fn(), create: vi.fn(), update: vi.fn(), deleteMany: vi.fn(), findMany: vi.fn() },
  },
  vercelConnection: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma: db }));
vi.mock("@server/services/integrations.service", () => ({
  getActiveVercelConnection: (...a: unknown[]) => vercelConnection(...a),
}));
vi.mock("@/lib/vercel", async () => ({
  VercelApiError: (await vi.importActual<typeof import("@/lib/vercel")>("@/lib/vercel")).VercelApiError,
  addDomainToVercelProject: vi.fn(),
  getVercelDomainConfig: vi.fn(),
  getVercelProjectDomain: vi.fn(),
  removeDomainFromVercelProject: vi.fn(),
  resolveVercelProjectName: (site: { slug: string; vercelProjectName: string | null }) =>
    site.vercelProjectName ?? site.slug,
}));

import { addDomainToVercelProject, getVercelDomainConfig, getVercelProjectDomain, VercelApiError } from "@/lib/vercel";
import {
  connectDomain,
  checkDomainAvailability,
  updateDomain,
  checkDomainDns,
  dnsVerificationToken,
  verifyPendingDomains,
} from "@server/services/domain.service";

beforeEach(() => {
  vi.restoreAllMocks();
  Object.values(db).forEach((model) =>
    Object.values(model).forEach((fn) => (fn as ReturnType<typeof vi.fn>).mockReset()),
  );
  vercelConnection.mockReset().mockResolvedValue(null);
  [addDomainToVercelProject, getVercelDomainConfig, getVercelProjectDomain].forEach((fn) => vi.mocked(fn).mockReset());
});

describe("dnsVerificationToken", () => {
  it("is stable for a row id and differs between rows, in the frame's brk-verify- shape", () => {
    expect(dnsVerificationToken("sclone-domain")).toBe(dnsVerificationToken("sclone-domain"));
    expect(dnsVerificationToken("sclone-domain")).toMatch(/^brk-verify-[0-9a-f]{16}$/);
    expect(dnsVerificationToken("other")).not.toBe(dnsVerificationToken("sclone-domain"));
  });
});

describe("connectDomain — the Add-a-domain dialog", () => {
  function connectable() {
    db.site.findUnique.mockResolvedValue({ workspaceId: "ws1", slug: "bella", vercelProjectName: null, deletedAt: null });
    db.workspace.findUnique.mockResolvedValue({ plan: "PRO" });
    db.domain.count.mockResolvedValue(0);
    db.domain.findFirst.mockResolvedValue(null);
    db.domain.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ id: "dom1", ...data }));
    db.dnsRecord.createMany.mockResolvedValue({ count: 3 });
    db.domain.findUniqueOrThrow.mockImplementation(async () => ({ id: "dom1", dnsRecords: [{ type: "A" }] }));
  }

  /* SA-06: a site whose slug changed after it went live keeps deploying to its
     pinned project — the domain has to attach to that one, not to a project
     derived from the new slug that holds no deployment. */
  it("attaches the domain to the site's pinned Vercel project, not one derived from the slug", async () => {
    connectable();
    db.site.findUnique.mockResolvedValue({ workspaceId: "ws1", slug: "bella-new", vercelProjectName: "buildrik-site-bella", deletedAt: null });
    vercelConnection.mockResolvedValue({ token: "t", teamId: null });
    vi.mocked(addDomainToVercelProject).mockResolvedValue({ verified: false, verification: [] } as never);

    await connectDomain("s1", { domain: "bellacucina.com" });

    expect(addDomainToVercelProject).toHaveBeenCalledWith(
      expect.objectContaining({ projectName: "buildrik-site-bella", domain: "bellacucina.com" }),
    );
  });

  /* C1: a domain is attached to the project the slug derives. If the slug then
     changed before the first publish, the publish would derive a new project
     and the domain would be left on the old one. Pin at connect time. */
  it("pins the resolved project name on a never-pinned site when a domain is connected", async () => {
    connectable();

    await connectDomain("s1", { domain: "bellacucina.com" });

    expect(db.site.update).toHaveBeenCalledWith({ where: { id: "s1" }, data: { vercelProjectName: "bella" } });
  });

  it("maps a P2002 on vercelProjectName at the pin to PROJECT_NAME_TAKEN and creates no domain", async () => {
    connectable();
    db.site.update.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed on the fields: (`vercelProjectName`)", {
        code: "P2002",
        clientVersion: "5",
        meta: { target: ["vercelProjectName"] },
      }),
    );

    await expect(connectDomain("s1", { domain: "bellacucina.com" })).rejects.toThrow("PROJECT_NAME_TAKEN");
    expect(db.domain.create).not.toHaveBeenCalled();
  });

  it("does not re-pin a site that already has a project name", async () => {
    connectable();
    db.site.findUnique.mockResolvedValue({ workspaceId: "ws1", slug: "bella-new", vercelProjectName: "buildrik-site-bella", deletedAt: null });

    await connectDomain("s1", { domain: "bellacucina.com" });

    expect(db.site.update).not.toHaveBeenCalled();
  });

  it("stores kind, provider and Force HTTPS, and writes A + CNAME + TXT without a Vercel attachment", async () => {
    connectable();

    const result = await connectDomain("s1", {
      domain: "bellacucina.com",
      kind: "REDIRECT",
      dnsProvider: "namecheap",
      forceHttps: false,
    });

    expect(db.domain.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        siteId: "s1",
        domain: "bellacucina.com",
        kind: "REDIRECT",
        dnsProvider: "namecheap",
        forceHttps: false,
      }),
    });
    expect(db.dnsRecord.createMany).toHaveBeenCalledWith({
      data: [
        { domainId: "dom1", type: "A", host: "@", value: "76.76.21.21" },
        { domainId: "dom1", type: "CNAME", host: "www", value: "cname.vercel-dns.com" },
        { domainId: "dom1", type: "TXT", host: "_buildrick", value: dnsVerificationToken("dom1") },
      ],
    });
    // The answer carries the records just written — the dialog shows the real rows after.
    expect(result.dnsRecords).toEqual([{ type: "A" }]);
  });

  /* A subdomain used to get the apex pair (A @, CNAME www), which in the
     parent zone points the parent and www.<parent> — never the subdomain. */
  it("a subdomain gets one CNAME on itself (plus its own TXT) without a Vercel attachment", async () => {
    connectable();
    await connectDomain("s1", { domain: "shop.bellacucina.com", kind: "SUBDOMAIN" });
    expect(db.dnsRecord.createMany).toHaveBeenCalledWith({
      data: [
        { domainId: "dom1", type: "CNAME", host: "shop", value: "cname.vercel-dns.com" },
        { domainId: "dom1", type: "TXT", host: "_buildrick.shop", value: dnsVerificationToken("dom1") },
      ],
    });
  });

  /* Fixtures from the documented shapes: POST /v10/projects/{p}/domains 200
     (apexName, verified, verification[]) and GET /v6/domains/{d}/config 200
     (recommendedCNAME / recommendedIPv4, rank 1 preferred). */
  it("with Vercel, a subdomain's CNAME target comes from the config endpoint's rank-1 recommendedCNAME", async () => {
    connectable();
    vercelConnection.mockResolvedValue({ token: "t", teamId: "team_1" });
    vi.mocked(addDomainToVercelProject).mockResolvedValue({
      name: "shop.bellacucina.com",
      apexName: "bellacucina.com",
      verified: true,
      verification: [],
    });
    vi.mocked(getVercelDomainConfig).mockResolvedValue({
      misconfigured: true,
      recommendedIPv4: "216.198.79.1",
      recommendedCNAME: "d1a2b3c4.vercel-dns-017.com",
    });

    await connectDomain("s1", { domain: "shop.bellacucina.com" });

    expect(getVercelDomainConfig).toHaveBeenCalledWith({ token: "t", teamId: "team_1", projectName: "bella", domain: "shop.bellacucina.com" });
    const written = vi.mocked(db.dnsRecord.createMany).mock.calls[0][0].data as Array<{ type: string; host: string; value: string }>;
    expect(written.filter((r) => r.type !== "TXT")).toEqual([
      { domainId: "dom1", type: "CNAME", host: "shop", value: "d1a2b3c4.vercel-dns-017.com" },
    ]);
  });

  it("with Vercel, an apex keeps A @ (rank-1 recommendedIPv4) + CNAME www", async () => {
    connectable();
    vercelConnection.mockResolvedValue({ token: "t", teamId: null });
    vi.mocked(addDomainToVercelProject).mockResolvedValue({
      name: "bellacucina.com",
      apexName: "bellacucina.com",
      verified: true,
      verification: [],
    });
    vi.mocked(getVercelDomainConfig).mockResolvedValue({
      misconfigured: true,
      recommendedIPv4: "216.198.79.1",
      recommendedCNAME: "d1a2b3c4.vercel-dns-017.com",
    });

    await connectDomain("s1", { domain: "bellacucina.com" });

    const written = vi.mocked(db.dnsRecord.createMany).mock.calls[0][0].data as Array<{ type: string; host: string; value: string }>;
    expect(written.filter((r) => r.type !== "TXT")).toEqual([
      { domainId: "dom1", type: "A", host: "@", value: "216.198.79.1" },
      { domainId: "dom1", type: "CNAME", host: "www", value: "d1a2b3c4.vercel-dns-017.com" },
    ]);
  });

  it("with a Vercel connection, writes no _buildrick TXT (owner decision Q6)", async () => {
    connectable();
    vercelConnection.mockResolvedValue({ token: "t", teamId: null });
    vi.mocked(addDomainToVercelProject).mockResolvedValue({ name: "bellacucina.com", apexName: "bellacucina.com", verified: true, verification: [] });

    await connectDomain("s1", { domain: "bellacucina.com" });

    const written = vi.mocked(db.dnsRecord.createMany).mock.calls[0][0].data as Array<{ type: string }>;
    expect(written.map((r) => r.type)).toEqual(["A", "CNAME"]);
  });

  it("defaults to PRIMARY · https on · no provider when the dialog sends only a name", async () => {
    connectable();
    await connectDomain("s1", { domain: "bellacucina.com" });
    expect(db.domain.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ kind: "PRIMARY", forceHttps: true, dnsProvider: null }),
    });
  });

  /* A Vercel 409 = the domain is assigned to another Vercel project. It used
     to come back as verified: true and the row was written VERIFIED, so the
     card read "Connected" for a domain serving someone else's site. */
  it("refuses a domain Vercel says is on another project (409): DOMAIN_ATTACHED_ELSEWHERE, no row, never VERIFIED", async () => {
    connectable();
    vercelConnection.mockResolvedValue({ token: "t", teamId: null });
    vi.mocked(addDomainToVercelProject).mockRejectedValue(
      new VercelApiError(409, "domain_already_in_use", "The domain is already assigned to another Vercel project"),
    );

    await expect(connectDomain("s1", { domain: "bellacucina.com" })).rejects.toThrow("DOMAIN_ATTACHED_ELSEWHERE");
    expect(db.domain.create).not.toHaveBeenCalled();
    expect(db.domain.update).not.toHaveBeenCalled();
    expect(db.dnsRecord.createMany).not.toHaveBeenCalled();
  });

  /* A 409 is also what Vercel says when OUR project already holds the domain
     (a best-effort detach that failed, or a hand-added domain). */
  it("a 409 for a domain already on this site's own project is treated as attached, not refused", async () => {
    connectable();
    vercelConnection.mockResolvedValue({ token: "t", teamId: null });
    vi.mocked(addDomainToVercelProject).mockRejectedValue(new VercelApiError(409, "domain_already_in_use", "in use"));
    vi.mocked(getVercelProjectDomain).mockResolvedValue({ name: "bellacucina.com", apexName: "bellacucina.com", verified: true, verification: [] });
    vi.mocked(getVercelDomainConfig).mockResolvedValue({ misconfigured: true, recommendedIPv4: null, recommendedCNAME: null });

    await expect(connectDomain("s1", { domain: "bellacucina.com" })).resolves.toBeDefined();
    expect(getVercelProjectDomain).toHaveBeenCalledWith(expect.objectContaining({ projectName: "bella", domain: "bellacucina.com" }));
    expect(db.domain.create).toHaveBeenCalled();
  });

  it("still refuses a hostname another site holds", async () => {
    connectable();
    db.domain.findFirst.mockResolvedValue({ id: "elsewhere" });
    await expect(connectDomain("s1", { domain: "bellacucina.com" })).rejects.toThrow("DOMAIN_IN_USE");
    expect(db.domain.create).not.toHaveBeenCalled();
  });

  /* QA 2026-10-05: the schema accepts `Bella.COM` and `bella.com.`, and the
     in-use check was an exact match — so a case or trailing-dot variant of a
     domain another site holds got its own row and its own Vercel attach. DNS
     names are case-insensitive; one name is one row. */
  it("stores the name lowercased without a trailing dot, and checks in-use case-insensitively", async () => {
    connectable();
    vercelConnection.mockResolvedValue({ token: "t", teamId: null });
    vi.mocked(addDomainToVercelProject).mockResolvedValue({ name: "bellacucina.com", apexName: "bellacucina.com", verified: false, verification: [] });

    await connectDomain("s1", { domain: "BellaCucina.COM." });

    expect(db.domain.findFirst).toHaveBeenCalledWith({ where: { domain: { equals: "bellacucina.com", mode: "insensitive" } } });
    expect(addDomainToVercelProject).toHaveBeenCalledWith(expect.objectContaining({ domain: "bellacucina.com" }));
    expect(db.domain.create).toHaveBeenCalledWith({ data: expect.objectContaining({ domain: "bellacucina.com" }) });
  });
});

describe("checkDomainAvailability — the dialog's tag", () => {
  it("is `invalid` for something that is not a hostname, without a database read", async () => {
    await expect(checkDomainAvailability("http://bella cucina")).resolves.toEqual({ available: false, reason: "invalid" });
    await expect(checkDomainAvailability("bella")).resolves.toEqual({ available: false, reason: "invalid" });
    expect(db.domain.findFirst).not.toHaveBeenCalled();
  });

  it("is `connected` when any site holds the name, compared case-insensitively", async () => {
    db.domain.findFirst.mockResolvedValue({ id: "dom1" });
    await expect(checkDomainAvailability("BellaCucina.com")).resolves.toEqual({ available: false, reason: "connected" });
    expect(db.domain.findFirst).toHaveBeenCalledWith({
      where: { domain: { equals: "BellaCucina.com", mode: "insensitive" } },
      select: { id: true },
    });
  });

  it("is available when no row matches, trimming whitespace and a trailing dot", async () => {
    db.domain.findFirst.mockResolvedValue(null);
    await expect(checkDomainAvailability("  bellacucina.com. ")).resolves.toEqual({ available: true });
    expect(db.domain.findFirst).toHaveBeenCalledWith({
      where: { domain: { equals: "bellacucina.com", mode: "insensitive" } },
      select: { id: true },
    });
  });
});

describe("updateDomain — the card's Force HTTPS toggle", () => {
  it("writes the flag and returns the row with its records", async () => {
    db.domain.update.mockResolvedValue({ id: "dom1", forceHttps: false, dnsRecords: [] });
    await expect(updateDomain("dom1", { forceHttps: false })).resolves.toEqual({ id: "dom1", forceHttps: false, dnsRecords: [] });
    expect(db.domain.update).toHaveBeenCalledWith({
      where: { id: "dom1" },
      data: { forceHttps: false },
      include: { dnsRecords: { orderBy: { type: "asc" } } },
    });
  });
});

describe("checkDomainDns — TXT", () => {
  function records(verified: boolean) {
    return {
      id: "dom1",
      siteId: "s1",
      domain: "bellacucina.com",
      site: { workspaceId: "ws1", slug: "bella", vercelProjectName: "buildrik-site-bella" },
      dnsRecords: [
        { id: "r-a", type: "A", host: "@", value: "76.76.21.21", verified },
        { id: "r-cname", type: "CNAME", host: "www", value: "cname.vercel-dns.com", verified },
        { id: "r-txt", type: "TXT", host: "_buildrick", value: "brk-verify-abc", verified },
      ],
    };
  }

  it("resolves the _buildrick TXT record at its FQDN and joins chunked answers", async () => {
    db.domain.findUnique.mockResolvedValue(records(false));
    db.domain.update.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ id: "dom1", ...data }));
    const resolve4 = vi.spyOn(dnsPromises, "resolve4").mockResolvedValue(["76.76.21.21"]);
    const resolveCname = vi.spyOn(dnsPromises, "resolveCname").mockResolvedValue(["cname.vercel-dns.com."]);
    const resolveTxt = vi.spyOn(dnsPromises, "resolveTxt").mockResolvedValue([["brk-verify-", "abc"]]);

    const result = await checkDomainDns("dom1", "s1");

    expect(resolve4).toHaveBeenCalledWith("bellacucina.com");
    expect(resolveCname).toHaveBeenCalledWith("www.bellacucina.com");
    expect(resolveTxt).toHaveBeenCalledWith("_buildrick.bellacucina.com");
    expect(db.dnsRecord.update).toHaveBeenCalledWith({ where: { id: "r-txt" }, data: { verified: true } });
    expect(result?.status).toBe("VERIFIED");
  });

  it("leaves the domain PENDING while the TXT is the only record not answering", async () => {
    db.domain.findUnique.mockResolvedValue(records(true));
    db.domain.update.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ id: "dom1", ...data }));
    vi.spyOn(dnsPromises, "resolve4").mockResolvedValue(["76.76.21.21"]);
    vi.spyOn(dnsPromises, "resolveCname").mockResolvedValue(["cname.vercel-dns.com"]);
    vi.spyOn(dnsPromises, "resolveTxt").mockRejectedValue(Object.assign(new Error("ENODATA"), { code: "ENODATA" }));

    const result = await checkDomainDns("dom1", "s1");

    expect(db.dnsRecord.update).toHaveBeenCalledTimes(1);
    expect(db.dnsRecord.update).toHaveBeenCalledWith({ where: { id: "r-txt" }, data: { verified: false } });
    expect(result?.status).toBe("PENDING");
  });

  /* Owner decision Q6: with a Vercel connection our `_buildrick` TXT is not
     a requirement — a correctly pointed domain used to sit at "Waiting for
     DNS" until the user also added a token nobody else reads. */
  it("without a Vercel connection the _buildrick TXT is still required (the only ownership proof)", async () => {
    db.domain.findUnique.mockResolvedValue(records(false));
    db.domain.update.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ id: "dom1", ...data }));
    vi.spyOn(dnsPromises, "resolve4").mockResolvedValue(["76.76.21.21"]);
    vi.spyOn(dnsPromises, "resolveCname").mockResolvedValue(["cname.vercel-dns.com"]);
    vi.spyOn(dnsPromises, "resolveTxt").mockRejectedValue(Object.assign(new Error("ENODATA"), { code: "ENODATA" }));

    expect((await checkDomainDns("dom1", "s1"))?.status).toBe("PENDING");
  });

  /* QA 2026-10-05: rows written while the workspace had Vercel carry no
     `_buildrick` TXT (Q6). Disconnect Vercel and the resolver path judged
     A + CNAME alone — pointing DNS at Vercel made the domain VERIFIED with
     no ownership proof at all. Without Vercel the TXT is required, so a row
     that lacks one gets it, and stays unverified until it answers. */
  it("without Vercel, a row with no _buildrick TXT gets one and is not VERIFIED on A + CNAME alone", async () => {
    const row = records(true);
    db.domain.findUnique.mockResolvedValue({ ...row, dnsRecords: row.dnsRecords.filter((r) => r.type !== "TXT") });
    db.dnsRecord.createMany.mockResolvedValue({ count: 1 });
    db.dnsRecord.findMany.mockResolvedValue([
      ...row.dnsRecords.filter((r) => r.type !== "TXT"),
      { id: "r-new", type: "TXT", host: "_buildrick", value: dnsVerificationToken("dom1"), verified: false },
    ]);
    db.domain.update.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ id: "dom1", ...data }));
    vi.spyOn(dnsPromises, "resolve4").mockResolvedValue(["76.76.21.21"]);
    vi.spyOn(dnsPromises, "resolveCname").mockResolvedValue(["cname.vercel-dns.com"]);
    vi.spyOn(dnsPromises, "resolveTxt").mockRejectedValue(Object.assign(new Error("ENODATA"), { code: "ENODATA" }));

    const result = await checkDomainDns("dom1", "s1");

    expect(db.dnsRecord.createMany).toHaveBeenCalledWith({
      data: [{ domainId: "dom1", type: "TXT", host: "_buildrick", value: dnsVerificationToken("dom1") }],
      skipDuplicates: true,
    });
    expect(result?.status).toBe("PENDING");
  });

  /* QA 2026-10-05: SSL ACTIVE only while VERIFIED. A row Vercel once made
     VERIFIED + ACTIVE kept "ACTIVE" after the resolver path failed it. */
  it("without Vercel, a domain that is not VERIFIED has its SSL set back to PENDING", async () => {
    db.domain.findUnique.mockResolvedValue({ ...records(false), status: "VERIFIED", sslStatus: "ACTIVE" });
    db.domain.update.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ id: "dom1", ...data }));
    vi.spyOn(dnsPromises, "resolve4").mockRejectedValue(Object.assign(new Error("ENOTFOUND"), { code: "ENOTFOUND" }));
    vi.spyOn(dnsPromises, "resolveCname").mockRejectedValue(Object.assign(new Error("ENOTFOUND"), { code: "ENOTFOUND" }));
    vi.spyOn(dnsPromises, "resolveTxt").mockRejectedValue(Object.assign(new Error("ENOTFOUND"), { code: "ENOTFOUND" }));

    const result = await checkDomainDns("dom1", "s1");

    expect(result).toEqual(expect.objectContaining({ status: "FAILED", sslStatus: "PENDING" }));
  });

  it("writes nothing for a domain that belongs to another site", async () => {
    db.domain.findUnique.mockResolvedValue({ ...records(false), siteId: "other" });
    db.dnsRecord.update.mockClear();
    db.domain.update.mockClear();
    await expect(checkDomainDns("dom1", "s1")).resolves.toBeNull();
    expect(db.dnsRecord.update).not.toHaveBeenCalled();
    expect(db.domain.update).not.toHaveBeenCalled();
  });
});

describe("checkDomainDns — Vercel-connected workspace (Q6)", () => {
  /* SECURITY: our TXT is dropped for Vercel workspaces, so ownership must
     come from Vercel. DNS that answers is not ownership. */
  it("Vercel unreadable: DNS that answers is NOT promoted to VERIFIED — status left as it was", async () => {
    vercelConnection.mockResolvedValue({ token: "t", teamId: null });
    vi.mocked(getVercelProjectDomain).mockRejectedValue(new VercelApiError(500, "internal_server_error", "boom"));
    db.domain.findUnique.mockResolvedValue({
      id: "dom1",
      siteId: "s1",
      domain: "bellacucina.com",
      site: { workspaceId: "ws1", slug: "bella", vercelProjectName: "buildrik-site-bella" },
      dnsRecords: [
        { id: "r-a", type: "A", host: "@", value: "76.76.21.21", verified: false },
        { id: "r-cname", type: "CNAME", host: "www", value: "cname.vercel-dns.com", verified: false },
        { id: "r-txt", type: "TXT", host: "_buildrick", value: "brk-verify-abc", verified: false },
      ],
    });
    db.domain.update.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ id: "dom1", ...data }));
    vi.spyOn(dnsPromises, "resolve4").mockResolvedValue(["76.76.21.21"]);
    vi.spyOn(dnsPromises, "resolveCname").mockResolvedValue(["cname.vercel-dns.com"]);
    vi.spyOn(dnsPromises, "resolveTxt").mockRejectedValue(Object.assign(new Error("ENODATA"), { code: "ENODATA" }));

    await checkDomainDns("dom1", "s1");
    expect(db.domain.update).toHaveBeenCalledWith({
      where: { id: "dom1" },
      data: { lastCheckedAt: expect.any(Date) },
      include: { dnsRecords: true },
    });
  });
});

/* Owner decision Q7: Vercel decides Connected and SSL active. Fixtures follow
   the documented 200 shapes of GET /v9/projects/{p}/domains/{d} (name,
   apexName, projectId, verified, verification[]) and GET /v6/domains/{d}/config
   (misconfigured, configuredBy, recommended*). */
describe("checkDomainDns — Vercel decides status and SSL (Q7)", () => {
  const projectDomain = (over: Partial<{ name: string; apexName: string; verified: boolean }> = {}) => ({
    name: "bellacucina.com",
    apexName: "bellacucina.com",
    verified: true,
    verification: [],
    ...over,
  });
  const configured = { misconfigured: false, recommendedIPv4: "76.76.21.21", recommendedCNAME: "cname.vercel-dns.com" };
  const apexRows = (verified: boolean) => [
    { id: "r-a", type: "A", host: "@", value: "76.76.21.21", verified },
    { id: "r-cname", type: "CNAME", host: "www", value: "cname.vercel-dns.com", verified },
  ];
  function row(over: Record<string, unknown> = {}) {
    return {
      id: "dom1",
      siteId: "s1",
      domain: "bellacucina.com",
      status: "PENDING",
      sslStatus: "PENDING",
      site: { workspaceId: "ws1", slug: "bella", vercelProjectName: "buildrik-site-bella" },
      dnsRecords: apexRows(false),
      ...over,
    };
  }
  const writtenStatus = () => vi.mocked(db.domain.update).mock.calls.at(-1)?.[0].data as Record<string, unknown>;

  beforeEach(() => {
    vercelConnection.mockResolvedValue({ token: "t", teamId: "team_1" });
    db.domain.update.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ id: "dom1", ...data }));
    vi.spyOn(dnsPromises, "resolve4").mockResolvedValue(["76.76.21.21"]);
    vi.spyOn(dnsPromises, "resolveCname").mockResolvedValue(["cname.vercel-dns.com"]);
  });

  it("verified on the project + misconfigured: false → VERIFIED and sslStatus ACTIVE", async () => {
    db.domain.findUnique.mockResolvedValue(row());
    vi.mocked(getVercelProjectDomain).mockResolvedValue(projectDomain());
    vi.mocked(getVercelDomainConfig).mockResolvedValue(configured);

    await checkDomainDns("dom1", "s1");

    expect(getVercelProjectDomain).toHaveBeenCalledWith({ token: "t", teamId: "team_1", projectName: "buildrik-site-bella", domain: "bellacucina.com" });
    expect(writtenStatus()).toMatchObject({ status: "VERIFIED", sslStatus: "ACTIVE" });
  });

  it("misconfigured: true → not VERIFIED, SSL pending, even when the project says verified", async () => {
    db.domain.findUnique.mockResolvedValue(row());
    vi.mocked(getVercelProjectDomain).mockResolvedValue(projectDomain());
    vi.mocked(getVercelDomainConfig).mockResolvedValue({ ...configured, misconfigured: true });
    vi.spyOn(dnsPromises, "resolve4").mockRejectedValue(Object.assign(new Error("ENOTFOUND"), { code: "ENOTFOUND" }));
    vi.spyOn(dnsPromises, "resolveCname").mockRejectedValue(Object.assign(new Error("ENOTFOUND"), { code: "ENOTFOUND" }));

    await checkDomainDns("dom1", "s1");

    expect(writtenStatus()).toMatchObject({ status: "FAILED", sslStatus: "PENDING" });
  });

  /* SECURITY: DNS pointing at Vercel (misconfigured: false, every record
     answering) is not ownership. Only Vercel's project-domain `verified`. */
  it("Vercel verified: false with misconfigured: false and DNS answering → NOT verified", async () => {
    db.domain.findUnique.mockResolvedValue(row());
    vi.mocked(getVercelProjectDomain).mockResolvedValue({
      ...projectDomain({ verified: false }),
      verification: [{ type: "TXT", domain: "_vercel.bellacucina.com", value: "vc-domain-verify=bellacucina.com,abc123", reason: "pending_domain_verification" }],
    });
    vi.mocked(getVercelDomainConfig).mockResolvedValue(configured);
    db.dnsRecord.findMany.mockResolvedValue(apexRows(true));

    await checkDomainDns("dom1", "s1");

    expect(writtenStatus()).toMatchObject({ status: "PENDING", sslStatus: "PENDING" });
  });

  it("Vercel's verification challenge (TXT _vercel) is written as a record the user must add", async () => {
    db.domain.findUnique.mockResolvedValue(row());
    vi.mocked(getVercelProjectDomain).mockResolvedValue({
      ...projectDomain({ verified: false }),
      verification: [{ type: "TXT", domain: "_vercel.bellacucina.com", value: "vc-domain-verify=bellacucina.com,abc123", reason: "pending_domain_verification" }],
    });
    vi.mocked(getVercelDomainConfig).mockResolvedValue({ ...configured, misconfigured: true });
    db.dnsRecord.findMany.mockResolvedValue([]);

    await checkDomainDns("dom1", "s1");

    expect(db.dnsRecord.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        { domainId: "dom1", type: "TXT", host: "_vercel.bellacucina.com", value: "vc-domain-verify=bellacucina.com,abc123" },
      ]),
      skipDuplicates: true,
    });
  });

  it("a row an old 409 marked VERIFIED, which the project does not hold (404 → null) and Vercel still refuses (409), drops to FAILED", async () => {
    db.domain.findUnique.mockResolvedValue(row({ status: "VERIFIED" }));
    vi.mocked(getVercelProjectDomain).mockResolvedValue(null);
    vi.mocked(addDomainToVercelProject).mockRejectedValue(new VercelApiError(409, "domain_already_in_use", "elsewhere"));

    await checkDomainDns("dom1", "s1");

    expect(writtenStatus()).toMatchObject({ status: "FAILED", sslStatus: "PENDING" });
  });

  /* D7 (QA 2026-10-05): a transient attach failure at connect left the row
     FAILED forever — every later check saw 404 and nothing re-attached. */
  it("a 404 on the project re-attaches the domain, then re-verifies it (D7)", async () => {
    db.domain.findUnique.mockResolvedValue(row({ status: "FAILED" }));
    vi.mocked(getVercelProjectDomain).mockResolvedValue(null);
    vi.mocked(addDomainToVercelProject).mockResolvedValue(projectDomain());
    vi.mocked(getVercelDomainConfig).mockResolvedValue(configured);
    db.dnsRecord.findMany.mockResolvedValue(apexRows(true));

    await checkDomainDns("dom1", "s1");

    expect(addDomainToVercelProject).toHaveBeenCalledWith({
      token: "t",
      teamId: "team_1",
      projectName: "buildrik-site-bella",
      domain: "bellacucina.com",
    });
    expect(writtenStatus()).toMatchObject({ status: "VERIFIED", sslStatus: "ACTIVE" });
  });

  it("a re-attach that succeeds but is not yet pointed stays PENDING, never VERIFIED (D7)", async () => {
    db.domain.findUnique.mockResolvedValue(row({ status: "FAILED" }));
    vi.mocked(getVercelProjectDomain).mockResolvedValue(null);
    vi.mocked(addDomainToVercelProject).mockResolvedValue(projectDomain({ verified: true }));
    vi.mocked(getVercelDomainConfig).mockResolvedValue({ ...configured, misconfigured: true });
    db.dnsRecord.findMany.mockResolvedValue(apexRows(true));

    await checkDomainDns("dom1", "s1");

    expect(writtenStatus()).toMatchObject({ status: "PENDING", sslStatus: "PENDING" });
  });

  it("a re-attach that fails again (non-409) leaves the domain FAILED (D7)", async () => {
    db.domain.findUnique.mockResolvedValue(row({ status: "FAILED" }));
    vi.mocked(getVercelProjectDomain).mockResolvedValue(null);
    vi.mocked(addDomainToVercelProject).mockRejectedValue(new VercelApiError(500, "internal", "boom"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    await checkDomainDns("dom1", "s1");

    expect(writtenStatus()).toMatchObject({ status: "FAILED", sslStatus: "PENDING" });
  });

  it("does not re-attach when the project already holds the domain (a DNS mismatch is not an attach failure)", async () => {
    db.domain.findUnique.mockResolvedValue(row({ status: "FAILED" }));
    vi.mocked(getVercelProjectDomain).mockResolvedValue(projectDomain());
    vi.mocked(getVercelDomainConfig).mockResolvedValue({ ...configured, misconfigured: true });
    db.dnsRecord.findMany.mockResolvedValue(apexRows(false));

    await checkDomainDns("dom1", "s1");

    expect(addDomainToVercelProject).not.toHaveBeenCalled();
  });

  it("an unreadable Vercel does not trigger a re-attach and leaves status unchanged", async () => {
    db.domain.findUnique.mockResolvedValue(row({ status: "FAILED" }));
    vi.mocked(getVercelProjectDomain).mockRejectedValue(new VercelApiError(500, "internal", "boom"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    await checkDomainDns("dom1", "s1");

    expect(addDomainToVercelProject).not.toHaveBeenCalled();
    expect(writtenStatus()).not.toHaveProperty("status");
  });

  it("repairs a subdomain's old apex-shaped rows to the one CNAME Vercel recommends", async () => {
    db.domain.findUnique.mockResolvedValue(
      row({
        domain: "shop.bellacucina.com",
        dnsRecords: [
          { id: "r-a", type: "A", host: "@", value: "76.76.21.21", verified: false },
          { id: "r-cname", type: "CNAME", host: "www", value: "cname.vercel-dns.com", verified: false },
          { id: "r-txt", type: "TXT", host: "_buildrick", value: "brk-verify-abc", verified: false },
        ],
      }),
    );
    vi.mocked(getVercelProjectDomain).mockResolvedValue(projectDomain({ name: "shop.bellacucina.com", verified: true }));
    vi.mocked(getVercelDomainConfig).mockResolvedValue(configured);
    db.dnsRecord.findMany.mockResolvedValue([{ id: "n1", type: "CNAME", host: "shop", value: "cname.vercel-dns.com", verified: false }]);

    await checkDomainDns("dom1", "s1");

    // Stale rows go by id and the write skips duplicates, so a cron and a
    // manual check running at once cannot double the table.
    expect(db.dnsRecord.deleteMany).toHaveBeenCalledWith({ where: { domainId: "dom1", id: { in: ["r-a", "r-cname", "r-txt"] } } });
    expect(db.dnsRecord.createMany).toHaveBeenCalledWith({
      data: [{ domainId: "dom1", type: "CNAME", host: "shop", value: "cname.vercel-dns.com" }],
      skipDuplicates: true,
    });
    expect(dnsPromises.resolveCname).toHaveBeenCalledWith("shop.bellacucina.com");
    expect(writtenStatus()).toMatchObject({ status: "VERIFIED", sslStatus: "ACTIVE" });
  });

  it("keeps the rows that already match and writes only the missing one (idempotent)", async () => {
    db.domain.findUnique.mockResolvedValue(row({ dnsRecords: [apexRows(false)[0]] }));
    vi.mocked(getVercelProjectDomain).mockResolvedValue(projectDomain());
    vi.mocked(getVercelDomainConfig).mockResolvedValue(configured);
    db.dnsRecord.findMany.mockResolvedValue(apexRows(false));

    await checkDomainDns("dom1", "s1");

    expect(db.dnsRecord.deleteMany).not.toHaveBeenCalled();
    expect(db.dnsRecord.createMany).toHaveBeenCalledWith({
      data: [{ domainId: "dom1", type: "CNAME", host: "www", value: "cname.vercel-dns.com" }],
      skipDuplicates: true,
    });
  });

  it("leaves matching rows alone (no rewrite churn)", async () => {
    db.domain.findUnique.mockResolvedValue(row());
    vi.mocked(getVercelProjectDomain).mockResolvedValue(projectDomain());
    vi.mocked(getVercelDomainConfig).mockResolvedValue(configured);

    await checkDomainDns("dom1", "s1");

    expect(db.dnsRecord.deleteMany).not.toHaveBeenCalled();
  });
});

describe("connectDomain — status at attach (Q7)", () => {
  function connectable() {
    db.site.findUnique.mockResolvedValue({ workspaceId: "ws1", slug: "bella", vercelProjectName: "buildrik-site-bella", deletedAt: null });
    db.workspace.findUnique.mockResolvedValue({ plan: "PRO" });
    db.domain.count.mockResolvedValue(0);
    db.domain.findFirst.mockResolvedValue(null);
    db.domain.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ id: "dom1", ...data }));
    db.domain.findUniqueOrThrow.mockResolvedValue({ id: "dom1", dnsRecords: [] });
    vercelConnection.mockResolvedValue({ token: "t", teamId: null });
  }

  it("ownership verified but DNS not yet pointed (misconfigured) stays PENDING — it used to be VERIFIED on `verified` alone", async () => {
    connectable();
    vi.mocked(addDomainToVercelProject).mockResolvedValue({ name: "bellacucina.com", apexName: "bellacucina.com", verified: true, verification: [] });
    vi.mocked(getVercelDomainConfig).mockResolvedValue({ misconfigured: true, recommendedIPv4: "76.76.21.21", recommendedCNAME: "cname.vercel-dns.com" });

    await connectDomain("s1", { domain: "bellacucina.com" });

    expect(db.domain.create).toHaveBeenCalledWith({ data: expect.objectContaining({ status: "PENDING", sslStatus: "PENDING" }) });
    expect(db.domain.update).not.toHaveBeenCalled();
  });

  it("SECURITY: pointed at Vercel (misconfigured: false) but verified: false with a challenge → PENDING, challenge returned", async () => {
    connectable();
    vi.mocked(addDomainToVercelProject).mockResolvedValue({
      name: "bellacucina.com",
      apexName: "bellacucina.com",
      verified: false,
      verification: [{ type: "TXT", domain: "_vercel.bellacucina.com", value: "vc-domain-verify=bellacucina.com,abc123", reason: "pending_domain_verification" }],
    });
    vi.mocked(getVercelDomainConfig).mockResolvedValue({ misconfigured: false, recommendedIPv4: "76.76.21.21", recommendedCNAME: "cname.vercel-dns.com" });

    await connectDomain("s1", { domain: "bellacucina.com" });

    expect(db.domain.create).toHaveBeenCalledWith({ data: expect.objectContaining({ status: "PENDING" }) });
    expect(db.domain.update).not.toHaveBeenCalled();
    expect(db.dnsRecord.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        { domainId: "dom1", type: "TXT", host: "_vercel.bellacucina.com", value: "vc-domain-verify=bellacucina.com,abc123" },
      ]),
    });
  });

  it("already pointed at Vercel → VERIFIED with SSL ACTIVE straight away", async () => {
    connectable();
    vi.mocked(addDomainToVercelProject).mockResolvedValue({ name: "bellacucina.com", apexName: "bellacucina.com", verified: true, verification: [] });
    vi.mocked(getVercelDomainConfig).mockResolvedValue({ misconfigured: false, recommendedIPv4: "76.76.21.21", recommendedCNAME: "cname.vercel-dns.com" });

    await connectDomain("s1", { domain: "bellacucina.com" });

    expect(db.domain.update).toHaveBeenCalledWith({ where: { id: "dom1" }, data: { status: "VERIFIED", sslStatus: "ACTIVE" } });
  });
});

/* The cron's job, through the SAME checkDomainDns as "Check DNS". */
describe("verifyPendingDomains — the dns-verify cron", () => {
  it("re-checks not-yet-Connected-with-SSL domains, oldest first, capped, through checkDomainDns", async () => {
    db.domain.findMany.mockResolvedValue([
      { id: "dom1", siteId: "s1" },
      { id: "dom2", siteId: "s2" },
    ]);
    db.domain.findUnique.mockImplementation(async ({ where }: { where: { id: string } }) => ({
      id: where.id,
      siteId: where.id === "dom1" ? "s1" : "s2",
      domain: `${where.id}.example.com`,
      site: { workspaceId: "ws1", slug: "bella", vercelProjectName: null },
      dnsRecords: [],
    }));
    vercelConnection.mockResolvedValue({ token: "t", teamId: null });
    vi.mocked(getVercelProjectDomain).mockResolvedValue({ name: "x", apexName: "example.com", verified: true, verification: [] });
    vi.mocked(getVercelDomainConfig).mockResolvedValue({ misconfigured: false, recommendedIPv4: null, recommendedCNAME: null });
    db.dnsRecord.findMany.mockResolvedValue([]);
    vi.spyOn(dnsPromises, "resolveCname").mockResolvedValue(["cname.vercel-dns.com"]);
    db.domain.update.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ id: "x", ...data }));

    await expect(verifyPendingDomains(20)).resolves.toEqual({ checked: 2, verified: 2 });

    expect(db.domain.findMany).toHaveBeenCalledWith({
      where: { OR: [{ status: { not: "VERIFIED" } }, { sslStatus: { not: "ACTIVE" } }], site: { deletedAt: null } },
      orderBy: [{ lastCheckedAt: { sort: "asc", nulls: "first" } }],
      take: 20,
      select: { id: true, siteId: true },
    });
    expect(getVercelProjectDomain).toHaveBeenCalledTimes(2);
  });

  it("one domain's failure does not stop the run", async () => {
    db.domain.findMany.mockResolvedValue([
      { id: "dom1", siteId: "s1" },
      { id: "dom2", siteId: "s2" },
    ]);
    db.domain.findUnique.mockRejectedValueOnce(new Error("db hiccup")).mockResolvedValueOnce(null);
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(verifyPendingDomains()).resolves.toEqual({ checked: 2, verified: 0 });
    expect(db.domain.findUnique).toHaveBeenCalledTimes(2);
  });
});
