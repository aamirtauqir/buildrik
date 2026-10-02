import { describe, it, expect, vi } from "vitest";

vi.mock("@server/trpc/router", () => ({ appRouter: {} }));
vi.mock("@server/trpc/trpc", () => ({ createTRPCContext: () => ({}) }));
vi.mock("@trpc/server/adapters/fetch", () => ({
  fetchRequestHandler: () => Promise.resolve(new Response("[]", { status: 200 })),
}));

import { POST } from "./route";

function post(origin: string | null, host: string) {
  const headers: Record<string, string> = { host, "content-type": "application/json" };
  if (origin) headers.origin = origin;
  return new Request(`http://${host}/api/trpc/auth.login?batch=1`, {
    method: "POST",
    headers,
    body: "{}",
  });
}

describe("tRPC origin pin", () => {
  it("accepts the configured app origin", async () => {
    const res = await POST(post("http://localhost:3000", "localhost:3000"));
    expect(res.status).toBe(200);
  });

  // Login from 127.0.0.1, the dev server's LAN "Network" URL, or a worktree on
  // another port is same-origin — the page and the API share a host — so it is
  // not CSRF. It used to 403 with a text body the client failed to JSON.parse.
  it.each([
    ["http://127.0.0.1:3000", "127.0.0.1:3000"],
    ["http://192.168.1.20:3000", "192.168.1.20:3000"],
    ["http://localhost:3160", "localhost:3160"],
  ])("accepts a same-origin POST from %s", async (origin, host) => {
    const res = await POST(post(origin, host));
    expect(res.status).toBe(200);
  });

  it("refuses a same-origin POST off the allowlist in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    try {
      const res = await POST(post("http://attacker.example", "attacker.example"));
      expect(res.status).toBe(403);
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("refuses a cross-origin POST", async () => {
    const res = await POST(post("https://evil.example", "localhost:3000"));
    expect(res.status).toBe(403);
  });

  it("refuses a POST with no Origin and no Authorization", async () => {
    const res = await POST(post(null, "localhost:3000"));
    expect(res.status).toBe(403);
  });
});
