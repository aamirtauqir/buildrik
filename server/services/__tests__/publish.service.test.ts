import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const getConnMock = vi.fn();
const markInactiveMock = vi.fn();
const createDepMock = vi.fn();

vi.mock("@server/services/integrations.service", () => ({
  getActiveVercelConnection: (...args: unknown[]) => getConnMock(...args),
  markInactive: (...args: unknown[]) => markInactiveMock(...args),
}));

vi.mock("@/lib/vercel", () => ({
  createVercelDeployment: (...args: unknown[]) => createDepMock(...args),
  waitForDeploymentReady: vi.fn(() => Promise.resolve({ readyState: "READY", url: "x.vercel.app", id: "dep_1" })),
  isVercelConfigured: () => false, // dev-sim disabled in tests
  // Shipped 5d2e127d — runVercelDeploy now passes ready + projectName to
  // pickPublicUrl. Mock with passthrough on `d.url`; pickPublicUrl's own
  // alias-vs-fallback logic is tested separately in __tests__/vercel-pickPublicUrl.test.ts.
  pickPublicUrl: (d: { url: string }) => `https://${d.url}`,
  VercelApiError: class extends Error { constructor(public status: number, public code: string, msg: string) { super(msg); } },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {},
}));

// Import after mocks
import { runVercelDeploy } from "@server/services/publish.service";

describe("publish.service Vercel connection gating", () => {
  beforeEach(() => {
    getConnMock.mockReset();
    markInactiveMock.mockReset();
    createDepMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("throws VERCEL_NOT_CONNECTED in production when no active connection", async () => {
    vi.stubEnv("NODE_ENV", "production");
    getConnMock.mockResolvedValueOnce(null);

    await expect(
      runVercelDeploy("ws_1", "buildrik-site-test",[]),
    ).rejects.toThrow("VERCEL_NOT_CONNECTED");
  });

  it("falls through to simulation in development when no active connection", async () => {
    vi.stubEnv("NODE_ENV", "development");
    getConnMock.mockResolvedValueOnce(null);

    // runVercelDeploy returns null in dev/no-connection so caller can fall to sim
    const result = await runVercelDeploy("ws_1", "buildrik-site-test",[]);
    expect(result).toBeNull();
  });

  it("passes {token, teamId} to createVercelDeployment when connection exists", async () => {
    vi.stubEnv("NODE_ENV", "production");
    getConnMock.mockResolvedValueOnce({ id: "intg_1", token: "vt_abc", teamId: "team_x" });
    createDepMock.mockResolvedValueOnce({ id: "dep_1", url: "x.vercel.app", readyState: "READY" });

    await runVercelDeploy("ws_1", "buildrik-site-test",[{ file: "index.html", data: "<p>hi</p>" }]);

    expect(createDepMock).toHaveBeenCalledWith(
      expect.objectContaining({ token: "vt_abc", teamId: "team_x" }),
    );
  });

  it("calls markInactive + throws VERCEL_TOKEN_INVALID on Vercel 401", async () => {
    vi.stubEnv("NODE_ENV", "production");
    getConnMock.mockResolvedValueOnce({ id: "intg_1", token: "vt_old", teamId: null });
    const { VercelApiError } = await import("@/lib/vercel");
    createDepMock.mockRejectedValueOnce(new VercelApiError(401, "UNAUTHORIZED", "Token revoked"));

    await expect(
      runVercelDeploy("ws_1", "buildrik-site-test",[{ file: "index.html", data: "<p>x</p>" }]),
    ).rejects.toThrow("VERCEL_TOKEN_INVALID");

    expect(markInactiveMock).toHaveBeenCalledWith("intg_1");
  });
});
