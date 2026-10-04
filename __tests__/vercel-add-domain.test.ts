import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { addDomainToVercelProject, VercelApiError } from "@/lib/vercel";

const realFetch = global.fetch;

function mockFetch(status: number, body: unknown) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }) as unknown as typeof fetch;
}

beforeEach(() => vi.clearAllMocks());
afterEach(() => {
  global.fetch = realFetch;
});

describe("addDomainToVercelProject", () => {
  it("POSTs to the project domains endpoint with the domain name", async () => {
    mockFetch(200, { name: "x.com", verified: false, verification: [] });
    await addDomainToVercelProject({ token: "t", teamId: "team_1", projectName: "buildrik-site-x", domain: "x.com" });
    const call = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[0]).toContain("/v10/projects/buildrik-site-x/domains");
    expect(call[0]).toContain("teamId=team_1");
    expect(call[1].method).toBe("POST");
    expect(JSON.parse(call[1].body)).toEqual({ name: "x.com" });
    expect(call[1].headers.Authorization).toBe("Bearer t");
  });

  it("returns verification records when not yet verified", async () => {
    mockFetch(200, {
      name: "x.com",
      verified: false,
      verification: [{ type: "TXT", domain: "_vercel.x.com", value: "vc-123" }],
    });
    const res = await addDomainToVercelProject({ token: "t", teamId: null, projectName: "p", domain: "x.com" });
    expect(res.verified).toBe(false);
    expect(res.verification).toHaveLength(1);
    expect(res.verification[0].value).toBe("vc-123");
  });

  /* Docs (add-a-domain-to-a-project): 409 = "The domain is already assigned
     to another Vercel project". It was read as verified: true. */
  it("throws a 409 VercelApiError — a domain on another project is never verified", async () => {
    mockFetch(409, { error: { code: "domain_already_in_use", message: "The domain is already assigned to another Vercel project" } });
    const err = await addDomainToVercelProject({ token: "t", teamId: null, projectName: "p", domain: "x.com" }).catch((e) => e);
    expect(err).toBeInstanceOf(VercelApiError);
    expect(err.status).toBe(409);
  });

  it("parses the documented 200 shape, apexName included", async () => {
    mockFetch(200, {
      name: "shop.x.com",
      apexName: "x.com",
      projectId: "prj_123",
      verified: true,
      createdAt: 1727000000000,
      updatedAt: 1727000000000,
      redirect: null,
      redirectStatusCode: null,
      gitBranch: null,
      customEnvironmentId: null,
    });
    const res = await addDomainToVercelProject({ token: "t", teamId: null, projectName: "p", domain: "shop.x.com" });
    expect(res).toEqual({ name: "shop.x.com", apexName: "x.com", verified: true, verification: [] });
  });

  it("throws VercelApiError on other failures", async () => {
    mockFetch(403, { error: { code: "forbidden", message: "nope" } });
    await expect(
      addDomainToVercelProject({ token: "t", teamId: null, projectName: "p", domain: "x.com" }),
    ).rejects.toBeInstanceOf(VercelApiError);
  });
});
