#!/usr/bin/env node
/**
 * Measure a region of the running editor for a Figma rebuild.
 *
 * The baseline frames are reconstructions of the app, so the numbers have to
 * come from the app — not from reading a PNG. This walks the DOM inside a
 * region and dumps every node that paints something (text, fill, border) with
 * its box, type and resolved colours, in coordinates relative to the region.
 * `redraw-from-measure.mjs` consumes the output.
 *
 * Runs the same login + determinism setup as capture.mjs (local chromium via
 * the library API, DPR 1, 1440x900) so the numbers match the reference render.
 *
 * Usage: node measure-region.mjs <spec.json> --login-token <raw> [--base URL]
 *   spec.json: [{ id, region:[x,y,w,h], actions:[…] }]  — actions as capture.mjs
 */
import { createRequire } from "node:module";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

const HERE = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(HERE, "..", "..", "packages", "dashboard", "package.json"));
const { chromium } = require("@playwright/test");

const [specArg, ...rest] = process.argv.slice(2);
if (!specArg) { console.error("usage: measure-region.mjs <spec.json> --login-token <raw> [--base URL]"); process.exit(3); }
const BASE = rest.includes("--base") ? rest[rest.indexOf("--base") + 1] : "http://localhost:3000";
const TOKEN = rest.includes("--login-token") ? rest[rest.indexOf("--login-token") + 1] : null;
const SITE = rest.includes("--site") ? rest[rest.indexOf("--site") + 1] : "cmrsur1fp000unh3rvmmiq25t";
const specs = JSON.parse(readFileSync(specArg, "utf8"));
const OUT = join(homedir(), ".gstack", "projects", "aamirtauqir-buildrik", "measured");
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const lp = await ctx.newPage();
await lp.goto(`${BASE}/auth/callback?token=${TOKEN}`, { waitUntil: "domcontentloaded", timeout: 60000 });
await lp.waitForURL((u) => !u.pathname.startsWith("/auth/"), { timeout: 60000 });
await lp.close();

const results = [];
for (const s of specs) {
  const page = await ctx.newPage();
  try {
    await page.goto(`${BASE}/edit/${SITE}`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForSelector(".bd-studio", { timeout: 30000 });
    await page.waitForTimeout(3000);
    for (const a of s.actions || []) {
      if (a.hover) await page.hover(a.hover, { timeout: 8000 });
      if (a.click) await page.click(a.click, { timeout: 8000 });
      if (a.press) await page.keyboard.press(a.press);
      if (a.waitFor) await page.waitForSelector(a.waitFor, { timeout: 8000 });
      if (a.waitMs) await page.waitForTimeout(a.waitMs);
    }
    const data = await page.evaluate((region) => {
      const [rx, ry, rw, rh] = region;
      const hex = (v) => {
        const m = v.match(/[\d.]+/g);
        if (!m) return null;
        if (m.length > 3 && parseFloat(m[3]) === 0) return null;      // fully transparent
        return "#" + m.slice(0, 3).map((n) => Math.round(+n).toString(16).padStart(2, "0")).join("");
      };
      const out = [];
      const walk = (el, depth) => {
        const r = el.getBoundingClientRect();
        if (r.width < 1 || r.height < 1) return;
        if (r.right < rx || r.left > rx + rw || r.bottom < ry || r.top > ry + rh) return;
        const cs = getComputedStyle(el);
        if (cs.visibility === "hidden" || cs.display === "none" || +cs.opacity === 0) return;
        /* Join the raw text nodes, do not trim each one first. JSX writes
           `{n} variant{n > 1 ? "s" : ""}` as two adjacent text nodes, and
           trimming then joining with a space produced "3 variant s". */
        const parts = [...el.childNodes].filter((n) => n.nodeType === 3);
        let own = parts.map((n) => n.textContent).join("").replace(/\s+/g, " ").trim();
        /* An empty field still shows its placeholder, which is an attribute and
           not a text node — the Insert drawer's "Search elements" was missing
           from the rebuild until this. */
        if (!own && (el.tagName === "INPUT" || el.tagName === "TEXTAREA") && el.placeholder) {
          own = el.placeholder;
        }
        const bg = hex(cs.backgroundColor);
        /* Thumbnails and hero strips are painted with CSS gradients, which the
           colour-only read saw as empty boxes. Capture simple linear-gradients
           so they can be rebuilt as real Figma gradient fills. */
        const gi = cs.backgroundImage;
        const grad = gi && gi.startsWith("linear-gradient")
          ? { raw: gi.slice(0, 300), stops: (gi.match(/rgba?\([^)]+\)/g) || []).map(hex).filter(Boolean),
              angle: (gi.match(/^linear-gradient\(\s*([\d.]+)deg/) || [])[1] || null }
          : null;
        /* Read each side's colour, not just the top one. A row with only a
           left border inherits `currentColor` on the other three, and reading
           borderTopColor for all of them painted a black bar down every row
           that has no visible border at all. */
        const sides = ["Top", "Right", "Bottom", "Left"];
        const bw = sides.map((s) => {
          const w = parseFloat(cs["border" + s + "Width"]) || 0;
          return w && hex(cs["border" + s + "Color"]) ? w : 0;
        });
        const bcs = sides.map((s) => hex(cs["border" + s + "Color"]));
        const svgEl = el.tagName.toLowerCase() === "svg" ? el : null;
        /* Descend through anything that overlaps, but only EMIT what sits
           inside the region — otherwise the walk keeps <body>, the topbar and
           the rail, all of which merely touch the band's edge. */
        const inside = r.left >= rx - 1 && r.top >= ry - 1 &&
                       r.right <= rx + rw + 1 && r.bottom <= ry + rh + 1;
        /* Skip what a scroll container has clipped away. The DOM holds every
           row of a scrolled list; the reference render shows only the visible
           ones, and copying the rest stacks hidden rows under the footer. */
        let clipped = false;
        for (let a = el.parentElement; a && !clipped; a = a.parentElement) {
          const acs = getComputedStyle(a);
          if (!/auto|scroll|hidden/.test(acs.overflowY + acs.overflowX)) continue;
          const ar = a.getBoundingClientRect();
          if (r.top >= ar.bottom - 1 || r.bottom <= ar.top + 1) clipped = true;
        }
        if (!clipped && inside && (own || bg || bw.some(Boolean) || svgEl)) {
          out.push({
            d: depth, tag: el.tagName.toLowerCase(),
            x: +(r.x - rx).toFixed(1), y: +(r.y - ry).toFixed(1),
            w: +r.width.toFixed(1), h: +r.height.toFixed(1),
            text: own || null,
            fs: own ? parseFloat(cs.fontSize) : null,
            fw: own ? +cs.fontWeight : null,
            /* Family and transform, or the rebuild silently retypes the app.
               The editor sets Geist Mono for data (token names) and uppercases
               some labels in CSS — read as DOM text, "NO DARK VALUE" arrives
               as "No dark value". */
            ff: own ? cs.fontFamily.split(",")[0].replace(/["']/g, "").trim() : null,
            tt: own && cs.textTransform !== "none" ? cs.textTransform : null,
            ls: own && cs.letterSpacing !== "normal" ? parseFloat(cs.letterSpacing) : null,
            lh: own ? cs.lineHeight : null,
            col: own ? hex(cs.color) : null,
            align: own ? cs.textAlign : null,
            bg, grad,
            border: bw.some(Boolean) ? { w: bw, c: bcs.find((c, i) => bw[i] && c) } : null,
            svg: svgEl ? svgEl.outerHTML.slice(0, 4000) : null,
            radius: cs.borderRadius === "0px" ? null : parseFloat(cs.borderRadius),
            op: +cs.opacity < 1 ? +cs.opacity : null,
          });
        }
        if (depth < 30) [...el.children].forEach((c) => walk(c, depth + 1));
      };
      walk(document.body, 0);
      return out;
    }, s.region);
    writeFileSync(join(OUT, `${s.id}.json`), JSON.stringify({ id: s.id, region: s.region, nodes: data }, null, 1));
    console.log(`[measure] OK   ${s.id} — ${data.length} painted nodes`);
    results.push({ id: s.id, count: data.length });
  } catch (e) {
    console.log(`[measure] FAIL ${s.id} — ${String(e.message).split("\n")[0]}`);
  } finally { await page.close(); }
}
await browser.close();
console.log(`[measure] ${results.length}/${specs.length} measured → ${OUT}`);
