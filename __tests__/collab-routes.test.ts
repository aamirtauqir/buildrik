/**
 * S-12 (A19-14, A16-6, A16-10, A16-11): the collab op channel.
 *  - both routes 404 unless NEXT_PUBLIC_FEATURE_COLLAB is "true";
 *  - an op is validated before it is stored: envelope, size cap, no
 *    prototype keys (the pollution PoC), rate limit;
 *  - a live SSE stream re-checks the member's role and closes on revocation.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const auth = vi.fn();
const checkSiteRole = vi.fn();
const appendCollabOp = vi.fn();
const getCollabOpsSince = vi.fn();
const latestCollabSeq = vi.fn();
const hasResyncGap = vi.fn();
const checkRateLimit = vi.fn();

vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@server/auth", () => ({ auth: () => auth() }));
vi.mock("@server/services/permission.service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@server/services/permission.service")>()),
  checkSiteRole: (...a: unknown[]) => checkSiteRole(...a),
}));
vi.mock("@server/services/collab.service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@server/services/collab.service")>()),
  appendCollabOp: (...a: unknown[]) => appendCollabOp(...a),
  getCollabOpsSince: (...a: unknown[]) => getCollabOpsSince(...a),
  latestCollabSeq: (...a: unknown[]) => latestCollabSeq(...a),
  hasResyncGap: (...a: unknown[]) => hasResyncGap(...a),
}));
vi.mock("@server/services/rate-limiter", () => ({
  checkRateLimit: (...a: unknown[]) => checkRateLimit(...a),
}));

import { NextRequest } from "next/server";
import { POST } from "@/app/api/collab/[siteId]/ops/route";
import { GET } from "@/app/api/sse/collab/[siteId]/route";
import { PermissionError } from "@server/services/permission.service";

const params = { params: Promise.resolve({ siteId: "s1" }) };

function post(body: string): NextRequest {
  return new NextRequest("http://localhost:3000/api/collab/s1/ops", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });
}

const validOp = { type: "cursor", userId: "u-local", timestamp: 1, payload: { position: { elementId: null, x: 1, y: 2 } } };

beforeEach(() => {
  [auth, checkSiteRole, appendCollabOp, getCollabOpsSince, latestCollabSeq, hasResyncGap, checkRateLimit].forEach((m) =>
    m.mockReset()
  );
  auth.mockResolvedValue({ user: { id: "user-1" } });
  checkSiteRole.mockResolvedValue(undefined);
  appendCollabOp.mockResolvedValue({ seq: 7, id: "op1" });
  checkRateLimit.mockResolvedValue({ allowed: true, remaining: 10, resetAt: Date.now() + 60_000 });
  vi.stubEnv("NEXT_PUBLIC_FEATURE_COLLAB", "true");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe("kill switch", () => {
  it.each([undefined, "false", "1"])("both routes 404 when the flag is %s, before auth", async (value) => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_COLLAB", value as string);
    expect((await POST(post(JSON.stringify({ clientId: "x", op: validOp })), params)).status).toBe(404);
    expect((await GET(new NextRequest("http://localhost:3000/api/sse/collab/s1"), params)).status).toBe(404);
    expect(auth).not.toHaveBeenCalled();
  });
});

describe("POST /api/collab/:siteId/ops", () => {
  it("stores a valid op for an editor", async () => {
    const res = await POST(post(JSON.stringify({ clientId: "c1", op: validOp })), params);
    expect(res.status).toBe(201);
    expect(appendCollabOp).toHaveBeenCalledWith("s1", "user-1", "c1", validOp);
    expect(checkRateLimit).toHaveBeenCalledWith("collab:user-1:s1", expect.any(Number), expect.any(Number));
  });

  it("refuses a non-editor", async () => {
    checkSiteRole.mockRejectedValueOnce(new PermissionError("FORBIDDEN"));
    expect((await POST(post(JSON.stringify({ clientId: "c1", op: validOp })), params)).status).toBe(403);
  });

  it("refuses the prototype-pollution PoC (a patch path through __proto__)", async () => {
    const op = {
      type: "operation",
      userId: "x",
      timestamp: 1,
      payload: { id: { userId: "x", seq: 1 }, patch: [{ op: "add", path: "/__proto__/p", value: 1 }] },
    };
    const res = await POST(post(JSON.stringify({ clientId: "x", op })), params);
    expect(res.status).toBe(400);
    expect(appendCollabOp).not.toHaveBeenCalled();
  });

  it("refuses a __proto__ key anywhere in the op", async () => {
    const nested = '{"clientId":"x","op":{"type":"sync_response","userId":"x","timestamp":1,"payload":{"a":[{"__proto__":{"polluted":1}}]}}}';
    expect((await POST(post(nested), params)).status).toBe(400);
    const bare = '{"clientId":"x","op":{"__proto__":{"polluted":1}}}';
    expect((await POST(post(bare), params)).status).toBe(400);
    expect(appendCollabOp).not.toHaveBeenCalled();
  });

  it("refuses an unknown event type and a missing clientId", async () => {
    expect((await POST(post(JSON.stringify({ clientId: "x", op: { ...validOp, type: "exec" } })), params)).status).toBe(400);
    expect((await POST(post(JSON.stringify({ op: validOp })), params)).status).toBe(400);
  });

  it("refuses a 2 MB op with 413", async () => {
    const op = { ...validOp, type: "sync_response", payload: { blob: "x".repeat(2_000_000) } };
    const res = await POST(post(JSON.stringify({ clientId: "x", op })), params);
    expect(res.status).toBe(413);
    expect(appendCollabOp).not.toHaveBeenCalled();
  });

  it("rate-limits with 429", async () => {
    checkRateLimit.mockResolvedValueOnce({ allowed: false, remaining: 0, resetAt: Date.now() + 30_000 });
    const res = await POST(post(JSON.stringify({ clientId: "x", op: validOp })), params);
    expect(res.status).toBe(429);
    expect(appendCollabOp).not.toHaveBeenCalled();
  });
});

describe("GET /api/sse/collab/:siteId", () => {
  async function readAll(res: Response): Promise<string> {
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let text = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) return text;
      text += decoder.decode(value);
    }
  }

  it("closes a live stream with `revoked` once the member loses access", async () => {
    vi.useFakeTimers();
    latestCollabSeq.mockResolvedValue(0);
    hasResyncGap.mockResolvedValue(false);
    getCollabOpsSince.mockResolvedValue([]);
    // Connect-time check passes; the member is removed afterwards.
    checkSiteRole.mockResolvedValueOnce(undefined).mockRejectedValue(new PermissionError("FORBIDDEN"));

    const res = await GET(new NextRequest("http://localhost:3000/api/sse/collab/s1"), params);
    expect(res.status).toBe(200);
    expect(res.headers.get("X-Accel-Buffering")).toBe("no");
    const body = readAll(res);
    await vi.advanceTimersByTimeAsync(30_000);
    const text = await body;
    expect(text).toContain("event: hello");
    expect(text).toContain("event: revoked");
    expect(checkSiteRole).toHaveBeenCalledTimes(2);
  });

  it("keeps the stream open when the re-check fails for a non-permission reason", async () => {
    vi.useFakeTimers();
    latestCollabSeq.mockResolvedValue(0);
    hasResyncGap.mockResolvedValue(false);
    getCollabOpsSince.mockResolvedValue([]);
    checkSiteRole.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error("db blip")).mockResolvedValue(undefined);

    const ac = new AbortController();
    const res = await GET(new NextRequest("http://localhost:3000/api/sse/collab/s1", { signal: ac.signal }), params);
    const body = readAll(res);
    await vi.advanceTimersByTimeAsync(20_000);
    ac.abort();
    const text = await body;
    expect(text).not.toContain("event: revoked");
    expect(text).toContain(": keep-alive");
  });
});
