// Regression: SSRF guard for webhook URLs (flagged on the test-event commit).
// Found by automated security review 2026-06-12.
import { describe, it, expect, vi } from "vitest";

vi.mock("node:dns/promises", () => ({
  default: {
    lookup: vi.fn(async (host: string) => {
      if (host === "evil.example.com") return [{ address: "169.254.169.254" }];
      if (host === "rebind.example.com") return [{ address: "10.0.0.5" }];
      if (host === "good.example.com") return [{ address: "93.184.216.34" }];
      return [{ address: "8.8.8.8" }];
    }),
  },
}));

import { assertPublicHttpsUrl } from "@/lib/url-guard";

describe("assertPublicHttpsUrl (SSRF guard)", () => {
  it("rejects non-https schemes", async () => {
    await expect(assertPublicHttpsUrl("http://good.example.com/")).rejects.toThrow("INVALID_URL");
    await expect(assertPublicHttpsUrl("file:///etc/passwd")).rejects.toThrow("INVALID_URL");
    await expect(assertPublicHttpsUrl("not a url")).rejects.toThrow("INVALID_URL");
  });

  it("rejects literal loopback / private / metadata IPs", async () => {
    await expect(assertPublicHttpsUrl("https://127.0.0.1/")).rejects.toThrow("BLOCKED_URL");
    await expect(assertPublicHttpsUrl("https://169.254.169.254/latest/meta-data/")).rejects.toThrow("BLOCKED_URL");
    await expect(assertPublicHttpsUrl("https://10.1.2.3/")).rejects.toThrow("BLOCKED_URL");
    await expect(assertPublicHttpsUrl("https://192.168.0.1/")).rejects.toThrow("BLOCKED_URL");
    await expect(assertPublicHttpsUrl("https://[::1]/")).rejects.toThrow("BLOCKED_URL");
  });

  it("rejects hostnames that resolve to a private/metadata address", async () => {
    await expect(assertPublicHttpsUrl("https://evil.example.com/")).rejects.toThrow("BLOCKED_URL");
    await expect(assertPublicHttpsUrl("https://rebind.example.com/")).rejects.toThrow("BLOCKED_URL");
  });

  it("allows a public https URL", async () => {
    const url = await assertPublicHttpsUrl("https://good.example.com/hook");
    expect(url.hostname).toBe("good.example.com");
  });
});
