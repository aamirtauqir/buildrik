/**
 * Editor walk rig — open the running editor on a real, server-backed session.
 *
 * Lived in a session scratchpad until 2026-08-25, which meant every walk
 * re-paid the same four traps. Committed as task 0b of
 * `docs/plans/2026-08-25-editor-flow-walk-arc.md`.
 *
 * THE FOUR TRAPS, all paid for already — do not pay again:
 *
 *  1. MAGIC-LINK TOKENS ARE SINGLE-USE. `generateToken("magic_link", …)` is
 *     marked `used` by the callback. Re-running a probe with a spent token
 *     lands silently on `/auth`, every `querySelector` returns empty, and it
 *     reads exactly like "the panel renders nothing". Four consecutive probes
 *     on 2026-08-25 were measuring a login page before a screenshot of the
 *     probe's own run caught it. Hence `openEditor` THROWS on `/auth` rather
 *     than handing back a page — a null result must not look like a finding.
 *
 *  2. `auth.verifyMagicLink` IS RATE-LIMITED 10 PER 15 MINUTES.
 *     `normalRateLimit = createRateLimitedProcedure(10, 15*60*1000)` —
 *     `server/trpc/routers/auth.ts:23,144`. State is a Postgres row keyed
 *     `<ip>:auth.verifyMagicLink` in `rate_limit_buckets`; in dev, delete it
 *     rather than waiting out the window. See `resetLoginRateLimit()`.
 *
 *  3. A 429 RENDERS AS "YOUR LINK EXPIRED".
 *     `packages/dashboard/app/auth/callback/page.tsx:17` has a single
 *     catch-all `failed()` → `/auth/error/expired-link?type=magic-link`, so a
 *     rate-limited login is reported to the user as a dead link. That screen
 *     is NOT evidence the token expired — check the bucket. (It is also a real
 *     product defect: the error page misattributes the cause.)
 *
 *  4. A DEV OVERLAY FLOATS AT z-index 100000 / 99996 (`v3.0.2 Output Detail…`).
 *     Any "list every position:fixed element" probe picks it up as product
 *     chrome. Strip it before counting floats, or the float ledger is wrong.
 *
 * Never `waitUntil: "networkidle"` against the dev server — the HMR socket
 * never idles.
 *
 * Usage:
 *   import { login, openEditor, resetLoginRateLimit } from "./editor-rig.mjs";
 *   await resetLoginRateLimit();
 *   await login({ userId: FIXTURE_USER, statePath: "/tmp/bk-auth.json" });
 *   const { browser, page } = await openEditor({ statePath: "/tmp/bk-auth.json" });
 *
 * @license BSD-3-Clause
 */
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";

const require = createRequire("/Users/shahg/Desktop/pencil/buildrik/packages/dashboard/package.json");
const { chromium } = require("@playwright/test");

export const BASE = process.env.BK_BASE || "http://localhost:3000";

/** The E2E fixture: "E2E Blank Full d013128c", 4 pages, owner qa@buildrik.local. */
export const FIXTURE_SITE = "cmrsur1fp000unh3rvmmiq25t";
export const FIXTURE_USER = "cmpa9ohx10000wrjux4ecumzo";

/** Trap 2 — clear the login bucket instead of waiting out the 15-minute window. */
export async function resetLoginRateLimit() {
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();
  try {
    // Raw SQL uses the PHYSICAL table name (@@map), not the Prisma model.
    return await prisma.$executeRawUnsafe(
      `DELETE FROM "rate_limit_buckets" WHERE "key" LIKE '%verifyMagicLink%'`
    );
  } finally {
    await prisma.$disconnect();
  }
}

/** Mint a fresh single-use magic link (trap 1) for `userId`. */
export function mintToken(userId = FIXTURE_USER) {
  const out = execFileSync(
    "npx",
    ["tsx", "scripts/baseline/.mint-magic.ts", userId],
    { cwd: "/Users/shahg/Desktop/pencil/buildrik", encoding: "utf8" }
  );
  return out.trim().split("\n").pop().trim();
}

/**
 * Log in ONCE and persist the session. Every later run reuses `statePath`, so
 * no further tokens are burned and the rate limit is never approached.
 */
export async function login({ userId = FIXTURE_USER, statePath } = {}) {
  if (!statePath) throw new Error("login: statePath is required — reusing the session is the whole point");
  const token = mintToken(userId);
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  try {
    await page.goto(`${BASE}/auth/callback?token=${token}`, { waitUntil: "domcontentloaded" });
    await page.waitForURL((u) => !u.pathname.startsWith("/auth/"), { timeout: 30000 });
    await ctx.storageState({ path: statePath });
    return page.url();
  } catch (e) {
    const url = page.url();
    if (/expired-link/.test(url)) {
      // Trap 3 — do not believe this screen.
      throw new Error(
        `login: landed on ${url}. That page is shown for ANY failure including a 429. ` +
        `Check rate_limit_buckets before concluding the token expired — see resetLoginRateLimit().`
      );
    }
    throw new Error(`login failed at ${url}: ${e.message}`);
  } finally {
    await browser.close();
  }
}

/**
 * Open the editor on a real session.
 * THROWS if the session is dead (trap 1) — an empty DOM must never be
 * mistakable for a product finding.
 */
export async function openEditor({
  statePath,
  site = FIXTURE_SITE,
  waitMs = 14000,
  scale = 1,
  viewport = { width: 1440, height: 900 },
} = {}) {
  if (!statePath) throw new Error("openEditor: statePath is required");
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: scale, storageState: statePath });
  const page = await ctx.newPage();
  const consoleErrors = [];
  page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text().slice(0, 300)); });

  await page.goto(`${BASE}/edit/${site}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(waitMs);

  if (/\/auth/.test(page.url())) {
    await browser.close();
    throw new Error(
      `openEditor: SESSION DEAD — landed on ${page.url()}. ` +
      `The stored state is stale; run login() again. Do NOT read the DOM from here: ` +
      `every selector will return empty and it looks exactly like a broken panel.`
    );
  }
  return { browser, ctx, page, consoleErrors };
}

/** Trap 4 — the dev overlay is not product chrome. Drop it from any float scan. */
export const DEV_OVERLAY_PREDICATE = `
  (el) => {
    const z = Number(getComputedStyle(el).zIndex);
    return Number.isFinite(z) && z >= 99000;
  }
`;
