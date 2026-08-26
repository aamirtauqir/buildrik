#!/usr/bin/env node
/**
 * Walk the Brand panel's drill-ins — nine sub-surfaces behind one rail tab that
 * the module walk recorded as rows and never opened.
 *
 * Navigation only. Every one of these surfaces carries an Apply / Discard pair
 * or a destructive import, and a walk that measures a site must not edit it,
 * so nothing here clicks anything that writes. The element count is checked
 * after every drill-in anyway — the cheapest way to catch a click that turned
 * out to write.
 *
 * Usage: node brand-walk.mjs [--site <id>]
 *
 * @license BSD-3-Clause
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { login, openEditor, stripDevOverlays, readToasts, resetLoginRateLimit, FIXTURE_SITE } from "./editor-rig.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const SITE = args.includes("--site") ? args[args.indexOf("--site") + 1] : FIXTURE_SITE;
const OUT = join(HERE, "..", "..", ".walk", "brand");

const ROWS = ["Tokens", "Presets", "Starters", "Classes", "Components", "Typography", "Colour mode", "Lint", "Import / export"];

async function openBrand(page) {
  for (let i = 0; i < 4; i++) {
    const showing = await page.evaluate(() =>
      [...document.querySelectorAll(".ls-panel")].some((e) =>
        e.getBoundingClientRect().width > 0 && /Brand & shared theme|Tokens/.test(e.innerText || "")));
    if (showing) return true;
    await page.evaluate(() => document.querySelector('.ls-rail [data-tab="design"]')?.click());
    await page.waitForTimeout(2200);
  }
  return false;
}

/** Read the drawer: its heading, its controls, and whether a back door exists. */
async function dumpDrawer(page) {
  return page.evaluate(() => {
    const norm = (s) => (s || "").replace(/\s+/g, " ").trim();
    const vis = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
    const p = [...document.querySelectorAll(".ls-panel")].find(vis);
    if (!p) return { container: "NOT-FOUND" };
    const controls = [...p.querySelectorAll("button,input,select,textarea,[role=button],[role=switch],[role=tab]")]
      .filter(vis)
      .map((e) => ({
        n: norm(e.getAttribute("aria-label") || e.getAttribute("title") || e.getAttribute("placeholder") || e.textContent || e.value).slice(0, 34),
        d: e.disabled === true || e.getAttribute("aria-disabled") === "true",
      }))
      .filter((c) => c.n);
    return {
      text: norm(p.innerText).slice(0, 260),
      controls,
      disabled: controls.filter((c) => c.d).map((c) => c.n),
      /* A drill-in with no way back is the failure this panel's whole shape
         risks — the stack only works if every level has an exit. */
      hasBack: controls.some((c) => /^(‹|←|Back)/.test(c.n)) || /‹/.test(norm(p.innerText).slice(0, 40)),
    };
  });
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const statePath = join(OUT, "state.json");
  await resetLoginRateLimit();
  await login({ statePath });
  const { browser, page, consoleErrors } = await openEditor({ statePath, site: SITE });
  const countEls = () => page.evaluate(() => document.querySelectorAll("[data-buildrick-id]").length);
  const baseline = await countEls();
  console.log(`site ${SITE}, ${baseline} elements\n`);

  const results = [];
  for (const row of ROWS) {
    await page.goto(page.url().split("?")[0], { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(11000);
    await stripDevOverlays(page);
    await openBrand(page);
    await stripDevOverlays(page);

    const errBefore = consoleErrors.length;
    const clicked = await page.evaluate((r) => {
      const norm = (s) => (s || "").replace(/\s+/g, " ").trim();
      const p = [...document.querySelectorAll(".ls-panel")].find((e) => e.getBoundingClientRect().width > 0);
      if (!p) return "no-panel";
      const b = [...p.querySelectorAll("button,[role=button]")]
        .find((x) => x.getBoundingClientRect().height > 0 && norm(x.textContent).startsWith(r));
      if (!b) return "no-row";
      if (b.disabled) return "DISABLED";
      b.click();
      return "clicked";
    }, row);
    await page.waitForTimeout(3200);
    await stripDevOverlays(page);

    const d = clicked === "clicked" ? await dumpDrawer(page) : { container: clicked };
    const now = await countEls();
    const shot = join(OUT, `${row.toLowerCase().replace(/[^a-z]+/g, "-")}.png`);
    await page.screenshot({ path: shot });

    results.push({ row, clicked, ...d, elementsAfter: now, mutated: now !== baseline,
                   toasts: await readToasts(page), newConsoleErrors: consoleErrors.slice(errBefore), shot });
    console.log(
      `${row.padEnd(16)} ${String(clicked).padEnd(9)} controls=${String(d.controls?.length ?? 0).padStart(3)}` +
      ` disabled=${String(d.disabled?.length ?? 0).padStart(2)} back=${d.hasBack ? "yes" : "NO "}` +
      `${now !== baseline ? `  !! elements ${baseline}->${now}` : ""}` +
      `${consoleErrors.length > errBefore ? "  ERR+" + (consoleErrors.length - errBefore) : ""}`
    );
  }

  writeFileSync(join(OUT, "brand.json"), JSON.stringify({ site: SITE, baseline, ranAt: new Date().toISOString(), results }, null, 2));
  console.log(`\nwrote ${join(OUT, "brand.json")}`);
  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
