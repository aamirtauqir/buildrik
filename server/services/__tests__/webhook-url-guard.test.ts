/**
 * SSRF guard on workspace-webhook URLs (P6 security review). The endpoint is
 * admin-supplied and fetched from the server, so private/loopback/link-local
 * targets must be rejected in production. Literal-IP paths only — no live DNS.
 */
import { describe, it, expect, vi, afterEach } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import { isPrivateAddress, assertSafeWebhookUrl } from "../webhook.service";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("isPrivateAddress", () => {
  it.each([
    "127.0.0.1",
    "10.0.0.5",
    "172.16.0.1",
    "172.31.255.255",
    "192.168.1.1",
    "169.254.169.254", // cloud metadata
    "0.0.0.0",
    "100.64.0.1", // CGNAT
    "::1",
    "::",
    "::ffff:127.0.0.1",
    "::ffff:10.1.2.3",
    "fe80::1",
    "fd00::1",
    "fc00::abcd",
  ])("blocks %s", (ip) => {
    expect(isPrivateAddress(ip)).toBe(true);
  });

  it.each(["8.8.8.8", "76.76.21.21", "172.15.0.1", "172.32.0.1", "2606:4700::1111", "::ffff:8.8.8.8"])(
    "allows public %s",
    (ip) => {
      expect(isPrivateAddress(ip)).toBe(false);
    },
  );
});

describe("assertSafeWebhookUrl (production)", () => {
  it("rejects http, private literals, and metadata; allows public https", async () => {
    vi.stubEnv("NODE_ENV", "production");
    await expect(assertSafeWebhookUrl("http://example.com/hook")).rejects.toThrow("WEBHOOK_URL_UNSAFE");
    await expect(assertSafeWebhookUrl("https://127.0.0.1/hook")).rejects.toThrow("WEBHOOK_URL_UNSAFE");
    await expect(assertSafeWebhookUrl("https://169.254.169.254/latest/meta-data")).rejects.toThrow(
      "WEBHOOK_URL_UNSAFE",
    );
    await expect(assertSafeWebhookUrl("https://[::1]/hook")).rejects.toThrow("WEBHOOK_URL_UNSAFE");
    await expect(assertSafeWebhookUrl("https://8.8.8.8/hook")).resolves.toBeUndefined();
  });
});

describe("assertSafeWebhookUrl (dev)", () => {
  it("allows http + localhost so local receivers keep working", async () => {
    vi.stubEnv("NODE_ENV", "test");
    await expect(assertSafeWebhookUrl("http://localhost:4567/hook")).resolves.toBeUndefined();
    await expect(assertSafeWebhookUrl("ftp://example.com/x")).rejects.toThrow("WEBHOOK_URL_UNSAFE");
  });
});
