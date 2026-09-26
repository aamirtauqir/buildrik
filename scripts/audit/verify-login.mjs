// Phase 2 (V0) — log in as each seeded verify user through the real login UI
// and capture storageState + a couple of reference screenshots.
//
// Usage: node scripts/audit/verify-login.mjs
// Expects the dashboard dev server already running on http://localhost:3100
// (started separately with DATABASE_URL pointed at buildrik_verify).

import playwright from "/Users/shahg/Desktop/buildrik-worktrees/earlier-arcs/buildrik-code-gap-A/node_modules/.pnpm/playwright@1.61.1/node_modules/playwright/index.js";
const { chromium } = playwright;
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const BASE_URL = process.env.BASE_URL ?? "http://192.168.100.5:3100";
const OUT_DIR = "/Users/shahg/Desktop/buildrik-worktrees/audit-2026-09-25/buildrik-af-verify/docs/audits/2026-09-25-full-audit/verify";
const AUTH_DIR = join(OUT_DIR, "auth");
const PASSWORD = "verify-1234";

mkdirSync(AUTH_DIR, { recursive: true });

const seedIds = JSON.parse(
  readFileSync(join(OUT_DIR, "seed-ids.json"), "utf8")
);

const ROLES = [
  { role: "owner", email: "owner@verify.local" },
  { role: "admin", email: "admin@verify.local" },
  { role: "editor", email: "editor@verify.local" },
  { role: "viewer", email: "viewer@verify.local" },
  { role: "scoped", email: "scoped@verify.local" },
  { role: "designer", email: "designer@verify.local" },
  { role: "outsider", email: "outsider@verify.local" },
  { role: "unverified", email: "unverified@verify.local" },
];

async function loginAs(browser, role, email) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(String(err)));

  const result = { role, email, ok: false, finalUrl: null, error: null, consoleErrors: [] };

  try {
    await page.goto(`${BASE_URL}/auth/login`, { waitUntil: "networkidle" });
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(PASSWORD);
    await page.getByRole("button", { name: /log in/i }).click();
    // Successful login navigates via window.location.assign to /auth/redirect
    // then on to /dashboard (or onboarding). Wait for navigation away from /auth.
    await page.waitForURL((url) => !url.pathname.startsWith("/auth") || url.pathname === "/auth/redirect", {
      timeout: 15000,
    }).catch(() => {});
    // Give the client-side redirect chain a moment to settle.
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

    const finalUrl = page.url();
    result.finalUrl = finalUrl;
    result.ok = !finalUrl.includes("/auth?") && !finalUrl.endsWith("/auth");

    await context.storageState({ path: join(AUTH_DIR, `${role}.json`) });
  } catch (err) {
    result.error = String(err);
  }

  result.consoleErrors = consoleErrors;
  await context.close();
  return result;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const { role, email } of ROLES) {
    const r = await loginAs(browser, role, email);
    results.push(r);
    console.log(`[${role}] ${email} -> ok=${r.ok} finalUrl=${r.finalUrl} consoleErrors=${r.consoleErrors.length}${r.error ? ` error=${r.error}` : ""}`);
  }

  // Owner: dashboard + editor screenshots.
  const ownerResult = results.find((r) => r.role === "owner");
  if (ownerResult?.ok) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      storageState: join(AUTH_DIR, "owner.json"),
    });
    const page = await context.newPage();
    const ownerConsoleErrors = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") ownerConsoleErrors.push(`[dashboard/editor] ${msg.text()}`);
    });

    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle" }).catch(() => {});
    await page.screenshot({ path: join(OUT_DIR, "v0-dashboard-owner.png"), fullPage: false });

    const s1Id = seedIds.sites?.s1;
    if (s1Id) {
      await page.goto(`${BASE_URL}/edit/${s1Id}`, { waitUntil: "networkidle", timeout: 30000 }).catch(() => {});
      await page.waitForTimeout(3000);
      await page.screenshot({ path: join(OUT_DIR, "v0-editor-owner.png"), fullPage: false });
    }

    results.push({ role: "owner-dashboard-editor", consoleErrors: ownerConsoleErrors });
    await context.close();
  }

  writeFileSync(join(OUT_DIR, "login-results.json"), JSON.stringify(results, null, 2) + "\n");
  await browser.close();

  const okCount = results.filter((r) => r.ok).length;
  console.log(`\n${okCount}/${ROLES.length} roles logged in successfully.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
