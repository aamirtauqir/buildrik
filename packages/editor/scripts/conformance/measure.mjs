#!/usr/bin/env node
/**
 * Conformance Phase 0b — live-DOM measurement runner.
 * Plan: docs/designs/2026-07-26-editor-conformance-plan.md
 *
 * Usage:  node scripts/conformance/measure.mjs <surface-id> [--url http://localhost:5050/]
 *         node scripts/conformance/measure.mjs --list
 *
 * Reads surfaces/<surface-id>.json, drives the running editor to that state
 * at the board's viewport, then dumps for every target: geometry, computed
 * fills/radii/typography, and a WCAG contrast verdict for every element in
 * scope that paints text directly. Output: measured/<surface-id>.json
 * (gitignored — it describes a build, not the source).
 */
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const HERE = dirname(fileURLToPath(import.meta.url));
const SURFACES = join(HERE, "surfaces");
const OUT_DIR = join(HERE, "measured");

const args = process.argv.slice(2);
if (args.includes("--list")) {
  for (const f of readdirSync(SURFACES)) console.log(f.replace(/\.json$/, ""));
  process.exit(0);
}
const surfaceId = args.find((a) => !a.startsWith("--"));
if (!surfaceId) {
  console.error("usage: measure.mjs <surface-id> [--url <base>] | --list");
  process.exit(2);
}
const urlFlag = args.indexOf("--url");
const recipe = JSON.parse(readFileSync(join(SURFACES, `${surfaceId}.json`), "utf8"));
const baseUrl = urlFlag !== -1 ? args[urlFlag + 1] : (recipe.url ?? "http://localhost:5050/");

async function launch() {
  try {
    return await chromium.launch();
  } catch {
    // No bundled chromium for this playwright-core build — use installed Chrome.
    return await chromium.launch({ channel: "chrome" });
  }
}

const browser = await launch();
const page = await browser.newPage({ viewport: recipe.viewport ?? { width: 1440, height: 900 } });
// domcontentloaded + the recipe's own waitFor steps — networkidle is flaky
// under load (vite dev serves hundreds of modules) and never settles on
// pages that poll.
await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 120000 });

for (const step of recipe.steps ?? []) {
  if (step.action === "click") await page.click(step.selector);
  else if (step.action === "hover") await page.hover(step.selector);
  else if (step.action === "waitFor") await page.waitForSelector(step.selector, { timeout: 120000 });
  else if (step.action === "press") await page.keyboard.press(step.key);
  else if (step.action === "wait") await page.waitForTimeout(step.ms ?? 300);
  else throw new Error(`unknown step action: ${step.action}`);
}
// Let transitions settle before reading computed styles.
await page.waitForTimeout(400);

const result = await page.evaluate(({ targets, contrastScope, ignore }) => {
  const lum = (r, g, b) => {
    const f = (c) => {
      c /= 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const parse = (css) => {
    const m = css.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/);
    return m ? { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] } : null;
  };
  const blend = (fg, bg) => ({
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
    a: 1,
  });
  // Effective opaque background behind el: walk up compositing each
  // non-transparent layer until one is opaque (or default to white page).
  const effectiveBg = (el) => {
    const layers = [];
    for (let n = el; n; n = n.parentElement) {
      const c = parse(getComputedStyle(n).backgroundColor);
      if (c && c.a > 0) {
        layers.push(c);
        if (c.a >= 1) break;
      }
    }
    let bg = { r: 255, g: 255, b: 255, a: 1 };
    for (const layer of layers.reverse()) bg = blend(layer, bg);
    return bg;
  };
  const ratio = (fg, bg) => {
    const l1 = lum(fg.r, fg.g, fg.b);
    const l2 = lum(bg.r, bg.g, bg.b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  };
  const paintsTextDirectly = (el) =>
    [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 0);

  const readTarget = (name, sel) => {
    const el = document.querySelector(sel);
    if (!el) return { name, selector: sel, found: false };
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return {
      name,
      selector: sel,
      found: true,
      rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
      style: {
        background: s.backgroundColor,
        color: s.color,
        borderRadius: s.borderRadius,
        border: s.border,
        boxShadow: s.boxShadow === "none" ? "none" : s.boxShadow,
        fontFamily: s.fontFamily.split(",")[0].replace(/"/g, ""),
        fontSize: s.fontSize,
        fontWeight: s.fontWeight,
        lineHeight: s.lineHeight,
      },
    };
  };

  const targets_ = (targets ?? []).map((t) => readTarget(t.name, t.selector));

  // Contrast sweep: every visible element painting text directly, page-wide
  // (or scoped by the recipe's contrastScope selector).
  const scope = document.querySelector(contrastScope ?? "body") ?? document.body;
  const ignoreSel = (ignore ?? []).join(",");
  const pairs = [];
  for (const el of scope.querySelectorAll("*")) {
    if (ignoreSel && el.closest(ignoreSel)) continue;
    if (!paintsTextDirectly(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    const s = getComputedStyle(el);
    if (s.visibility === "hidden" || +s.opacity === 0) continue;
    const fgRaw = parse(s.color);
    if (!fgRaw) continue;
    const bg = effectiveBg(el);
    const fg = fgRaw.a < 1 ? blend(fgRaw, bg) : fgRaw;
    const px = parseFloat(s.fontSize);
    const bold = +s.fontWeight >= 700;
    const large = px >= 18 || (px >= 14 && bold);
    const needed = large ? 3 : 4.5;
    const got = ratio(fg, bg);
    if (got < needed) {
      pairs.push({
        text: el.textContent.trim().slice(0, 40),
        selector:
          el.tagName.toLowerCase() +
          (el.id ? `#${el.id}` : "") +
          (el.classList.length ? `.${[...el.classList].slice(0, 2).join(".")}` : ""),
        color: s.color,
        bg: `rgb(${Math.round(bg.r)}, ${Math.round(bg.g)}, ${Math.round(bg.b)})`,
        fontSize: s.fontSize,
        fontWeight: s.fontWeight,
        ratio: Math.round(got * 100) / 100,
        needed,
      });
    }
  }
  return { targets: targets_, contrastFailures: pairs };
}, { targets: recipe.targets, contrastScope: recipe.contrastScope, ignore: recipe.ignore });

await browser.close();

mkdirSync(OUT_DIR, { recursive: true });
const out = {
  surface: recipe.surface ?? surfaceId,
  board: recipe.board ?? null,
  viewport: recipe.viewport ?? { width: 1440, height: 900 },
  measuredAt: new Date().toISOString(),
  ...result,
};
const outPath = join(OUT_DIR, `${surfaceId}.json`);
writeFileSync(outPath, JSON.stringify(out, null, 2));

const missing = out.targets.filter((t) => !t.found);
console.log(`[measure] ${surfaceId}: ${out.targets.length} targets (${missing.length} missing), ${out.contrastFailures.length} contrast failure(s) → ${resolve(outPath)}`);
for (const t of missing) console.log(`  MISSING target: ${t.name} (${t.selector})`);
for (const p of out.contrastFailures)
  console.log(`  CONTRAST ${p.ratio} < ${p.needed}  ${p.selector}  "${p.text}"  ${p.color} on ${p.bg} @${p.fontSize}/${p.fontWeight}`);
process.exit(missing.length || out.contrastFailures.length ? 1 : 0);
