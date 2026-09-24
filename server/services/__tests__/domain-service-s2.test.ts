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

const { db, vercelConnection } = vi.hoisted(() => ({
  db: {
    site: { findUnique: vi.fn() },
    workspace: { findUnique: vi.fn() },
    domain: {
      count: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    dnsRecord: { createMany: vi.fn(), update: vi.fn() },
  },
  vercelConnection: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma: db }));
vi.mock("@server/services/integrations.service", () => ({
  getActiveVercelConnection: (...a: unknown[]) => vercelConnection(...a),
}));
vi.mock("@/lib/vercel", () => ({
  addDomainToVercelProject: vi.fn(),
  removeDomainFromVercelProject: vi.fn(),
  slugifyProjectName: (s: string) => s,
}));

import {
  connectDomain,
  checkDomainAvailability,
  updateDomain,
  checkDomainDns,
  dnsVerificationToken,
} from "@server/services/domain.service";

beforeEach(() => {
  vi.restoreAllMocks();
  Object.values(db).forEach((model) =>
    Object.values(model).forEach((fn) => (fn as ReturnType<typeof vi.fn>).mockReset()),
  );
  vercelConnection.mockReset().mockResolvedValue(null);
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
    db.site.findUnique.mockResolvedValue({ workspaceId: "ws1", slug: "bella", deletedAt: null });
    db.workspace.findUnique.mockResolvedValue({ plan: "PRO" });
    db.domain.count.mockResolvedValue(0);
    db.domain.findFirst.mockResolvedValue(null);
    db.domain.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ id: "dom1", ...data }));
    db.dnsRecord.createMany.mockResolvedValue({ count: 3 });
    db.domain.findUniqueOrThrow.mockImplementation(async () => ({ id: "dom1", dnsRecords: [{ type: "A" }] }));
  }

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

  it("defaults to PRIMARY · https on · no provider when the dialog sends only a name", async () => {
    connectable();
    await connectDomain("s1", { domain: "bellacucina.com" });
    expect(db.domain.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ kind: "PRIMARY", forceHttps: true, dnsProvider: null }),
    });
  });

  it("still refuses a hostname another site holds", async () => {
    connectable();
    db.domain.findFirst.mockResolvedValue({ id: "elsewhere" });
    await expect(connectDomain("s1", { domain: "bellacucina.com" })).rejects.toThrow("DOMAIN_IN_USE");
    expect(db.domain.create).not.toHaveBeenCalled();
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

  it("writes nothing for a domain that belongs to another site", async () => {
    db.domain.findUnique.mockResolvedValue({ ...records(false), siteId: "other" });
    db.dnsRecord.update.mockClear();
    db.domain.update.mockClear();
    await expect(checkDomainDns("dom1", "s1")).resolves.toBeNull();
    expect(db.dnsRecord.update).not.toHaveBeenCalled();
    expect(db.domain.update).not.toHaveBeenCalled();
  });
});
