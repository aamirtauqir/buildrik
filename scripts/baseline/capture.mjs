#!/usr/bin/env node
/**
 * Baseline capture harness — reference renders for the Figma reconstruction.
 *
 * Design constraints (docs/plans/2026-08-08-figma-existing-ui-baseline.md):
 *  - LOCAL chromium via playwright library API (never the test runner — the
 *    dashboard playwright.config.ts:13 silently diverts to BrowserStack when
 *    BROWSERSTACK_* env vars exist; the library API bypasses config entirely,
 *    and we assert the executable is a local path anyway).
 *  - DPR=1, 1440×900, 100% zoom — measurement screenshots, not retina.
 *  - Clock frozen + animations killed + caret hidden → deterministic pixels.
 *  - Every capture asserts a per-screen SENTINEL (selector or text) before
 *    acceptance — a dead server yields a loud FAIL, never a login-redirect
 *    frame silently entering the baseline.
 *  - PII/secret scan on rendered text before anything is written.
 *  - Output per screen: full-page PNG + rects.json (getBoundingClientRect for
 *    every [data-testid] + landmark elements) → the numeric geometry gate
 *    compares these rects against Figma node geometry (≤1px @ DPR1).
 *
 * Usage: node capture.mjs <screens.json> [--base http://localhost:3000]
 * screens.json: [{ id:"BL-0001", path:"/auth/login", sentinel:{text:"..."} |
 *                  {selector:"[data-testid=...]"}, fullPage:true, waitMs:0 }]
 * PNGs land OUT of git: ~/.gstack/projects/aamirtauqir-buildrik/baseline-shots/
 * A sha256 manifest (committed) records what was captured from which commit.
 */
import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";
import { execFileSync } from "node:child_process";

const HERE = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(HERE, "..", "..", "packages", "dashboard", "package.json"));
const { chromium } = require("@playwright/test");

const [, , screensArg, ...rest] = process.argv;
if (!screensArg) { console.error("usage: capture.mjs <screens.json> [--base URL] [--tokens file] [--login-token raw]"); process.exit(3); }
const BASE = rest.includes("--base") ? rest[rest.indexOf("--base") + 1] : "http://localhost:3000";
// Runtime-only token material: never committed, never recorded in the manifest.
const TOKENS = rest.includes("--tokens") ? JSON.parse(readFileSync(rest[rest.indexOf("--tokens") + 1], "utf8")) : {};
const LOGIN_TOKEN = rest.includes("--login-token") ? rest[rest.indexOf("--login-token") + 1] : null;
const screens = JSON.parse(readFileSync(screensArg, "utf8"));
const OUT = join(homedir(), ".gstack", "projects", "aamirtauqir-buildrik", "baseline-shots");
mkdirSync(OUT, { recursive: true });

const FROZEN_TIME = new Date("2026-08-08T12:00:00Z");
const ANIMATION_KILL = `*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}
html{scroll-behavior:auto!important}`;
// Fixture domains are allowed; anything else email-shaped, or key-shaped, fails the run.
const PII = [
  { name: "email", re: /[a-z0-9._%+-]+@(?!buildrik\.local|buildrick\.io|example\.com)[a-z0-9.-]+\.[a-z]{2,}/gi },
  { name: "secret", re: /\b(sk-[a-zA-Z0-9]{20,}|pk_(live|test)_[a-zA-Z0-9]{10,}|eyJ[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{10,})\b/g },
];

const browser = await chromium.launch();
const exe = chromium.executablePath();
if (!existsSync(exe)) { console.error(`[capture] ABORT: chromium executable not local: ${exe}`); process.exit(1); }
/* The cookie banner is `fixed bottom-0 … z-[9998]` on every route including
   /edit, where it covers the editor's status bar and eats clicks aimed at it.
   Consenting up front removes it from every capture deterministically — a
   per-screen "click Essential Only" action cannot, because the contexts are
   reused and the second screen finds no banner to click and fails the run. */
const CONSENT_COOKIE = {
  name: "buildrik_consent",
  value: encodeURIComponent(JSON.stringify({ essential: true, analytics: false })),
  expires: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
  sameSite: "Lax",
};
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
await ctx.addCookies([{ ...CONSENT_COOKIE, url: BASE }]);
await ctx.addInitScript((css) => {
  const s = document.createElement("style"); s.textContent = css;
  document.addEventListener("DOMContentLoaded", () => document.head.appendChild(s));
}, ANIMATION_KILL);

const commit = execFileSync("git", ["rev-parse", "--short", "HEAD"], { cwd: HERE }).toString().trim();
const manifest = []; const failures = [];

// Session context: log in once via the magic-link callback, keep cookies in a
// second context. storageState never touches disk — memory only, per run.
let sessionCtx = null;
if (LOGIN_TOKEN) {
  sessionCtx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  await sessionCtx.addCookies([{ ...CONSENT_COOKIE, url: BASE }]);
  await sessionCtx.addInitScript((css) => {
    const s = document.createElement("style"); s.textContent = css;
    document.addEventListener("DOMContentLoaded", () => document.head.appendChild(s));
  }, ANIMATION_KILL);
  const lp = await sessionCtx.newPage();
  await lp.goto(`${BASE}/auth/callback?token=${LOGIN_TOKEN}`, { waitUntil: "domcontentloaded", timeout: 30000 });
  // Post-login landing (dashboard) never reaches networkidle — wait only for
  // the URL to leave the auth flow, then confirm a session cookie exists.
  await lp.waitForURL((u) => !u.pathname.startsWith("/auth/"), { timeout: 30000 });
  const cookies = await sessionCtx.cookies(BASE);
  if (!cookies.some((c) => c.name.includes("session-token"))) throw new Error("login produced no session cookie");
  console.log(`[capture] session established → ${new URL(lp.url()).pathname}`);
  await lp.close();
}

for (const s of screens) {
  const useCtx = s.requires === "session" && sessionCtx ? sessionCtx : ctx;
  const page = await useCtx.newPage();
  try {
    await page.clock.install({ time: FROZEN_TIME });
    // Stall (never resolve) rather than abort: an aborted request fires the
    // app's onError path instantly; a stalled one holds loading/spinner states
    // open deterministically for capture.
    if (s.blockPatterns) for (const p of s.blockPatterns) await page.route(p, () => {});
    let q = "";
    if (s.tokenRef) {
      const tok = TOKENS[s.tokenRef];
      if (!tok) throw new Error(`tokenRef ${s.tokenRef} not provided`);
      q = (s.query ? `?${s.query}&` : "?") + `token=${tok}`;
    } else if (s.query) q = `?${s.query}`;
    const resp = await page.goto(BASE + s.path + q, { waitUntil: s.waitUntil || "networkidle", timeout: 30000 });
    if (s.waitMs) await page.waitForTimeout(s.waitMs);
    // SENTINEL — the screen must prove it is itself
    if (s.sentinel?.selector) await page.waitForSelector(s.sentinel.selector, { timeout: 8000 });
    else if (s.sentinel?.text) await page.getByText(s.sentinel.text, { exact: false }).first().waitFor({ timeout: 8000 });
    else throw new Error("no sentinel defined — refusing unverifiable capture");
    if (new URL(page.url()).pathname !== s.path && !s.allowRedirect)
      throw new Error(`redirected to ${new URL(page.url()).pathname}`);
    // Post-load interactions (open a panel, press a shortcut) before capture.
    if (s.actions) for (const a of s.actions) {
      if (a.hover) await page.hover(a.hover, { timeout: 8000 });
      /* Context menus are reached by the right button, and three baseline
         rows (pages / layers row menus, media list view) sat unmeasured as
         "controls refuse the click from a spec" for want of it. */
      if (a.rightClick) await page.click(a.rightClick, { button: "right", timeout: 8000 });
      if (a.click) await page.click(a.click, { timeout: 8000, force: !!a.force });
      if (a.press) await page.keyboard.press(a.press);
      if (a.waitFor) await page.waitForSelector(a.waitFor, { timeout: 8000 });
      if (a.waitMs) await page.waitForTimeout(a.waitMs);
    }
    // PII scan on rendered text
    const text = await page.evaluate(() => document.body.innerText);
    for (const { name, re } of PII) { const m = text.match(re); if (m) throw new Error(`PII(${name}): ${m[0].slice(0, 24)}…`); }
    // Rect dump for the numeric geometry gate
    const rects = await page.evaluate(() => {
      const pick = (el) => { const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; };
      const out = {};
      document.querySelectorAll("[data-testid]").forEach((el) => (out["testid:" + el.getAttribute("data-testid")] = pick(el)));
      ["header", "nav", "main", "aside", "footer", "form"].forEach((t) => document.querySelectorAll(t).forEach((el, i) => (out[`${t}[${i}]`] = pick(el))));
      return { scrollHeight: document.documentElement.scrollHeight, els: out };
    });
    const dir = join(OUT, s.id); mkdirSync(dir, { recursive: true });
    const png = join(dir, `${(s.state || "default")}.png`);
    await page.screenshot({ path: png, fullPage: s.fullPage !== false });
    writeFileSync(join(dir, `${(s.state || "default")}.rects.json`), JSON.stringify(rects, null, 1));
    const hash = createHash("sha256").update(readFileSync(png)).digest("hex").slice(0, 16);
    manifest.push({ id: s.id, path: s.path, state: s.state || "default", status: resp?.status(), sha256: hash, scrollHeight: rects.scrollHeight, elCount: Object.keys(rects.els).length });
    console.log(`[capture] OK   ${s.id} ${s.path} sha=${hash} h=${rects.scrollHeight}`);
  } catch (e) {
    failures.push({ id: s.id, path: s.path, error: String(e.message || e) });
    console.error(`[capture] FAIL ${s.id} ${s.path} — ${e.message || e}`);
  } finally { await page.close(); }
}
await browser.close();
writeFileSync(join(HERE, "capture-manifest.json"), JSON.stringify({ commit, base: BASE, generated: new Date().toISOString(), captures: manifest, failures }, null, 1));
console.log(`[capture] ${manifest.length} ok, ${failures.length} failed → capture-manifest.json`);
process.exit(failures.length ? 1 : 0);
