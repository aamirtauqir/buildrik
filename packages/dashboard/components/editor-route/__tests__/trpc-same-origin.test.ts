/**
 * Unification spec §572 — tRPC sameOrigin assertion.
 *
 * Editor's tRPC clients must target relative `/api/trpc` URLs so requests
 * stay same-origin after unification. Cross-origin literals (full hostname
 * URLs) would force CORS preflights + dashboard CORS middleware (the very
 * thing Phase 4 deletes).
 *
 * Static assertion: scan the editor's tRPC client (`services/api-client.ts`,
 * the only one left after the AI clients were removed 2026-10-20) for an
 * absolute URL literal or an explicit Origin header.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const API_CLIENT = resolve(
  __dirname,
  "../../../../editor/src/services/api-client.ts",
);

describe("tRPC same-origin (Phase 3)", () => {
  it("api-client.ts builds its URL on the caller's base, never an absolute literal", () => {
    const src = readFileSync(API_CLIENT, "utf-8");
    expect(src).toMatch(/url:\s*`\$\{baseUrl\}\/api\/trpc`/);
    expect(src).not.toMatch(/url:\s*['"`]https?:\/\//);
  });

  it("no editor tRPC client sets `Origin` header explicitly", () => {
    const src = readFileSync(API_CLIENT, "utf-8");
    expect(src).not.toMatch(/['"]Origin['"]:/);
    expect(src).not.toMatch(/headers:\s*{[^}]*Origin/);
  });
});
