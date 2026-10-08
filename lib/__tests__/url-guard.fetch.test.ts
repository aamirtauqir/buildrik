import { describe, it, expect, vi, beforeEach } from "vitest";
import { EventEmitter } from "node:events";
import { PassThrough } from "node:stream";
import type http from "node:http";

const lookup = vi.fn();
vi.mock("node:dns/promises", () => ({ default: { lookup: (...a: unknown[]) => lookup(...a) } }));

import { fetchPublicText } from "@/lib/url-guard";

type Route = { status: number; headers?: Record<string, string>; body?: string };
function transport(routes: Record<string, Route>) {
  const calls: Array<{ url: string; options: http.RequestOptions }> = [];
  const request = (url: URL, options: http.RequestOptions) => {
    calls.push({ url: url.toString(), options });
    const req = new EventEmitter() as EventEmitter & { end(): void; destroy(e?: Error): void };
    req.end = () =>
      queueMicrotask(() => {
        const r = routes[url.toString()];
        if (!r) return req.emit("error", new Error("ECONNREFUSED"));
        const res = Object.assign(new PassThrough(), { statusCode: r.status, headers: r.headers ?? { "content-type": "text/html" } });
        req.emit("response", res);
        res.end(r.body ?? "");
      });
    req.destroy = (e?: Error) => { if (e) req.emit("error", e); };
    return req as unknown as http.ClientRequest;
  };
  return { request, calls };
}

const opts = (t: ReturnType<typeof transport>, over: Partial<Parameters<typeof fetchPublicText>[1]> = {}) => ({
  maxBytes: 1000, deadline: Date.now() + 5000, accept: /^text\/html/, request: t.request, ...over,
});

beforeEach(() => {
  lookup.mockReset();
  lookup.mockImplementation(async (host: string) =>
    host === "internal.test" ? [{ address: "10.0.0.7", family: 4 }]
    : host === "mixed.test" ? [{ address: "93.184.216.34", family: 4 }, { address: "127.0.0.1", family: 4 }]
    : [{ address: "93.184.216.34", family: 4 }],
  );
});

describe("fetchPublicText (spec §9, test 14)", () => {
  it.each(["ftp://example.com/", "file:///etc/passwd", "javascript:alert(1)", "http://user:pw@example.com/", "http://example.com:8080/", "not a url"])(
    "refuses %s as INVALID_URL", async (raw) => {
      const t = transport({});
      await expect(fetchPublicText(raw, opts(t))).rejects.toThrow("INVALID_URL");
      expect(t.calls).toHaveLength(0);
    });

  it.each([
    "http://127.0.0.1/", "http://169.254.169.254/latest/meta-data", "http://[::1]/", "http://10.1.2.3/",
    "http://2130706433/", "http://0x7f.0.0.1/", "http://[::ffff:127.0.0.1]/", "http://[::ffff:a9fe:a9fe]/",
    "http://[fe90::1]/", "http://[ff02::1]/", "http://[::]/", "http://0.0.0.0/",
  ])(
    "refuses the private address %s without connecting", async (raw) => {
      const t = transport({});
      await expect(fetchPublicText(raw, opts(t))).rejects.toThrow("BLOCKED_URL");
      expect(t.calls).toHaveLength(0);
    });

  it("refuses a hostname with any private address", async () => {
    const t = transport({});
    await expect(fetchPublicText("https://internal.test/", opts(t))).rejects.toThrow("BLOCKED_URL");
    await expect(fetchPublicText("https://mixed.test/", opts(t))).rejects.toThrow("BLOCKED_URL");
    expect(t.calls).toHaveLength(0);
  });

  it("connects to the vetted address (no second DNS answer can redirect it)", async () => {
    const t = transport({ "https://example.com/": { status: 200, body: "<html>ok</html>" } });
    const out = await fetchPublicText("https://example.com/", opts(t));
    expect(out.text).toBe("<html>ok</html>");
    expect(lookup).toHaveBeenCalledTimes(1);
    const pinned = t.calls[0].options.lookup!;
    const seen = await new Promise<unknown>((resolve) =>
      pinned("example.com", {}, (_e: unknown, address: unknown) => resolve(address)),
    );
    expect(seen).toBe("93.184.216.34");
  });

  it("refuses a redirect to a private address", async () => {
    const t = transport({ "https://example.com/": { status: 302, headers: { location: "http://internal.test/admin" } } });
    await expect(fetchPublicText("https://example.com/", opts(t))).rejects.toThrow("BLOCKED_URL");
    expect(t.calls).toHaveLength(1);
  });

  it("follows at most 3 redirects", async () => {
    const hop = (n: number): Route => ({ status: 301, headers: { location: `https://example.com/${n + 1}` } });
    const t = transport({ "https://example.com/0": hop(0), "https://example.com/1": hop(1), "https://example.com/2": hop(2), "https://example.com/3": hop(3) });
    await expect(fetchPublicText("https://example.com/0", opts(t))).rejects.toThrow("FETCH_FAILED");
    expect(t.calls).toHaveLength(4);
  });

  it("aborts a body over maxBytes", async () => {
    const t = transport({ "https://example.com/": { status: 200, body: "x".repeat(2000) } });
    await expect(fetchPublicText("https://example.com/", opts(t))).rejects.toThrow("TOO_LARGE");
  });

  it("is TIMEOUT once the deadline has passed", async () => {
    const t = transport({ "https://example.com/": { status: 200, body: "ok" } });
    await expect(fetchPublicText("https://example.com/", opts(t, { deadline: Date.now() - 1 }))).rejects.toThrow("TIMEOUT");
  });

  it("is FETCH_FAILED for a non-200 or an unexpected content type", async () => {
    const t = transport({
      "https://example.com/404": { status: 404 },
      "https://example.com/img": { status: 200, headers: { "content-type": "image/png" } },
    });
    await expect(fetchPublicText("https://example.com/404", opts(t))).rejects.toThrow("FETCH_FAILED");
    await expect(fetchPublicText("https://example.com/img", opts(t))).rejects.toThrow("FETCH_FAILED");
  });

  it("refuses a redirect to a non-80/443 port or to a URL carrying credentials", async () => {
    const t = transport({
      "https://example.com/a": { status: 302, headers: { location: "https://example.com:8443/" } },
      "https://example.com/b": { status: 302, headers: { location: "https://admin:pw@example.com/" } },
      "https://example.com/c": { status: 302, headers: { location: "file:///etc/passwd" } },
    });
    for (const path of ["a", "b", "c"]) {
      await expect(fetchPublicText(`https://example.com/${path}`, opts(t))).rejects.toThrow("INVALID_URL");
    }
    expect(t.calls).toHaveLength(3);
  });

  it("re-resolves and re-checks every redirect hop, then pins the new address", async () => {
    lookup.mockImplementation(async (host: string) =>
      host === "cdn.test" ? [{ address: "203.0.113.9", family: 4 }] : [{ address: "93.184.216.34", family: 4 }],
    );
    const t = transport({
      "https://example.com/": { status: 301, headers: { location: "https://cdn.test/page" } },
      "https://cdn.test/page": { status: 200, body: "<html>moved</html>" },
    });
    const out = await fetchPublicText("https://example.com/", opts(t));
    expect(out.text).toBe("<html>moved</html>");
    expect(out.url.toString()).toBe("https://cdn.test/page");
    expect(lookup.mock.calls.map((c) => c[0])).toEqual(["example.com", "cdn.test"]);
    const seen = await new Promise<unknown>((resolve) =>
      t.calls[1].options.lookup!("cdn.test", {}, (_e: unknown, address: unknown) => resolve(address)),
    );
    expect(seen).toBe("203.0.113.9");
  });

  it("refuses an IPv6 hostname answer that is loopback", async () => {
    lookup.mockImplementation(async () => [{ address: "::1", family: 6 }]);
    const t = transport({});
    await expect(fetchPublicText("https://v6.test/", opts(t))).rejects.toThrow("BLOCKED_URL");
    expect(t.calls).toHaveLength(0);
  });
});
