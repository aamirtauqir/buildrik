#!/usr/bin/env node
/**
 * Capture a live, AUTHED editor state into Figma (html-to-design).
 *
 * Sibling of figma-capture.mjs, which pinned port 3100 and logged in with a
 * magic token. This one drives the ordinary dev server on :3000 with a saved
 * storageState, so a state can be refreshed without minting a token first.
 *
 * Usage: node figma-capture-live.mjs <captureId> <path> <delayMs> <actionsJson|none> [selector] [sentinel]
 *   captureId — from the Figma MCP generate_figma_design tool; SINGLE USE and
 *               short-lived. A stale one answers 410 and the capture silently
 *               never lands.
 *   actions   — [{click|rightClick|hover|press|waitMs|selectType}] replayed
 *               AFTER the capture script is injected (see the note below).
 *
 * Three things this file exists to remember:
 *  1. Do NOT rewrite responses to strip CSP. Next streams its RSC payload and
 *     refetch+fulfill mangles it — the editor never mounts and the sentinel
 *     fails. `bypassCSP: true` on the context does the same job cleanly.
 *  2. Actions run AFTER injection, because injecting the script moves focus and
 *     any surface that closes on blur is gone by capture time.
 *  3. `captureForDesign`'s promise does not settle here. The signal is the
 *     202/200 on the submit request, which this script logs.
 *
 * @license BSD-3-Clause
 */
// Adapted from scripts/baseline/figma-capture.mjs: port 3000 (not 3100) and a
// storageState session instead of a magic-link token.
import { createRequire } from "node:module";
const require = createRequire("/Users/shahg/Desktop/pencil/buildrik/packages/dashboard/package.json");
const { chromium } = require("@playwright/test");
const [,, CAPTURE_ID, PATH, DELAYMS, ACTIONS_JSON, SELECTOR, SENTINEL_ARG] = process.argv;
/* The sentinel was hardcoded to `.bd-studio`, which made this an editor-only
   script: every dashboard or public page failed with SENTINEL_MISSING even
   though it had rendered fine. Editor callers keep the default. */
const SENTINEL = SENTINEL_ARG && SENTINEL_ARG !== "none" ? SENTINEL_ARG : ".bd-studio";
const BASE = "http://localhost:3000";
const b = await chromium.launch();
/* bypassCSP instead of rewriting responses: Next streams its RSC payload,
   and refetch+fulfill mangles it so the editor never mounts. */
const c = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, storageState: "/tmp/bk-media-state.json", bypassCSP: true });
await c.addCookies([{ name: "buildrik_consent", value: encodeURIComponent(JSON.stringify({essential:true,analytics:false})), url: BASE }]);
const page = await c.newPage();
page.on("console", (m) => { const t = m.text(); if (/figma|capture|csp|refused/i.test(t)) console.log("PAGE:", m.type(), t.slice(0, 200)); });
page.on("pageerror", (e) => console.log("PAGEERROR:", String(e).slice(0, 200)));
page.on("requestfailed", (r) => { if (/figma/.test(r.url())) console.log("REQFAIL:", r.url().slice(0, 90), r.failure()?.errorText); });
page.on("response", (r) => { if (/mcp\.figma\.com/.test(r.url())) console.log("FIGMA HTTP", r.status(), r.url().slice(0, 90)); });
/* The dashboard sets a CSP and the capture script must be injectable — but
   intercepting EVERY request breaks the app: Next streams RSC payloads, and
   refetch+fulfill mangles them, so the editor never mounts and the sentinel
   fails. Only the top-level document carries the header that matters. */
await page.addInitScript(() => { const kill=()=>{for(const el of document.querySelectorAll('[class*="rearrangeOverlay"],[class*="agentation"]'))el.remove();};document.addEventListener("DOMContentLoaded",kill);setInterval(kill,400); });
await page.goto(BASE + PATH, { waitUntil: "domcontentloaded", timeout: 90000 });
await page.waitForSelector(SENTINEL, { timeout: 60000 }).catch(() => {});
await page.waitForTimeout(Number(DELAYMS || 9000));
// Sentinel: never submit a login page or a blank shell as a baseline.
const ok = await page.locator(SENTINEL).count();
if (!ok) { console.log(JSON.stringify({ error: `SENTINEL_MISSING ${SENTINEL}`, url: page.url() })); await b.close(); process.exit(2); }
const r = await page.context().request.get("https://mcp.figma.com/mcp/html-to-design/capture.js");
await page.evaluate((s) => { const el = document.createElement("script"); el.textContent = s; document.head.appendChild(el); }, await r.text());
/* Actions run AFTER the capture script is injected. Injecting it moves focus,
   and a surface that closes on blur — the ⌘K palette — was gone by the time the
   capture ran: the frame came out as the plain shell. */
if (ACTIONS_JSON && ACTIONS_JSON !== "none") {
  for (const a of JSON.parse(ACTIONS_JSON)) {
    if (a.hover) await page.hover(a.hover, { timeout: 8000 }).catch(() => console.log("hover miss:", a.hover));
    if (a.rightClick) await page.click(a.rightClick, { button: "right", timeout: 8000 }).catch(() => console.log("rightClick miss:", a.rightClick));
    /* Selecting on canvas goes through the engine, not a click: the canvas is
       engine-rendered HTML and a coordinate click lands wherever the layout
       put it. `selectType` picks the first element of a type the way the
       inspector states are actually reached. */
    if (a.selectType) {
      const found = await page.evaluate((type) => {
        const canvas = document.querySelector(".buildrick-canvas");
        let f = null; for (const k in canvas) if (k.startsWith("__reactFiber")) f = canvas[k];
        let x = f, c = null, h = 0;
        while (x && h < 40) { const pr = x.memoizedProps || {}; if (pr.composer?.elements) { c = pr.composer; break; } x = x.return; h++; }
        if (!c) return "no composer";
        const el = c.elements.getAllElements().find((e) => e.getType() === type);
        if (!el) return "no element of type " + type;
        c.selection.select(el);
        return "ok";
      }, a.selectType);
      if (found !== "ok") console.log("selectType:", found);
    }
    if (a.click) await page.click(a.click, { timeout: 8000, force: !!a.force }).catch((e) => console.log("click miss:", a.click));
    if (a.press) await page.keyboard.press(a.press);
    if (a.waitMs) await page.waitForTimeout(a.waitMs);
  }
}

await page.waitForTimeout(1200);
const preState = await page.evaluate(() => ({
  dialogs: Array.from(document.querySelectorAll("[role=dialog],[role=alertdialog],[role=menu]")).map((d) => (d.textContent||"").trim().slice(0,40)),
  overlayRootChildren: document.getElementById("bk-overlay-root")?.childElementCount ?? -1,
}));
console.log("PRE-CAPTURE:", JSON.stringify(preState));
if (process.env.DRY === "1") { await b.close(); process.exit(0); }
const SEL = SELECTOR && SELECTOR !== "none" ? SELECTOR : "body";
console.log("capturing selector:", SEL, "node count:", await page.evaluate((sel) => document.querySelector(sel)?.querySelectorAll("*").length ?? -1, SEL));
const result = await Promise.race([
  new Promise((res) => setTimeout(() => res({ submitted: true, note: 'promise never settles; the 200 above is the signal' }), 45000)),
  page.evaluate(async ({ cid, sel }) => {
    if (!window.figma || typeof window.figma.captureForDesign !== "function") {
      return { error: "captureForDesign missing", keys: Object.keys(window.figma || {}) };
    }
    try {
      return await window.figma.captureForDesign({
        captureId: cid,
        endpoint: `https://mcp.figma.com/mcp/capture/${cid}/submit?bindVariables=true`,
        selector: sel,
      });
    } catch (e) { return { error: String(e).slice(0, 300) }; }
  }, { cid: CAPTURE_ID, sel: SEL }),
]);
console.log(JSON.stringify(result));
await page.waitForTimeout(4000);
await b.close();
