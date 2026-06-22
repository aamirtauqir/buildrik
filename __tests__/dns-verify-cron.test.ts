import { describe, it, expect, vi, beforeEach } from "vitest";
import { type NextRequest } from "next/server";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    dnsRecord: { findMany: vi.fn(), update: vi.fn(), count: vi.fn() },
    domain: { update: vi.fn() },
  },
}));

const dnsMocks = vi.hoisted(() => ({
  resolveCname: vi.fn(),
  resolve4: vi.fn(),
  resolveTxt: vi.fn(),
  resolve6: vi.fn(),
}));
vi.mock("dns", () => ({ promises: dnsMocks, default: { promises: dnsMocks } }));

import { prisma } from "@/lib/prisma";
import { GET } from "@/app/api/cron/dns-verify/route";

const p = prisma as typeof prisma & {
  dnsRecord: { findMany: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn>; count: ReturnType<typeof vi.fn> };
  domain: { update: ReturnType<typeof vi.fn> };
};

function makeReq(auth = "Bearer test-secret"): NextRequest {
  return new Request("http://localhost/api/cron/dns-verify", {
    headers: { authorization: auth },
  }) as NextRequest;
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.CRON_SECRET = "test-secret";
  p.dnsRecord.count.mockResolvedValue(0);
});

describe("dns-verify cron", () => {
  it("401s without the cron secret", async () => {
    const res = await GET(makeReq("Bearer wrong"));
    expect(res.status).toBe(401);
  });

  it("verifies a CNAME by matching the record's OWN value (not the old dead host)", async () => {
    p.dnsRecord.findMany.mockResolvedValue([
      { id: "r1", domainId: "d1", type: "CNAME", host: "@", value: "cname.vercel-dns.com", domain: { domain: "example.com" } },
    ]);
    dnsMocks.resolveCname.mockResolvedValue(["cname.vercel-dns.com."]); // trailing dot normalized
    const res = await GET(makeReq());
    const body = await res.json();
    expect(body.verified).toBe(1);
    expect(p.dnsRecord.update).toHaveBeenCalledWith(expect.objectContaining({ data: { verified: true } }));
    expect(p.domain.update).toHaveBeenCalled(); // all records verified → domain VERIFIED
    expect(dnsMocks.resolveCname).toHaveBeenCalledWith("example.com");
  });

  it("does NOT verify when the CNAME points somewhere else", async () => {
    p.dnsRecord.findMany.mockResolvedValue([
      { id: "r1", domainId: "d1", type: "CNAME", host: "www", value: "cname.vercel-dns.com", domain: { domain: "example.com" } },
    ]);
    dnsMocks.resolveCname.mockResolvedValue(["someoneelse.example.net"]);
    const res = await GET(makeReq());
    expect((await res.json()).verified).toBe(0);
    expect(p.dnsRecord.update).not.toHaveBeenCalled();
    expect(dnsMocks.resolveCname).toHaveBeenCalledWith("www.example.com");
  });

  it("verifies a Vercel TXT record with an absolute host (no double-suffix)", async () => {
    p.dnsRecord.findMany.mockResolvedValue([
      { id: "r1", domainId: "d1", type: "TXT", host: "_vercel.example.com", value: "vc-domain-verify=abc123", domain: { domain: "example.com" } },
    ]);
    dnsMocks.resolveTxt.mockResolvedValue([["vc-domain-verify=abc123"]]);
    const res = await GET(makeReq());
    expect((await res.json()).verified).toBe(1);
    // absolute host queried as-is, not `_vercel.example.com.example.com`
    expect(dnsMocks.resolveTxt).toHaveBeenCalledWith("_vercel.example.com");
  });

  it("skips unsupported record types instead of crashing", async () => {
    p.dnsRecord.findMany.mockResolvedValue([
      { id: "r1", domainId: "d1", type: "MX", host: "@", value: "10 mail.example.com", domain: { domain: "example.com" } },
    ]);
    const res = await GET(makeReq());
    expect((await res.json()).verified).toBe(0);
    expect(p.dnsRecord.update).not.toHaveBeenCalled();
  });
});
