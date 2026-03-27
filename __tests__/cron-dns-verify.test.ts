import { describe, it, expect, vi, beforeEach } from "vitest";
import { type NextRequest } from "next/server";

vi.mock("dns", () => ({
  promises: {
    resolve: vi.fn(),
  },
}));

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

import { promises as dns } from "dns";
import { prisma } from "@/lib/prisma";
import { GET } from "@/app/api/cron/dns-verify/route";

const mockDns = dns as { resolve: ReturnType<typeof vi.fn> };
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

beforeEach(() => {
  vi.clearAllMocks();
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

  it("marks DnsRecord verified when CNAME resolves to sites.buildrik.app", async () => {
    mockPrisma.dnsRecord.findMany.mockResolvedValue([
      {
        id: "rec1",
        domainId: "dom1",
        type: "CNAME",
        host: "www",
        verified: false,
        domain: { domain: "example.com" },
      },
    ]);
    mockDns.resolve.mockResolvedValue(["sites.buildrik.app"]);
    mockPrisma.dnsRecord.update.mockResolvedValue({});
    mockPrisma.dnsRecord.count.mockResolvedValue(1);

    const res = await GET(makeReq("Bearer test-secret"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true, verified: 1 });
    expect(mockPrisma.dnsRecord.update).toHaveBeenCalledWith({
      where: { id: "rec1" },
      data: { verified: true },
    });
  });

  it("leaves record unverified when CNAME does not match", async () => {
    mockPrisma.dnsRecord.findMany.mockResolvedValue([
      {
        id: "rec2",
        domainId: "dom2",
        type: "CNAME",
        host: "www",
        verified: false,
        domain: { domain: "example.com" },
      },
    ]);
    mockDns.resolve.mockResolvedValue(["other-provider.com"]);

    const res = await GET(makeReq("Bearer test-secret"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true, verified: 0 });
    expect(mockPrisma.dnsRecord.update).not.toHaveBeenCalled();
  });

  it("updates Domain.status to VERIFIED when all DnsRecords for the domain are verified", async () => {
    mockPrisma.dnsRecord.findMany.mockResolvedValue([
      {
        id: "rec3",
        domainId: "dom3",
        type: "CNAME",
        host: "@",
        verified: false,
        domain: { domain: "mysite.com" },
      },
    ]);
    mockDns.resolve.mockResolvedValue(["sites.buildrik.app"]);
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

  it("continues and returns 200 when resolve() throws ENOTFOUND", async () => {
    mockPrisma.dnsRecord.findMany.mockResolvedValue([
      {
        id: "rec4",
        domainId: "dom4",
        type: "CNAME",
        host: "www",
        verified: false,
        domain: { domain: "notfound.com" },
      },
    ]);
    const err = Object.assign(new Error("getaddrinfo ENOTFOUND"), { code: "ENOTFOUND" });
    mockDns.resolve.mockRejectedValue(err);

    const res = await GET(makeReq("Bearer test-secret"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true, verified: 0 });
    expect(mockPrisma.dnsRecord.update).not.toHaveBeenCalled();
  });

  it("skips non-CNAME record types without calling resolve", async () => {
    mockPrisma.dnsRecord.findMany.mockResolvedValue([
      {
        id: "rec5",
        domainId: "dom5",
        type: "A",
        host: "www",
        verified: false,
        domain: { domain: "example.com" },
      },
    ]);

    const res = await GET(makeReq("Bearer test-secret"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true, verified: 0 });
    expect(mockDns.resolve).not.toHaveBeenCalled();
    expect(mockPrisma.dnsRecord.update).not.toHaveBeenCalled();
  });
});
