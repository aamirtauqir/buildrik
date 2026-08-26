#!/usr/bin/env node
/**
 * Insert every element type the Insert palette offers and record what the
 * inspector gives you for it.
 *
 * The module walk could only reach 7 of the 53 types, because the baseline
 * fixture happens to contain 7 — so 46 inspector profiles had never been
 * looked at by anything: not this walk, not the board census (whose recipes
 * record the same hole from the other side), not a test.
 *
 * This MUTATES its site, which is why it does not run against the baseline
 * fixture. `scratch-smoke` is the established probe site — a prior walk
 * disclosed inserting headings into it — and every board captured today came
 * from `cmrsur1fp…`, which this never opens.
 *
 * Usage: node element-sweep.mjs [--only Heading,Image] [--site <id>]
 *
 * @license BSD-3-Clause
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { login, openEditor, stripDevOverlays, readToasts, resetLoginRateLimit } from "./editor-rig.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const only = args.includes("--only") ? (args[args.indexOf("--only") + 1] || "").split(",").filter(Boolean) : [];
const SITE = args.includes("--site") ? args[args.indexOf("--site") + 1] : "scratchsmoke00000000000001";
const OUT = join(HERE, "..", "..", ".walk", "elements");

/** Ids currently on the canvas, so the element an insert created can be named. */
const ids = (page) => page.evaluate(() =>
  [...document.querySelectorAll("[data-buildrick-id]")].map((e) => e.getAttribute("data-buildrick-id")));

/** Select through the engine, not a coordinate click: the canvas is engine
    rendered HTML and a click lands wherever the layout put it. */
async function selectById(page, id) {
  return page.evaluate((elId) => {
    const canvas = document.querySelector("[data-buildrick-canvas]");
    let f = null;
    for (const k in canvas) if (k.startsWith("__reactFiber")) f = canvas[k];
    let x = f, c = null, h = 0;
    while (x && h < 40) { const pr = x.memoizedProps || {}; if (pr.composer?.elements) { c = pr.composer; break; } x = x.return; h++; }
    if (!c) return "no-composer";
    const el = c.elements.getAllElements().find((e) => e.getId?.() === elId || e.id === elId);
    if (!el) return "no-element";
    c.selection.select(el);
    return "ok";
  }, id);
}

async function dumpInspector(page) {
  return page.evaluate(() => {
    const norm = (s) => (s || "").replace(/\s+/g, " ").trim();
    const vis = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 ? r : null; };
    let best = null;
    for (const el of document.querySelectorAll("aside,div,section,form")) {
      const r = vis(el); if (!r) continue;
      if (r.left < 1080 || r.width < 200 || r.height < 300) continue;
      if (!best || r.top < best.r.top - 4) best = { el, r };
    }
    if (!best) return { container: "NOT-FOUND" };
    const root = best.el;
    const controls = [...root.querySelectorAll("button,input,select,textarea,[role=button],[role=switch],[role=radio]")]
      .filter(vis)
      .map((e) => norm(e.getAttribute("aria-label") || e.getAttribute("title") || e.getAttribute("placeholder") || e.textContent || e.value).slice(0, 30));
    /* Section headers are collapsible BUTTONS here, not headings — reading
       h1-h4 returns zero for every profile and looks like a missing inspector. */
    const sections = controls.filter((c) => /section$/i.test(c)).map((c) => c.replace(/ section$/i, ""));
    return {
      text: norm(root.innerText).slice(0, 220),
      controlCount: controls.length,
      sections,
      controls: controls.slice(0, 40),
    };
  });
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const statePath = join(OUT, "state.json");
  await resetLoginRateLimit();
  await login({ statePath });
  const { browser, page, consoleErrors } = await openEditor({ statePath, site: SITE });
  await stripDevOverlays(page);

  const openInsert = async () => {
    for (let i = 0; i < 3; i++) {
      const painted = await page.evaluate(() =>
        [...document.querySelectorAll(".ls-panel")].some((e) => {
          const r = e.getBoundingClientRect();
          return r.width > 0 && /Insert/.test(e.innerText || "");
        }));
      if (painted) return true;
      await page.evaluate(() => document.querySelector('.ls-rail [data-tab="add"]')?.click());
      await page.waitForTimeout(2200);
    }
    return false;
  };
  await openInsert();
  await stripDevOverlays(page);

  const palette = await page.evaluate(() => {
    const norm = (s) => (s || "").replace(/\s+/g, " ").trim();
    const p = [...document.querySelectorAll(".ls-panel")].find((e) => e.getBoundingClientRect().width > 0);
    return [...p.querySelectorAll("button,[role=button]")]
      .map((b) => norm(b.getAttribute("aria-label") || b.textContent))
      .filter((n) => n && !/^(Expand|Close|Search|▾|▸|⌥|Previous tip|Next tip|Hide tips)/.test(n));
  });
  const wanted = only.length ? palette.filter((n) => only.includes(n)) : palette;
  console.log(`palette offers ${palette.length}; sweeping ${wanted.length}\n`);

  const results = [];
  for (const name of wanted) {
    const before = await ids(page);
    const errBefore = consoleErrors.length;
    const clicked = await page.evaluate((n) => {
      const norm = (s) => (s || "").replace(/\s+/g, " ").trim();
      const p = [...document.querySelectorAll(".ls-panel")].find((e) => e.getBoundingClientRect().width > 0);
      if (!p) return "no-panel";
      const b = [...p.querySelectorAll("button,[role=button]")]
        .find((x) => norm(x.getAttribute("aria-label") || x.textContent) === n);
      if (!b) return "no-button";
      if (b.disabled) return "DISABLED";
      b.click();
      return "clicked";
    }, name);
    await page.waitForTimeout(1800);
    await stripDevOverlays(page);

    const after = await ids(page);
    const fresh = after.filter((i) => !before.includes(i));
    let type = null, insp = null, sel = null;
    if (fresh.length) {
      /* Take the OUTERMOST new element. A Table arrives as 46 nodes and a
         document-order pick returned one of its inner containers, so the row
         read "Table -> container" and profiled the wrong thing. */
      const root = await page.evaluate((list) => {
        const set = new Set(list);
        for (const id of list) {
          const el = document.querySelector(`[data-buildrick-id="${id}"]`);
          if (!el) continue;
          let p = el.parentElement, nested = false;
          while (p) { const pid = p.getAttribute?.("data-buildrick-id"); if (pid && set.has(pid)) { nested = true; break; } p = p.parentElement; }
          if (!nested) return id;
        }
        return list[0];
      }, fresh);
      type = await page.evaluate((i) =>
        document.querySelector(`[data-buildrick-id="${i}"]`)?.getAttribute("data-buildrick-type") || null, root);
      sel = await selectById(page, root);
      await page.waitForTimeout(1200);
      await stripDevOverlays(page);
      insp = await dumpInspector(page);
    }
    const toasts = await readToasts(page);
    results.push({
      name, clicked, created: fresh.length, type, select: sel,
      controlCount: insp?.controlCount ?? 0, sections: insp?.sections ?? [],
      inspectorText: insp?.text ?? null, controls: insp?.controls ?? [],
      toasts, newConsoleErrors: consoleErrors.slice(errBefore),
    });
    console.log(
      `${name.padEnd(14)} ${clicked.padEnd(9)} +${fresh.length} ${String(type ?? "-").padEnd(12)}` +
      ` inspector=${String(insp?.controlCount ?? 0).padStart(3)} sections=${(insp?.sections ?? []).length}` +
      `${fresh.length === 0 ? "   NO ELEMENT CREATED" : ""}` +
      `${consoleErrors.length > errBefore ? "  ERR+" + (consoleErrors.length - errBefore) : ""}`
    );
    await openInsert();
  }

  writeFileSync(join(OUT, "elements.json"), JSON.stringify({ site: SITE, ranAt: new Date().toISOString(), results }, null, 2));
  console.log(`\nwrote ${join(OUT, "elements.json")}`);
  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
