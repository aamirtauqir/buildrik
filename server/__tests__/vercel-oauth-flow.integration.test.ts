import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";

const fetchMock = vi.spyOn(globalThis, "fetch");
const ORIGINAL_KEY = process.env.ENCRYPTION_KEY;
const ORIGINAL_INTG = process.env.VERCEL_INTEGRATION_ID;
const ORIGINAL_CLIENT = process.env.VERCEL_CLIENT_ID;
const ORIGINAL_SECRET = process.env.VERCEL_CLIENT_SECRET;

beforeEach(() => {
  process.env.ENCRYPTION_KEY = "0".repeat(64);
  process.env.VERCEL_INTEGRATION_ID = "buildrik";
  process.env.VERCEL_CLIENT_ID = "oac_test";
  process.env.VERCEL_CLIENT_SECRET = "secret_test";
  fetchMock.mockReset();
});

afterAll(() => {
  process.env.ENCRYPTION_KEY = ORIGINAL_KEY;
  process.env.VERCEL_INTEGRATION_ID = ORIGINAL_INTG;
  process.env.VERCEL_CLIENT_ID = ORIGINAL_CLIENT;
  process.env.VERCEL_CLIENT_SECRET = ORIGINAL_SECRET;
  fetchMock.mockRestore();
});

import {
  buildStateToken,
  verifyState,
  exchangeCodeForToken,
  listTeams,
} from "@/server/services/vercel-oauth.service";
import { encrypt, decrypt } from "@/lib/encryption";

describe("Vercel OAuth flow (integration, mocked HTTP)", () => {
  it("completes happy-path: state → code exchange → listTeams → encrypt roundtrip", async () => {
    const state = buildStateToken("ws_1", "u_1");
    expect(state).toContain(".");
    expect(verifyState(state)).toEqual({ workspaceId: "ws_1", userId: "u_1" });

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({
        access_token: "vt_real_secret",
        token_type: "Bearer",
        user_id: "vu_1",
        team_id: null,
        installation_id: "icfg_42",
      }), { status: 200 }),
    );

    const tokenResult = await exchangeCodeForToken("code_xyz", "http://localhost:3000/cb");
    expect(tokenResult.accessToken).toBe("vt_real_secret");
    expect(tokenResult.configurationId).toBe("icfg_42");
    expect(tokenResult.teamId).toBeNull();

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({
        teams: [{ id: "team_alpha", name: "Alpha", slug: "alpha" }],
      }), { status: 200 }),
    );
    const teams = await listTeams(tokenResult.accessToken);
    expect(teams).toEqual([{ id: "team_alpha", name: "Alpha", slug: "alpha" }]);

    const cipher = encrypt(tokenResult.accessToken);
    expect(cipher).not.toContain("vt_real_secret");
    expect(decrypt(cipher)).toBe("vt_real_secret");
  });

  it("401 from Vercel API simulates token-invalid recovery shape", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response("", { status: 401 }),
    );
    const teams = await listTeams("expired_token");
    expect(teams).toEqual([]);
  });

  it("encrypt → decrypt isolates token leak (cipher never contains plaintext)", () => {
    const token = "vt_super_secret_AAAA";
    const cipher = encrypt(token);
    expect(cipher).not.toContain(token);
    expect(cipher.split(":").length).toBe(4);
    expect(decrypt(cipher)).toBe(token);
  });
});
