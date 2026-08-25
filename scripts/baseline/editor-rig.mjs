/**
 * Editor walk rig — open the running editor on a real, server-backed session.
 *
 * Lived in a session scratchpad until 2026-08-25, which meant every walk
 * re-paid the same traps. Committed as task 0b of
 * `docs/plans/2026-08-25-editor-flow-walk-arc.md`.
 *
 * SEVEN TRAPS, all paid for already — do not pay again:
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
 *  4. A DEV OVERLAY IMPERSONATES THE INSPECTOR. The agentation panel
 *     (`v3.0.2 · Output Detail · Manage MCP & Webhooks · Webhooks · Auto-Send`)
 *     sits at z-index 99000+ AND occupies the same screen region as the right
 *     inspector column. So it does two separate kinds of damage:
 *       - a "list every position:fixed element" probe counts it as product chrome
 *       - **a right-column read returns ITS text instead of the inspector's**,
 *         so the probe sees no element name and concludes "nothing is selected"
 *     The second one is worse: it does not add noise, it answers in the
 *     inspector's place. It is what made the 2026-08-24 U4 walk file
 *     "my canvas click did not select" — the click was fine; the read was the
 *     overlay. Measured A/B on 2026-08-25: selection works with the overlay
 *     present. **Strip before READING, not before clicking** — see
 *     `stripDevOverlays(page)`.
 *
 * THREE MORE, learned the same day:
 *
 *  5. CANVAS NODES ARE `[data-buildrick-id]`. `data-element-id` does not exist;
 *     a probe written against it matches nothing and reports no error.
 *
 *  6. A COORDINATE CLICK OUTSIDE THE VIEWPORT SILENTLY DOES NOTHING. Elements
 *     appended to the end of a page sit below the fold. `scrollIntoView` first,
 *     then re-read the box — `getBoundingClientRect()` from before the scroll
 *     is stale. And run multi-step chains in ONE session: every `openEditor()`
 *     is a fresh context, so an element created in run N may not be there in
 *     run N+1.
 *
 *  7. SOME MENU ROWS LEAVE THE EDITOR ENTIRELY. `Site health` and `Activity
 *     log` call `openDashboard(...)` and open a NEW TAB
 *     (`SiteMenu.tsx:195-199`); the editor page correctly stays put. A probe
 *     that measures "did this page change" reads them as dead doors forever —
 *     two different click mechanisms both looked like no-ops before a popup
 *     listener showed the tab. Listen on `context.on("page", …)` BEFORE
 *     clicking any row that might navigate away. See `clickMenuRow()`.
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

/**
 * Trap 4 — remove the dev overlays before READING any panel.
 * Returns how many nodes were removed. Safe to call more than once.
 *
 * Call this before every inspector / panel scrape. Do NOT call it to "fix"
 * clicking: selection works with the overlay present, and stripping for the
 * wrong reason hides that the read is what was broken.
 */
export async function stripDevOverlays(page) {
  return page.evaluate(() => {
    let n = 0;
    // NEVER remove a product overlay. Modals, dialogs and toasts are portaled
    // to body too, so a bare "z >= 9000" sweep takes them with it — that made
    // Ctrl+, look like a dead shortcut when the Project settings modal had in
    // fact opened and then been deleted by this helper.
    const isProduct = (el) =>
      el.matches?.('[role="dialog"], [aria-modal="true"]') ||
      el.querySelector?.('[role="dialog"], [aria-modal="true"]') ||
      el.querySelector?.(".bd-studio") ||
      el.classList?.contains("bd-studio");
    for (const el of [...document.querySelectorAll("body > *")]) {
      if (isProduct(el)) continue;
      const z = Number(getComputedStyle(el).zIndex);
      if (Number.isFinite(z) && z >= 9000) { el.remove(); n++; }
    }
    // The agentation panel is not a body child in every build. Match it
    // narrowly: a positioned, high-z, SMALL subtree.
    //
    // The obvious version of this loop removes <html>. `querySelectorAll("*")`
    // starts there, `html.innerText` contains the overlay's text because the
    // overlay is on the page, and `html.children.length` is 2 — so a
    // "children.length < 40" guard passes and the whole document goes. That
    // shipped for one commit and blanked the page. Hence every condition below.
    for (const el of [...document.querySelectorAll("div,aside,section")]) {
      if (el === document.body || el.contains(document.querySelector(".bd-studio"))) continue;
      const s = getComputedStyle(el);
      if (s.position !== "fixed" && s.position !== "absolute") continue;
      const z = Number(s.zIndex);
      if (!Number.isFinite(z) || z < 9000) continue;
      if (!/Manage MCP & Webhooks|Output Detail/.test(el.innerText || "")) continue;
      el.remove(); n++; break;
    }
    return n;
  });
}

/**
 * Read the right-hand inspector column as lines. Strips the dev overlays first
 * (trap 4) — without that this returns the overlay's text and every caller
 * concludes "nothing is selected".
 */
export async function readInspector(page, limit = 16) {
  await stripDevOverlays(page);
  return page.evaluate((n) => {
    const col = [...document.querySelectorAll("div,aside,section")]
      .filter((e) => {
        const r = e.getBoundingClientRect();
        return r.left > 1140 && r.width > 150 && r.width < 420 && r.height > 300;
      })
      .sort((a, b) => a.getBoundingClientRect().width - b.getBoundingClientRect().width)[0];
    if (!col) return "NO-COLUMN";
    return (col.innerText || "").split("\n").map((s) => s.trim()).filter(Boolean).slice(0, n);
  }, limit);
}

/** Trap 5+6 — click a canvas element by id, scrolling it into view first. */
export async function clickCanvasElement(page, elementId) {
  const box = await page.evaluate((id) => {
    const el = document.querySelector(`[data-buildrick-id="${id}"]`);
    if (!el) return null;
    el.scrollIntoView({ block: "center" });
    const r = el.getBoundingClientRect();          // re-read AFTER the scroll
    return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
  }, elementId);
  if (!box) return false;
  await page.waitForTimeout(500);
  await page.mouse.click(box.x, box.y);
  await page.waitForTimeout(1400);
  return true;
}

/**
 * Trap 7 — click a site-menu row and report BOTH outcomes: what changed on the
 * page, and any new tab it opened. Returns `{ newTabs, url }`.
 *
 * A row like `Site health` opens the dashboard in a new tab and leaves the
 * editor untouched; measuring only the current page reads that as a dead door.
 */
export async function clickMenuRow(page, ctx, label, { settleMs = 3500 } = {}) {
  const newTabs = [];
  const onPage = (p) => newTabs.push(p.url());
  ctx.on("page", onPage);
  try {
    await page.evaluate(() => {
      const b = [...document.querySelectorAll("button")]
        .find((x) => x.getAttribute("aria-label") === "Site menu");
      if (b) b.click();
    });
    await page.waitForTimeout(1500);
    const hit = await page.evaluate((t) => {
      const leaf = [...document.querySelectorAll("*")]
        .find((e) => e.children.length === 0 && (e.innerText || "").trim() === t);
      if (!leaf) return false;
      let el = leaf;
      for (let i = 0; i < 4 && el; i++) {
        if (el.getAttribute("role") === "menuitem" || el.tagName === "BUTTON") break;
        el = el.parentElement;
      }
      if (!el) return false;
      el.click();
      return true;
    }, label);
    if (!hit) return { found: false, newTabs, url: page.url() };
    await page.waitForTimeout(settleMs);
    return { found: true, newTabs, url: page.url() };
  } finally {
    ctx.off("page", onPage);
  }
}
