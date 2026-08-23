#!/usr/bin/env node
/**
 * Put the running editor into each board's state, capture it, and rank the
 * boards by how far the app is from the design.
 *
 * This is the half board-diff.mjs could not do alone. Its own header records
 * why: on one board, with the product unchanged between runs, a full-frame
 * number moved 47.86% -> 16.20% purely because the first capture had the wrong
 * selection state and no consent cookie. Until a capture reproduces the board's
 * state, the number ranks capture accidents.
 *
 * Two fixes belong to every capture and are therefore here and not in the
 * recipes:
 *   · `buildrik_consent` — without it a cookie banner sits across the bottom
 *     of every screenshot.
 *   · the agentation dev overlay is stripped; it also eats clicks.
 *
 * Usage: node board-walk.mjs [--only <nodeId>] [--region x,y,w,h]
 *
 * Recipes live in board-recipes.json, including a `_notReached` block naming
 * the states this cannot get to and why — one of them is deliberate: reaching
 * "AI agent run" fires a paid generation call, so it is not attempted.
 *
 * @license BSD-3-Clause
 */
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { readFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");
const require = createRequire(join(ROOT, "packages", "dashboard", "package.json"));
const { chromium } = require("@playwright/test");

const cfg = JSON.parse(readFileSync(join(HERE, "board-recipes.json"), "utf8"));

/* boards.json records, per board, WHICH ARTEFACT WINS on conflict — and the
   ranking is misleading without it. Every Shell-states board carries
   `code:topbar`, so a whole-frame number against them is partly measuring a
   region the code already owns; 199:409's page tabs are settled by the
   dedicated board 435:2348 ("bar sits at the canvas foot") and the code was
   already right; 66:441 "Offline" is a placeholder board the code is ahead of.
   Three of the first eight rows I ranked were already adjudicated somewhere
   else, and the number said nothing about that. Print it beside every row. */
const MANIFEST = join(ROOT, "packages", "editor", "scripts", "conformance", "boards.json");
const authorityOf = (() => {
  const byId = new Map(JSON.parse(readFileSync(MANIFEST, "utf8")).boards.map((b) => [b.nodeId, b.authority]));
  return (id) => byId.get(id) ?? "(not in manifest)";
})();
const argv = process.argv.slice(2);
const arg = (n) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : null);
const only = arg("--only");
const regionArg = arg("--region");
const BASE = "http://localhost:3000";
const SHOTS = join(ROOT, ".board-diff", "walk");
mkdirSync(SHOTS, { recursive: true });

const recipes = cfg.recipes.filter((r) => !only || r.nodeId === only);

/* Reaching into the composer rather than clicking canvas coordinates: the
   canvas is engine-rendered HTML and a coordinate click lands wherever the
   layout put it. Same reason figma-capture-live.mjs does it this way. */
const COMPOSER = `(() => {
  const canvas = document.querySelector(".buildrick-canvas");
  let f = null; for (const k in canvas) if (k.startsWith("__reactFiber")) f = canvas[k];
  let x = f, h = 0;
  while (x && h < 40) { const pr = x.memoizedProps || {}; if (pr.composer?.elements) return pr.composer; x = x.return; h++; }
  return null;
})()`;

const results = [];
const browser = await chromium.launch();

for (const r of recipes) {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1,
    storageState: process.env.BK_STATE || "/tmp/bk-media-state.json",
  });
  await ctx.addCookies([{
    name: "buildrik_consent",
    value: encodeURIComponent(JSON.stringify({ essential: true, analytics: false })),
    url: BASE,
  }]);
  const page = await ctx.newPage();
  const steps = [];
  try {
    await page.goto(BASE + cfg.path, { waitUntil: "domcontentloaded", timeout: 120000 });
    if (r.captureEarlyMs) {
      await page.waitForTimeout(r.captureEarlyMs);
    } else {
      await page.waitForSelector(".bd-studio", { timeout: 90000 });
      await page.waitForTimeout(9000);
    }
    await page.evaluate(() =>
      document.querySelectorAll("[data-agentation],[id*='agentation' i],[class*='agentation' i]").forEach((n) => n.remove()));

    for (const a of r.actions ?? []) {
      if (a.openTab) {
        /* Rail tabs TOGGLE, and the editor restores whichever panel was last
           open, so a blind click closes the panel you wanted. */
        const s = await page.evaluate((t) => {
          const b = document.querySelector(`.ls-rail [data-tab="${t}"]`);
          if (!b) return "no-button";
          const open = b.getAttribute("aria-selected") === "true" || /active|selected/.test(b.className);
          if (!open) b.click();
          return open ? "already-open" : "opened";
        }, a.openTab);
        steps.push(`openTab:${a.openTab}=${s}`);
        await page.waitForTimeout(s === "opened" ? 4500 : 2500);
      }
      if (a.closeDrawer) {
        const s = await page.evaluate(() => {
          const b = document.querySelector(".ls-rail [data-tab][aria-selected='true'], .ls-rail [data-tab].active");
          if (!b) return "already-closed";
          b.click(); return "closed";
        });
        steps.push(`closeDrawer=${s}`);
        await page.waitForTimeout(2500);
      }
      if (a.clearSelection) {
        const s = await page.evaluate(`(() => { const c = ${COMPOSER}; if (!c) return "no-composer";
          c.selection.clear ? c.selection.clear() : c.selection.select(null); return "cleared"; })()`);
        steps.push(`clearSelection=${s}`);
        await page.waitForTimeout(1500);
      }
      if (a.selectType) {
        const s = await page.evaluate(`(() => { const c = ${COMPOSER}; if (!c) return "no-composer";
          const el = c.elements.getAllElements().find(e => e.getType() === ${JSON.stringify(a.selectType)});
          if (!el) return "no-element"; c.selection.select(el); return "selected"; })()`);
        steps.push(`selectType:${a.selectType}=${s}`);
        await page.waitForTimeout(2000);
      }
      if (a.selectTypes) {
        const s = await page.evaluate(`(() => { const c = ${COMPOSER}; if (!c) return "no-composer";
          const want = ${JSON.stringify(a.selectTypes)};
          const els = want.map(t => c.elements.getAllElements().find(e => e.getType() === t)).filter(Boolean);
          if (els.length < want.length) return "missing:" + (want.length - els.length);
          if (typeof c.selection.selectMany === "function") c.selection.selectMany(els);
          else { c.selection.select(els[0]); els.slice(1).forEach(e => c.selection.add?.(e)); }
          return "selected:" + els.length; })()`);
        steps.push(`selectTypes=${s}`);
        await page.waitForTimeout(2000);
      }
      if (a.offline) { await ctx.setOffline(true); steps.push("offline=on"); }
      if (a.click) {
        const ok = await page.click(a.click, { timeout: 8000 }).then(() => "clicked").catch(() => "miss");
        steps.push(`click=${ok}`);
      }
      if (a.waitMs) await page.waitForTimeout(a.waitMs);
    }

    const shot = join(SHOTS, `${r.nodeId.replace(/:/g, "-")}.png`);
    await page.screenshot({ path: shot });
    const out = execFileSync("node", [
      join(HERE, "board-diff.mjs"), r.nodeId, shot,
      ...(regionArg ? ["--region", regionArg] : []),
      "--out", join(ROOT, ".board-diff", `walk-${r.nodeId.replace(/:/g, "-")}`),
    ], { encoding: "utf8" });
    const pct = Number((out.match(/([\d.]+)% differ/) || [])[1] ?? NaN);
    const eyes = (out.match(/eyes: (.+)/) || [])[1] ?? "";
    results.push({ nodeId: r.nodeId, name: r.name, pct, steps, eyes, authority: authorityOf(r.nodeId) });
  } catch (e) {
    results.push({ nodeId: r.nodeId, name: r.name, pct: NaN, steps, error: String(e).slice(0, 120), authority: authorityOf(r.nodeId) });
  }
  await ctx.close();
}
await browser.close();

results.sort((a, b) => (Number.isNaN(b.pct) ? -1 : b.pct) - (Number.isNaN(a.pct) ? -1 : a.pct));
console.log(`\n  %   board        state`);
console.log(`  (read 'authority' before reading the number: it names which artefact wins)`);
for (const r of results) {
  const p = Number.isNaN(r.pct) ? "  err" : `${r.pct.toFixed(2)}%`.padStart(6);
  console.log(`${p}  ${r.nodeId.padEnd(11)}  ${r.name}`);
  console.log(`         authority: ${r.authority}`);
  console.log(`         ${r.steps.join(" · ")}${r.error ? ` · ERROR ${r.error}` : ""}`);
}
console.log(`\nNot reached (see board-recipes.json _notReached):`);
for (const [k, v] of Object.entries(cfg._notReached)) console.log(`  ${k}  ${v}`);
