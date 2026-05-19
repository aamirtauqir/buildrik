import { describe, it, expect, vi, beforeEach } from "vitest";

const ORIGINAL_KEY = process.env.ENCRYPTION_KEY;
const ORIGINAL_CLIENT = process.env.VERCEL_CLIENT_ID;
const ORIGINAL_SECRET = process.env.VERCEL_CLIENT_SECRET;
const ORIGINAL_INTG = process.env.VERCEL_INTEGRATION_ID;

beforeEach(() => {
  process.env.ENCRYPTION_KEY = "0".repeat(64);
  process.env.VERCEL_CLIENT_ID = "oac_test";
  process.env.VERCEL_CLIENT_SECRET = "secret_test";
  process.env.VERCEL_INTEGRATION_ID = "buildrik";
});

afterAll(() => {
  process.env.ENCRYPTION_KEY = ORIGINAL_KEY;
  process.env.VERCEL_CLIENT_ID = ORIGINAL_CLIENT;
  process.env.VERCEL_CLIENT_SECRET = ORIGINAL_SECRET;
  process.env.VERCEL_INTEGRATION_ID = ORIGINAL_INTG;
});

import {
  buildAuthUrl,
  buildStateToken,
  verifyState,
  exchangeCodeForToken,
} from "@server/services/vercel-oauth.service";

describe("buildAuthUrl", () => {
  it("includes integration slug, state, redirect_uri", () => {
    const url = buildAuthUrl("ws_1", "u_1", "http://localhost:3000");
    expect(url).toContain("vercel.com/integrations/buildrik/new");
    expect(url).toContain("state=");
    // Vercel integration install URL embeds state via query param
  });

  it("throws if VERCEL_INTEGRATION_ID is missing", () => {
    delete process.env.VERCEL_INTEGRATION_ID;
    expect(() => buildAuthUrl("ws_1", "u_1", "http://localhost:3000"))
      .toThrow(/VERCEL_INTEGRATION_ID/);
  });
});

describe("state token round-trip", () => {
  it("buildStateToken → verifyState returns same {workspaceId, userId}", () => {
    const token = buildStateToken("ws_1", "u_1");
    const decoded = verifyState(token);
    expect(decoded).toEqual({ workspaceId: "ws_1", userId: "u_1" });
  });

  it("verifyState returns null on HMAC-tampered token", () => {
    const token = buildStateToken("ws_1", "u_1");
    const [body] = token.split(".");
    const tampered = `${body}.deadbeef`;
    expect(verifyState(tampered)).toBeNull();
  });

  it("verifyState returns null on expired token", () => {
    // mock clock via vi.useFakeTimers
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    const token = buildStateToken("ws_1", "u_1");
    vi.setSystemTime(new Date("2026-01-01T01:00:00Z")); // 1 hour later, past 10min exp
    expect(verifyState(token)).toBeNull();
    vi.useRealTimers();
  });

  it("verifyState returns null on malformed payload", () => {
    expect(verifyState("not.a.valid.token")).toBeNull();
    expect(verifyState("nodot")).toBeNull();
  });
});

describe("exchangeCodeForToken", () => {
  it("posts to /v2/oauth/access_token with correct body", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({
        access_token: "vt_real",
        token_type: "Bearer",
        user_id: "vercel_u_1",
        team_id: "team_1",
        installation_id: "icfg_1",
      }), { status: 200 }),
    );

    const result = await exchangeCodeForToken("auth_code_xyz", "http://localhost:3000/cb");

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://api.vercel.com/v2/oauth/access_token",
      expect.objectContaining({ method: "POST" }),
    );
    expect(result).toEqual({
      accessToken: "vt_real",
      vercelUserId: "vercel_u_1",
      teamId: "team_1",
      configurationId: "icfg_1",
    });

    fetchSpy.mockRestore();
  });

  it("throws on 4xx", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "invalid_code" }), { status: 400 }),
    );
    await expect(exchangeCodeForToken("bad_code", "http://x")).rejects.toThrow();
    fetchSpy.mockRestore();
  });
});
