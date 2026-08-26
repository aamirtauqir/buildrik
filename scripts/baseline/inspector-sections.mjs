#!/usr/bin/env node
/**
 * Open every collapsible section of the inspector and record what is inside.
 *
 * inspector-walk.mjs counted controls per element type; it never opened a
 * section. The counts therefore covered whatever happened to be expanded by
 * default, which is not the same as knowing what the inspector offers.
 *
 * Sections are collapsible BUTTONS, not headings — reading h1-h4 returns zero
 * for every profile and reads like a missing inspector.
 *
 * Usage: node inspector-sections.mjs [--type container]
 *
 * @license BSD-3-Clause
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { login, openEditor, stripDevOverlays, resetLoginRateLimit, FIXTURE_SITE } from "./editor-rig.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const TYPE = args.includes("--type") ? args[args.indexOf("--type") + 1] : "container";
/* The baseline fixture carries 7 element types; anything else has to be walked
   on a site that has one, which is scratch-smoke after element-sweep ran. */
const SITE = args.includes("--site") ? args[args.indexOf("--site") + 1] : FIXTURE_SITE;
const OUT = join(HERE, "..", "..", ".walk", "inspector-sections");

const selectType = (page, type) => page.evaluate((t) => {
  const canvas = document.querySelector("[data-buildrick-canvas]");
  let f = null; for (const k in canvas) if (k.startsWith("__reactFiber")) f = canvas[k];
  let x = f, c = null, h = 0;
  while (x && h < 40) { const pr = x.memoizedProps || {}; if (pr.composer?.elements) { c = pr.composer; break; } x = x.return; h++; }
  if (!c) return "no-composer";
  const el = c.elements.getAllElements().find((e) => e.getType() === t);
  if (!el) return "no-element-of-type-" + t;
  c.selection.select(el);
  return "ok";
}, type);

const inspector = (page) => page.evaluate(() => {
  const norm = (s) => (s || "").replace(/\s+/g, " ").trim();
  const vis = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 ? r : null; };
  let best = null;
  for (const el of document.querySelectorAll("aside,div,section,form")) {
    const r = vis(el); if (!r) continue;
    if (r.left < 1080 || r.width < 200 || r.height < 300) continue;
    if (!best || r.top < best.r.top - 4) best = { el, r };
  }
  if (!best) return { sections: [], controls: [] };
  const root = best.el;
  const controls = [...root.querySelectorAll("button,input,select,textarea,[role=button],[role=switch],[role=radio]")]
    .filter(vis).map((e) => norm(e.getAttribute("aria-label") || e.getAttribute("title") || e.getAttribute("placeholder") || e.textContent || e.value).slice(0, 30));
  /* A section header is a button whose accessible name ends in "section" and
     which carries aria-expanded — that is what makes it a disclosure and not
     just a row that happens to be named after one. */
  const sections = [...root.querySelectorAll("button,[role=button]")].filter(vis)
    .map((e) => ({ name: norm(e.getAttribute("aria-label") || e.textContent).slice(0, 60), expanded: e.getAttribute("aria-expanded") }))
    .filter((x) => /section$/i.test(x.name) || x.expanded !== null);
  return { sections, controls };
});

async function main() {
  mkdirSync(OUT, { recursive: true });
  const statePath = join(OUT, "state.json");
  await resetLoginRateLimit();
  await login({ statePath });
  const { browser, page } = await openEditor({ statePath, site: SITE });
  await stripDevOverlays(page);

  console.log(`select ${TYPE}: ${await selectType(page, TYPE)}`);
  await page.waitForTimeout(1800);
  await stripDevOverlays(page);

  const base = await inspector(page);
  console.log(`\nsections offered: ${base.sections.length}`);
  base.sections.forEach((s) => console.log(`   ${s.name.padEnd(34)} aria-expanded=${s.expanded}`));
  console.log(`controls while collapsed: ${base.controls.length}\n`);

  const results = [];
  for (const sec of base.sections) {
    const before = await inspector(page);
    const hit = await page.evaluate((n) => {
      const norm = (s) => (s || "").replace(/\s+/g, " ").trim();
      const b = [...document.querySelectorAll("button,[role=button]")]
        .find((x) => { const r = x.getBoundingClientRect();
          return r.width > 0 && r.left > 1080 && norm(x.getAttribute("aria-label") || x.textContent).slice(0, 60) === n; });
      if (!b) return "not-found";
      b.click(); return "clicked";
    }, sec.name);
    await page.waitForTimeout(1400);
    await stripDevOverlays(page);
    const after = await inspector(page);
    const gained = after.controls.filter((c) => !before.controls.includes(c));
    results.push({ section: sec.name, wasExpanded: sec.expanded, hit,
                   controlsBefore: before.controls.length, controlsAfter: after.controls.length, gained: gained.slice(0, 18) });
    console.log(`${sec.name.padEnd(34)} ${hit.padEnd(10)} ${before.controls.length} → ${after.controls.length}` +
                `${gained.length ? "   + " + gained.slice(0, 8).join(" · ").slice(0, 110) : ""}`);
  }

  writeFileSync(join(OUT, `${TYPE}.json`), JSON.stringify({ type: TYPE, ranAt: new Date().toISOString(), base, results }, null, 2));
  console.log(`\nwrote ${join(OUT, `${TYPE}.json`)}`);
  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
