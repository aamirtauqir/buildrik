/**
 * Unification spec §572 — tRPC sameOrigin assertion.
 *
 * Editor's tRPC clients must target relative `/api/trpc` URLs so requests
 * stay same-origin after unification. Cross-origin literals (full hostname
 * URLs) would force CORS preflights + dashboard CORS middleware (the very
 * thing Phase 4 deletes).
 *
 * Static assertion: scan editor's tRPC client mounts for the literal URL
 * config and confirm it's relative.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const SUBSCRIPTION_CLIENT = resolve(
  __dirname,
  "../../../../editor/src/services/ai/subscriptionClient.ts",
);
const AI_TRPC_CLIENT = resolve(
  __dirname,
  "../../../../editor/src/services/ai/AiTrpcClient.ts",
);

describe("tRPC same-origin (Phase 3)", () => {
  it("subscriptionClient.ts targets /api/trpc (relative)", () => {
    const src = readFileSync(SUBSCRIPTION_CLIENT, "utf-8");
    expect(src).toMatch(/TRPC_URL\s*=\s*['"]\/api\/trpc['"]/);
    // No absolute URL
    expect(src).not.toMatch(/url:\s*['"]https?:\/\//);
  });

  it("AiTrpcClient.ts targets /api/trpc (relative)", () => {
    const src = readFileSync(AI_TRPC_CLIENT, "utf-8");
    expect(src).toMatch(/url:\s*['"]\/api\/trpc['"]/);
    expect(src).not.toMatch(/url:\s*['"]https?:\/\//);
  });

  it("no editor tRPC client sets `Origin` header explicitly", () => {
    const srcs = [
      readFileSync(SUBSCRIPTION_CLIENT, "utf-8"),
      readFileSync(AI_TRPC_CLIENT, "utf-8"),
    ];
    for (const src of srcs) {
      expect(src).not.toMatch(/['"]Origin['"]:/);
      expect(src).not.toMatch(/headers:\s*{[^}]*Origin/);
    }
  });
});
