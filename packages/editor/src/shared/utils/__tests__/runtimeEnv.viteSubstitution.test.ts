/**
 * Regression: `runtimeEnv.ts` must read `import.meta.env` as a literal member
 * expression.
 *
 * Vite resolves env by static TEXT replacement of exactly `import.meta.env`.
 * The file used to alias it first — `const meta = import.meta; meta?.env` —
 * which leaves Vite nothing to replace. The browser's native `import.meta`
 * has no `env`, so every VITE_* var read as undefined: the Publish button
 * stayed hidden with `VITE_FEATURE_PUBLISH=true` set, and DASHBOARD_URL fell
 * through to `window.location.origin` (the Vite origin, not the dashboard).
 *
 * This is asserted against the SOURCE TEXT on purpose. A runtime test cannot
 * catch it: under Vitest `import.meta.env` is a real populated object, so the
 * aliased form works there and fails only in a real browser bundle.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const RAW = readFileSync(resolve(__dirname, "../runtimeEnv.ts"), "utf8");
// Strip comments before matching. The file explains the banned pattern in
// prose, and a source-text assertion that reads its own documentation finds
// the bug it was told to look for.
const SRC = RAW.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");

describe("runtimeEnv env substitution", () => {
  it("reads the literal import.meta.env member expression", () => {
    expect(SRC).toMatch(/import\.meta[^\n]*\)\.env|import\.meta\.env/);
  });

  it("never aliases import.meta into a variable before reaching .env", () => {
    // `const meta = import.meta` / `let m = import.meta` — the exact shape that
    // defeated the replacement.
    const aliased = /(?:const|let|var)\s+\w+\s*(?::[^=]+)?=\s*import\.meta\s*(?:as[^;]*)?;/;
    expect(SRC).not.toMatch(aliased);
  });

  it("keeps the process.env fallback for the Next.js bundle", () => {
    // Unified-editor mode bundles this file through Next, where import.meta
    // carries no env — the second source has to stay.
    expect(SRC).toMatch(/process\.env/);
  });
});

/**
 * The same rule, for the OTHER bundler. This half was missing, and the identical
 * bug promptly reappeared on the Next side: `readProcessEnv()` returned
 * `process.env` wholesale and `pick()` indexed it as `proc[nextKey]`, so
 * Next/Turbopack — which substitutes the exact text `process.env.NEXT_PUBLIC_X`
 * — had nothing to replace. In the unified-editor browser bundle there is no
 * `process` binding at all, so every NEXT_PUBLIC_* read as undefined and every
 * feature flag was permanently false in the shipping path (verified in-browser
 * 2026-08-05: `typeof process === "undefined"`).
 *
 * Source-text assertion again, and for the same reason: under Vitest `process`
 * is real and populated, so the broken form passes at runtime and fails only in
 * a browser bundle.
 */
describe("runtimeEnv Next substitution", () => {
  const NEXT_KEYS = [...new Set(SRC.match(/NEXT_PUBLIC_[A-Z0-9_]+/g) ?? [])];

  it("references at least one NEXT_PUBLIC_ key (guard is wired to something)", () => {
    expect(NEXT_KEYS.length).toBeGreaterThan(0);
  });

  it.each(NEXT_KEYS)("reads %s as a literal process.env member expression", (key) => {
    expect(SRC).toContain(`process.env.${key}`);
  });

  it("never returns process.env wholesale from the Next reader", () => {
    // Scoped to the Next reader on purpose: readViteEnv legitimately returns
    // process.env on the Node/Vitest path (that is how VITE_* reach the tests).
    // The bug was the NEXT side doing it — `return process.env as EnvMap` there
    // leaves the bundler nothing to substitute.
    const start = SRC.indexOf("function readNextEnv");
    expect(start).toBeGreaterThan(-1);
    const nextReader = SRC.slice(start, SRC.indexOf("\nconst ", start));
    expect(nextReader).not.toMatch(/return\s+process\.env\s*(?:as[^;]*)?;/);
  });
});
