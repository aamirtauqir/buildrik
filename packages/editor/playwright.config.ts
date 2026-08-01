/**
 * Editor style-parity harness — local Chromium ONLY, by design.
 *
 * This config deliberately does NOT read BROWSERSTACK_USERNAME /
 * BROWSERSTACK_ACCESS_KEY. The dashboard's config diverts to BrowserStack the
 * moment those two vars exist (playwright.config.ts:13), and they ARE set in
 * this repo's root .env.local — which is how 81 dashboard tests once "passed"
 * while actually being skipped. A parity harness that silently runs somewhere
 * else is worse than no harness, because its green is a lie about the CSS
 * pipeline on THIS machine.
 *
 * The guard below turns that failure mode into a loud one.
 *
 * @license BSD-3-Clause
 */
import { defineConfig, devices } from "@playwright/test";

if (process.env.PW_ALLOW_REMOTE !== "true" && (process.env.BROWSERSTACK_USERNAME || process.env.BROWSERSTACK_ACCESS_KEY)) {
  throw new Error(
    "BrowserStack credentials are present in the environment. The editor style-parity " +
      "harness must run against local Chromium with the real CSS pipeline, or its results " +
      "mean nothing. Unset BROWSERSTACK_USERNAME/BROWSERSTACK_ACCESS_KEY for this run, or " +
      "set PW_ALLOW_REMOTE=true if you genuinely intend a remote run.",
  );
}

const PORT = 5051;

export default defineConfig({
  testDir: "./e2e",
  // Parity baselines are exact computed-value comparisons. A retry cannot fix
  // a wrong colour, and retrying would only hide a flaky mount.
  retries: 0,
  fullyParallel: true,
  reporter: process.env.CI ? "list" : [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    // Deterministic box model: parity numbers include px sizes.
    viewport: { width: 1440, height: 900 },
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // The probe page is served by the normal Vite pipeline, so it gets the
    // same Tailwind + token CSS the app does. Anything less and the harness
    // would be measuring a different cascade than production.
    // Positional root, NOT --root: vite.config.ts sets root to ./demo, so the
    // probe page would 404 into the demo SPA fallback and the harness would
    // measure demo/index.html. Vite 7 takes root positionally; --root is not
    // a flag and exits with `Unknown option`.
    command: `npx vite . --port ${PORT} --strictPort`,
    port: PORT,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
