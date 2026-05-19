import { describe, it, expect, vi, beforeEach } from "vitest";

const authMock = vi.fn();
const checkRoleMock = vi.fn();

vi.mock("@/server/auth", () => ({
  auth: () => authMock(),
}));
vi.mock("@/server/services/sites.service", () => ({
  checkWorkspaceRole: (...args: unknown[]) => checkRoleMock(...args),
}));

process.env.ENCRYPTION_KEY = "0".repeat(64);
process.env.VERCEL_INTEGRATION_ID = "buildrik";

import { GET } from "./route";

describe("GET /api/integrations/vercel/authorize", () => {
  beforeEach(() => {
    authMock.mockReset();
    checkRoleMock.mockReset();
  });

  it("returns 401 when no session", async () => {
    authMock.mockResolvedValueOnce(null);
    const req = new Request("http://localhost:3000/api/integrations/vercel/authorize?workspaceId=ws_1");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 when workspaceId missing", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "u_1" } });
    const req = new Request("http://localhost:3000/api/integrations/vercel/authorize");
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it("returns 403 when user is not OWNER or ADMIN", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "u_1" } });
    checkRoleMock.mockRejectedValueOnce(new Error("FORBIDDEN"));
    const req = new Request("http://localhost:3000/api/integrations/vercel/authorize?workspaceId=ws_1");
    const res = await GET(req);
    expect(res.status).toBe(403);
  });

  it("returns 302 redirect to vercel.com with state for OWNER", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "u_1" } });
    checkRoleMock.mockResolvedValueOnce(undefined);
    const req = new Request("http://localhost:3000/api/integrations/vercel/authorize?workspaceId=ws_1");
    const res = await GET(req);
    expect(res.status).toBe(302);
    const loc = res.headers.get("Location") ?? "";
    expect(loc).toContain("vercel.com/integrations/buildrik/new");
    expect(loc).toContain("state=");
  });
});
