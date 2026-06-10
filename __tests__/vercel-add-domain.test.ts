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

  it("treats 409 already-in-use as idempotent success", async () => {
    mockFetch(409, { error: { code: "domain_already_in_use", message: "in use" } });
    const res = await addDomainToVercelProject({ token: "t", teamId: null, projectName: "p", domain: "x.com" });
    expect(res.verified).toBe(true);
    expect(res.name).toBe("x.com");
  });

  it("throws VercelApiError on other failures", async () => {
    mockFetch(403, { error: { code: "forbidden", message: "nope" } });
    await expect(
      addDomainToVercelProject({ token: "t", teamId: null, projectName: "p", domain: "x.com" }),
    ).rejects.toBeInstanceOf(VercelApiError);
  });
});
