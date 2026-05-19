import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const exchangeMock = vi.fn();
const listTeamsMock = vi.fn();

vi.mock("@/server/services/vercel-oauth.service", async () => {
  const actual = await vi.importActual("@/server/services/vercel-oauth.service");
  return {
    ...actual,
    exchangeCodeForToken: (...args: unknown[]) => exchangeMock(...args),
    listTeams: (...args: unknown[]) => listTeamsMock(...args),
  };
});

beforeEach(() => {
  vi.stubEnv("ENCRYPTION_KEY", "0".repeat(64));
  vi.stubEnv("VERCEL_INTEGRATION_ID", "buildrik");
  exchangeMock.mockReset();
  listTeamsMock.mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

import { GET } from "./route";
import { buildStateToken } from "@/server/services/vercel-oauth.service";

describe("GET /api/integrations/vercel/callback", () => {
  it("returns 400 when ?code missing", async () => {
    const req = new Request("http://localhost:3000/api/integrations/vercel/callback?state=anything");
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it("redirects to settings?error=oauth_state_invalid on tampered state", async () => {
    const req = new Request("http://localhost:3000/api/integrations/vercel/callback?code=c&state=bad.token");
    const res = await GET(req);
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toContain("error=oauth_state_invalid");
  });

  it("redirects to settings?error=oauth_denied on Vercel exchange 4xx", async () => {
    const state = buildStateToken("ws_1", "u_1");
    exchangeMock.mockRejectedValueOnce(new Error("Vercel /access_token failed: 400"));
    const req = new Request(`http://localhost:3000/api/integrations/vercel/callback?code=c&state=${state}`);
    const res = await GET(req);
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toContain("error=oauth_denied");
  });

  it("sets pending cookie + redirects to team-picker on success", async () => {
    const state = buildStateToken("ws_1", "u_1");
    exchangeMock.mockResolvedValueOnce({
      accessToken: "vt_x",
      vercelUserId: "vu_1",
      teamId: null,
      configurationId: "icfg_1",
    });
    listTeamsMock.mockResolvedValueOnce([{ id: "t_1", name: "My Team", slug: "myteam" }]);

    const req = new Request(`http://localhost:3000/api/integrations/vercel/callback?code=c&state=${state}`);
    const res = await GET(req);

    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toContain("vercel-team-picker");
    const setCookie = res.headers.get("Set-Cookie") ?? "";
    expect(setCookie).toContain("buildrik_vercel_pending=");
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie.toLowerCase()).toContain("samesite=strict");
  });

  it("when Vercel returned team_id, skips listTeams but still routes through team-picker", async () => {
    const state = buildStateToken("ws_1", "u_1");
    exchangeMock.mockResolvedValueOnce({
      accessToken: "vt_x",
      vercelUserId: "vu_1",
      teamId: "team_already_picked",
      configurationId: "icfg_1",
    });

    const req = new Request(`http://localhost:3000/api/integrations/vercel/callback?code=c&state=${state}`);
    const res = await GET(req);
    expect(res.status).toBe(302);
    // still routes through team-picker so user can confirm + finishConnect runs
    expect(res.headers.get("Location")).toContain("vercel-team-picker");
  });
});
