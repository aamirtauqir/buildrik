import path from "node:path";
import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

// Playwright doesn't read Next's env for us — load .env.local (DATABASE_URL for
// the magic-link mint, NEXT_PUBLIC_* etc.) then .env as a fallback.
dotenv.config({ path: path.resolve(__dirname, ".env.local") });
dotenv.config({ path: path.resolve(__dirname, ".env") });

const BASE_URL = process.env.PW_BASE_URL ?? "http://localhost:3000";
const AUTH_STATE = path.resolve(__dirname, "e2e/.auth/user.json");
const ONBOARDING_AUTH_STATE = path.resolve(__dirname, "e2e/.auth/onboarding.json");
const isBS = !!(process.env.BROWSERSTACK_USERNAME && process.env.BROWSERSTACK_ACCESS_KEY);

function bsConnect(caps: Record<string, unknown>) {
  const merged = {
    ...caps,
    "browserstack.username": process.env.BROWSERSTACK_USERNAME,
    "browserstack.accessKey": process.env.BROWSERSTACK_ACCESS_KEY,
    "browserstack.local": "true",
    project: "Buildrick Dashboard",
    build: `dashboard-${process.env.PW_BUILD ?? "local"}`,
  };
  return {
    connectOptions: {
      wsEndpoint: `wss://cdp.browserstack.com/playwright?caps=${encodeURIComponent(JSON.stringify(merged))}`,
    },
  };
}

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  // BrowserStack Local tunnel — only when running against the cloud grid.
  globalSetup: isBS ? require.resolve("./e2e/browserstack-local") : undefined,
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  // Reuse the dev server you already have on :3000; start one only if absent.
  webServer: process.env.PW_NO_SERVER
    ? undefined
    : {
        command: "pnpm dev",
        url: `${BASE_URL}/auth`,
        reuseExistingServer: true,
        timeout: 120_000,
      },
  projects: [
    // Auth runs locally (session cookie is for localhost); the cloud browsers
    // reuse the saved state through the tunnel.
    { name: "setup", testMatch: /auth\.setup\.ts/, use: { ...devices["Desktop Chrome"] } },
    // Separate fixture: authenticates the same QA user but resets OnboardingState
    // so specs that depend on it land inside the wizard instead of /dashboard.
    { name: "setup-onboarding", testMatch: /onboarding\.setup\.ts/, use: { ...devices["Desktop Chrome"] } },

    ...(isBS
      ? [
          {
            name: "bs-chrome-win11",
            use: { ...bsConnect({ browser: "chrome", browser_version: "latest", os: "Windows", os_version: "11" }), storageState: AUTH_STATE },
            dependencies: ["setup"],
          },
          {
            name: "bs-firefox-win11",
            use: { ...bsConnect({ browser: "playwright-firefox", browser_version: "latest", os: "Windows", os_version: "11" }), storageState: AUTH_STATE },
            dependencies: ["setup"],
          },
          {
            name: "bs-webkit-ventura",
            use: { ...bsConnect({ browser: "playwright-webkit", browser_version: "latest", os: "OS X", os_version: "Ventura" }), storageState: AUTH_STATE },
            dependencies: ["setup"],
          },
          // Real-device (iOS/Android) is opt-in: BrowserStack allows only ONE
          // browser context per device session, so it MUST run serially
          // (--workers=1) and is much slower. Add back + run in a dedicated
          // pass if you need mobile:
          //   { name: "bs-safari-iphone", use: { ...bsConnect({ browser: "playwright-webkit", os: "ios", os_version: "16", device: "iPhone 14" }), storageState: AUTH_STATE }, dependencies: ["setup"] },
        ]
      : [
          {
            name: "chromium",
            use: { ...devices["Desktop Chrome"], storageState: AUTH_STATE },
            dependencies: ["setup"],
            // onboarding.spec.ts needs the onboarding-reset session (below), not
            // this project's regular dashboard one — never run it here.
            testIgnore: /onboarding\.spec\.ts/,
          },
          // Mirrors "chromium" but authenticates via setup-onboarding (resets
          // OnboardingState so the QA user lands back in the wizard) instead of
          // "setup" — for onboarding.spec.ts's workspace-step tests.
          {
            name: "chromium-onboarding",
            testMatch: /onboarding\.spec\.ts/,
            use: { ...devices["Desktop Chrome"], storageState: ONBOARDING_AUTH_STATE },
            dependencies: ["setup-onboarding"],
          },
        ]),
  ],
});
