import { describe, it, expect, vi, beforeEach } from "vitest";
import { type NextRequest } from "next/server";
import { promises as dnsPromises } from "dns";

// The route resolves per record type via dns.promises.resolveCname / resolve4 /
// resolve6 / resolveTxt against the record's own `value` (f51c50e6). Module-
// mocking "dns" does NOT reach the route here (jsdom env externalizes the
// builtin into a separate module graph — the old skipped tests' "mock plumbing
// quirk"). Spying on the REAL shared dns.promises instance works for both.


vi.mock("@/lib/prisma", () => ({
  prisma: {
    dnsRecord: {
      findMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    domain: {
      update: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import { GET } from "@/app/api/cron/dns-verify/route";

const mockPrisma = prisma as typeof prisma & {
  dnsRecord: {
    findMany: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
  };
  domain: {
    update: ReturnType<typeof vi.fn>;
  };
};

function makeReq(authHeader?: string): NextRequest {
  return new Request("http://localhost/api/cron/dns-verify", {
    headers: authHeader ? { authorization: authHeader } : {},
  }) as NextRequest;
}

function cnameRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: "rec1",
    domainId: "dom1",
    type: "CNAME",
    host: "www",
    value: "sites.buildrik.app",
    verified: false,
    domain: { domain: "example.com" },
    ...overrides,
  };
}

let resolveCnameSpy: ReturnType<typeof vi.spyOn>;
let resolve4Spy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.clearAllMocks();
  resolveCnameSpy = vi.spyOn(dnsPromises, "resolveCname").mockRejectedValue(
    Object.assign(new Error("queryCname ENOTFOUND"), { code: "ENOTFOUND" }),
  );
  resolve4Spy = vi.spyOn(dnsPromises, "resolve4").mockRejectedValue(
    Object.assign(new Error("queryA ENOTFOUND"), { code: "ENOTFOUND" }),
  );
  process.env.CRON_SECRET = "test-secret";
  mockPrisma.dnsRecord.findMany.mockResolvedValue([]);
});

describe("dns-verify cron", () => {
  it("returns 401 when authorization header is missing", async () => {
    const res = await GET(makeReq());
    expect(res.status).toBe(401);
  });

  it("returns 401 when authorization header is wrong", async () => {
    const res = await GET(makeReq("Bearer wrong-secret"));
    expect(res.status).toBe(401);
  });

  it("marks DnsRecord verified when CNAME resolves to the record's expected value", async () => {
    mockPrisma.dnsRecord.findMany.mockResolvedValue([cnameRecord()]);
    resolveCnameSpy.mockResolvedValue(["sites.buildrik.app"]);
    mockPrisma.dnsRecord.update.mockResolvedValue({});
    mockPrisma.dnsRecord.count.mockResolvedValue(1);

    const res = await GET(makeReq("Bearer test-secret"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, verified: 1 });
    expect(resolveCnameSpy).toHaveBeenCalledWith("www.example.com");
    expect(mockPrisma.dnsRecord.update).toHaveBeenCalledWith({
      where: { id: "rec1" },
      data: { verified: true },
    });
  });

  it("updates Domain.status to VERIFIED when all DnsRecords for the domain are verified", async () => {
    mockPrisma.dnsRecord.findMany.mockResolvedValue([
      cnameRecord({ id: "rec3", domainId: "dom3", host: "@", domain: { domain: "mysite.com" } }),
    ]);
    resolveCnameSpy.mockResolvedValue(["sites.buildrik.app"]);
    mockPrisma.dnsRecord.update.mockResolvedValue({});
    mockPrisma.dnsRecord.count.mockResolvedValue(0);
    mockPrisma.domain.update.mockResolvedValue({});

    const res = await GET(makeReq("Bearer test-secret"));
    expect(res.status).toBe(200);
    expect(mockPrisma.domain.update).toHaveBeenCalledWith({
      where: { id: "dom3" },
      data: { status: "VERIFIED", lastCheckedAt: expect.any(Date) },
    });
  });

  it("leaves record unverified when CNAME does not match", async () => {
    mockPrisma.dnsRecord.findMany.mockResolvedValue([cnameRecord({ id: "rec2", domainId: "dom2" })]);
    resolveCnameSpy.mockResolvedValue(["other-provider.com"]);

    const res = await GET(makeReq("Bearer test-secret"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, verified: 0 });
    expect(mockPrisma.dnsRecord.update).not.toHaveBeenCalled();
  });

  it("continues and returns 200 when resolve() throws ENOTFOUND", async () => {
    mockPrisma.dnsRecord.findMany.mockResolvedValue([
      cnameRecord({ id: "rec4", domainId: "dom4", domain: { domain: "notfound.com" } }),
    ]);
    const err = Object.assign(new Error("getaddrinfo ENOTFOUND"), { code: "ENOTFOUND" });
    resolveCnameSpy.mockRejectedValue(err);

    const res = await GET(makeReq("Bearer test-secret"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, verified: 0 });
    expect(mockPrisma.dnsRecord.update).not.toHaveBeenCalled();
  });

  it("leaves record unverified when CNAME resolves to a non-exact buildrik subdomain (e.g. cdn.buildrik.app)", async () => {
    mockPrisma.dnsRecord.findMany.mockResolvedValue([cnameRecord({ id: "rec6", domainId: "dom6" })]);
    resolveCnameSpy.mockResolvedValue(["cdn.buildrik.app"]);

    const res = await GET(makeReq("Bearer test-secret"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, verified: 0 });
    expect(mockPrisma.dnsRecord.update).not.toHaveBeenCalled();
  });

  it("verifies A records via resolve4 against the record value", async () => {
    mockPrisma.dnsRecord.findMany.mockResolvedValue([
      cnameRecord({ id: "rec7", domainId: "dom7", type: "A", value: "76.76.21.21" }),
    ]);
    resolve4Spy.mockResolvedValue(["76.76.21.21"]);
    mockPrisma.dnsRecord.update.mockResolvedValue({});
    mockPrisma.dnsRecord.count.mockResolvedValue(1);

    const res = await GET(makeReq("Bearer test-secret"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, verified: 1 });
    expect(resolve4Spy).toHaveBeenCalledWith("www.example.com");
  });

  it("skips unsupported record types without calling any resolver", async () => {
    mockPrisma.dnsRecord.findMany.mockResolvedValue([
      cnameRecord({ id: "rec5", domainId: "dom5", type: "MX", value: "mail.example.com" }),
    ]);

    const res = await GET(makeReq("Bearer test-secret"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, verified: 0 });
    expect(resolveCnameSpy).not.toHaveBeenCalled();
    expect(resolve4Spy).not.toHaveBeenCalled();
    expect(mockPrisma.dnsRecord.update).not.toHaveBeenCalled();
  });
});
