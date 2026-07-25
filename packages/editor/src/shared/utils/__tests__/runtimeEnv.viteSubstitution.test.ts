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
