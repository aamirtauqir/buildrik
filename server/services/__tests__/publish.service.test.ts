import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const getConnMock = vi.fn();
const markInactiveMock = vi.fn();
const createDepMock = vi.fn();
const setPwMock = vi.fn();
const deleteDepMock = vi.fn();

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
  setProjectPasswordProtection: (...args: unknown[]) => setPwMock(...args),
  deleteVercelDeployment: (...args: unknown[]) => deleteDepMock(...args),
  VercelApiError: class extends Error { constructor(public status: number, public code: string, msg: string) { super(msg); } },
}));

const jobFindUniqueMock = vi.fn();
const jobFindFirstMock = vi.fn();
const siteFindUniqueMock = vi.fn();
const siteUpdateMock = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    publishBuildJob: {
      findUnique: (...a: unknown[]) => jobFindUniqueMock(...a),
      findFirst: (...a: unknown[]) => jobFindFirstMock(...a),
    },
    site: {
      findUnique: (...a: unknown[]) => siteFindUniqueMock(...a),
      update: (...a: unknown[]) => siteUpdateMock(...a),
    },
  },
}));

// Import after mocks
import { runVercelDeploy, getPublishStatus, unpublishSite } from "@server/services/publish.service";

describe("unpublishSite — takes the deployment down on Vercel", () => {
  beforeEach(() => {
    getConnMock.mockReset();
    deleteDepMock.mockReset();
    siteFindUniqueMock.mockReset();
    jobFindFirstMock.mockReset();
    siteUpdateMock.mockReset();
    siteUpdateMock.mockResolvedValue({ id: "s1", status: "DRAFT" });
  });

  it("deletes the last production deployment, then flips to DRAFT", async () => {
    siteFindUniqueMock.mockResolvedValue({ workspaceId: "ws1" });
    jobFindFirstMock.mockResolvedValue({ deploymentId: "dep_9" });
    getConnMock.mockResolvedValue({ id: "i1", token: "tok", teamId: "team_1" });
    await unpublishSite("s1");
    expect(deleteDepMock).toHaveBeenCalledWith(
      expect.objectContaining({ deploymentId: "dep_9", token: "tok", teamId: "team_1" }),
    );
    expect(siteUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "DRAFT", publishedUrl: null } }),
    );
  });

  it("still flips to DRAFT when the Vercel delete throws (best-effort)", async () => {
    siteFindUniqueMock.mockResolvedValue({ workspaceId: "ws1" });
    jobFindFirstMock.mockResolvedValue({ deploymentId: "dep_9" });
    getConnMock.mockResolvedValue({ id: "i1", token: "tok", teamId: null });
    deleteDepMock.mockRejectedValue(new Error("Vercel 500"));
    await expect(unpublishSite("s1")).resolves.toMatchObject({ status: "DRAFT" });
    expect(siteUpdateMock).toHaveBeenCalledTimes(1);
  });

  it("skips the Vercel call when the site has no completed deployment", async () => {
    siteFindUniqueMock.mockResolvedValue({ workspaceId: "ws1" });
    jobFindFirstMock.mockResolvedValue(null);
    await unpublishSite("s1");
    expect(deleteDepMock).not.toHaveBeenCalled();
    expect(siteUpdateMock).toHaveBeenCalledTimes(1);
  });
});

describe("getPublishStatus — never leaks the raw-HTML `log` column", () => {
  beforeEach(() => jobFindUniqueMock.mockReset());

  it("selects status fields + siteId but NOT log", async () => {
    jobFindUniqueMock.mockResolvedValueOnce({ id: "job-1", siteId: "site-1", status: "BUILDING" });
    await getPublishStatus("job-1");
    const arg = jobFindUniqueMock.mock.calls[0][0];
    expect(arg.select.log).toBeUndefined(); // log must never be selected
    expect(arg.select.siteId).toBe(true); // needed for the router authz check
    expect(arg.select.status).toBe(true);
    expect(arg.select.progress).toBe(true);
  });
});

describe("publish.service Vercel connection gating", () => {
  beforeEach(() => {
    getConnMock.mockReset();
    markInactiveMock.mockReset();
    createDepMock.mockReset();
    setPwMock.mockReset();
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

  // Clearing password protection (password=null) on a project that has none
  // returns Vercel 404 "Password Protection not found". That is the desired end
  // state already, so it must NOT fail the deploy.
  it("swallows Vercel 404 from password-protection clear and still returns the URL", async () => {
    vi.stubEnv("NODE_ENV", "production");
    getConnMock.mockResolvedValueOnce({ id: "intg_1", token: "vt_abc", teamId: "team_x" });
    createDepMock.mockResolvedValueOnce({ id: "dep_1", url: "x.vercel.app", readyState: "READY" });
    const { VercelApiError } = await import("@/lib/vercel");
    setPwMock.mockRejectedValueOnce(new VercelApiError(404, "not_found", "Password Protection not found."));

    const result = await runVercelDeploy(
      "ws_1", "buildrik-site-test", [{ file: "index.html", data: "<p>hi</p>" }], null,
    );

    expect(result).toEqual({ url: "https://x.vercel.app", deploymentId: "dep_1" });
    expect(setPwMock).toHaveBeenCalledWith(expect.objectContaining({ password: null }));
  });

  it("re-throws a non-plan-gating password-protection error (e.g. 500)", async () => {
    vi.stubEnv("NODE_ENV", "production");
    getConnMock.mockResolvedValueOnce({ id: "intg_1", token: "vt_abc", teamId: "team_x" });
    createDepMock.mockResolvedValueOnce({ id: "dep_1", url: "x.vercel.app", readyState: "READY" });
    const { VercelApiError } = await import("@/lib/vercel");
    setPwMock.mockRejectedValueOnce(new VercelApiError(500, "internal", "Vercel API 500"));

    await expect(
      runVercelDeploy("ws_1", "buildrik-site-test", [{ file: "index.html", data: "<p>hi</p>" }], "secret"),
    ).rejects.toThrow("Vercel API 500");
  });
});
