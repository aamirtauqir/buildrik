/**
 * /api/cron/dns-verify — a thin caller. It used to re-implement the node:dns
 * match (and its own VERIFIED rule) beside domain.service's checkDomainDns;
 * it now runs the service's verifyPendingDomains, which runs checkDomainDns.
 * The checking itself is tested in server/services/__tests__/domain-service-s2.test.ts.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { type NextRequest } from "next/server";

const verifyPendingDomains = vi.hoisted(() => vi.fn());
vi.mock("@server/services/domain.service", () => ({ verifyPendingDomains }));

import { GET } from "@/app/api/cron/dns-verify/route";

function makeReq(authHeader?: string): NextRequest {
  return new Request("http://localhost/api/cron/dns-verify", {
    headers: authHeader ? { authorization: authHeader } : {},
  }) as NextRequest;
}

beforeEach(() => {
  verifyPendingDomains.mockReset().mockResolvedValue({ checked: 3, verified: 1 });
  process.env.CRON_SECRET = "test-secret";
});

describe("GET /api/cron/dns-verify", () => {
  it("401s without, or with the wrong, cron secret — and checks nothing", async () => {
    expect((await GET(makeReq())).status).toBe(401);
    expect((await GET(makeReq("Bearer nope"))).status).toBe(401);
    expect(verifyPendingDomains).not.toHaveBeenCalled();
  });

  it("delegates to the service's one DNS check and reports its counts", async () => {
    const res = await GET(makeReq("Bearer test-secret"));
    expect(res.status).toBe(200);
    expect(verifyPendingDomains).toHaveBeenCalledTimes(1);
    expect(await res.json()).toEqual({ ok: true, checked: 3, verified: 1 });
  });
});
