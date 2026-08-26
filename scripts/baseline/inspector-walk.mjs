#!/usr/bin/env node
/**
 * Select one element of every type the fixture page carries and record what the
 * inspector offers for it.
 *
 * The inspector is the editor's largest module and the board census covers only
 * seven element profiles, so "what does the inspector do for a LIST, a LINK, an
 * IMAGE" had no answer anywhere. It also has no rail door: it is driven purely
 * by selection, which is why it needs its own walk rather than a row in
 * module-walk.mjs.
 *
 * The canvas contract is `data-buildrick-id` / `data-buildrick-type` — NOT
 * `data-element-id`, which does not exist and has already cost one walk four
 * "the product is broken" readings.
 *
 * Usage: node inspector-walk.mjs [--out <dir>]
 *
 * @license BSD-3-Clause
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { login, openEditor, stripDevOverlays, clickCanvasElement, readToasts, resetLoginRateLimit }
  from "./editor-rig.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const OUT = args.includes("--out") ? args[args.indexOf("--out") + 1] : join(HERE, "..", "..", ".walk", "inspector");

async function dumpInspector(page) {
  return page.evaluate(() => {
    const norm = (s) => (s || "").replace(/\s+/g, " ").trim();
    const vis = (el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return null;
      const cs = getComputedStyle(el);
      return cs.visibility === "hidden" || cs.display === "none" ? null : r;
    };
    /* The inspector is the right column. Pick the TOPMOST container there so we
       get its root and its section headings, not an inner scroll body. */
    let best = null;
    for (const el of document.querySelectorAll("div,section,aside,form")) {
      const r = vis(el); if (!r) continue;
      if (r.left < 1080 || r.width < 200 || r.height < 300) continue;
      if (!best || r.top < best.r.top - 4) best = { el, r };
    }
    if (!best) return { container: "NOT-FOUND" };
    const root = best.el;
    const out = {
      container: `${root.tagName.toLowerCase()}.${norm(root.className).slice(0, 50)}`,
      box: [Math.round(best.r.x), Math.round(best.r.y), Math.round(best.r.width), Math.round(best.r.height)],
      text: norm(root.innerText).slice(0, 400),
      sections: [], controls: [], tabs: [],
    };
    for (const el of root.querySelectorAll("[role=tab]")) {
      if (!vis(el)) continue;
      out.tabs.push({ name: norm(el.textContent).slice(0, 24), selected: el.getAttribute("aria-selected") === "true" });
    }
    for (const el of root.querySelectorAll("h1,h2,h3,h4,[role=heading],summary,legend")) {
      if (!vis(el)) continue;
      const n = norm(el.textContent).slice(0, 40);
      if (n) out.sections.push(n);
    }
    for (const el of root.querySelectorAll("button,input,select,textarea,[role=button],[role=switch],[role=radio]")) {
      if (!vis(el)) continue;
      out.controls.push({
        tag: el.tagName.toLowerCase(),
        name: norm(el.getAttribute("aria-label") || el.getAttribute("title") || el.getAttribute("placeholder") || el.textContent || el.value).slice(0, 34),
        disabled: el.disabled === true || el.getAttribute("aria-disabled") === "true",
      });
    }
    return out;
  });
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const statePath = join(OUT, "state.json");
  await resetLoginRateLimit();
  await login({ statePath });
  const { browser, page, consoleErrors } = await openEditor({ statePath });
  await stripDevOverlays(page);

  const targets = await page.evaluate(() => {
    const seen = new Map();
    for (const el of document.querySelectorAll("[data-buildrick-id]")) {
      const t = el.getAttribute("data-buildrick-type") || "?";
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;      // can't click what isn't painted
      if (!seen.has(t)) seen.set(t, { type: t, id: el.getAttribute("data-buildrick-id") });
    }
    return [...seen.values()];
  });
  console.log(`element types on the fixture page: ${targets.map((t) => t.type).join(", ")}\n`);

  const results = [];

  /* The empty state is a profile too — it is what every user sees first. */
  await page.keyboard.press("Escape");
  await page.waitForTimeout(1200);
  await stripDevOverlays(page);
  results.push({ type: "(no selection)", id: null, ...(await dumpInspector(page)), toasts: await readToasts(page) });
  await page.screenshot({ path: join(OUT, "none.png") });

  /* A walk must not edit the site it is measuring. Selecting an element raises
     a floating toolbar over it, and the next click — aimed at the CENTRE of the
     following element — landed on that toolbar and deleted a paragraph
     (52 elements -> 51, recovered from Version History). Deselect first, and
     count after every step so damage is caught on the step that causes it
     rather than three modules later. */
  const countEls = () => page.evaluate(() => document.querySelectorAll("[data-buildrick-id]").length);
  const baselineCount = await countEls();
  console.log(`fixture element count: ${baselineCount}\n`);

  for (const t of targets) {
    const before = consoleErrors.length;
    await page.keyboard.press("Escape");
    await page.waitForTimeout(700);
    const ok = await clickCanvasElement(page, t.id);
    await page.waitForTimeout(1200);
    await stripDevOverlays(page);
    const insp = ok ? await dumpInspector(page) : { container: "CLICK-FAILED" };
    const shot = join(OUT, `${t.type}.png`);
    await page.screenshot({ path: shot });
    const now = await countEls();
    if (now !== baselineCount) {
      console.error(
        `\nABORT at "${t.type}": element count ${baselineCount} -> ${now}. ` +
        `The walk edited the fixture. Restore it from Version History before trusting any row above.`
      );
      writeFileSync(join(OUT, "inspector.json"), JSON.stringify({ aborted: t.type, baselineCount, now, results }, null, 2));
      await browser.close();
      process.exit(2);
    }
    results.push({ ...t, ...insp, toasts: await readToasts(page), newConsoleErrors: consoleErrors.slice(before), shot });
    const n = insp.controls ? insp.controls.length : 0;
    console.log(
      `${t.type.padEnd(12)} controls=${String(n).padStart(3)} sections=${String((insp.sections || []).length).padStart(2)}` +
      ` tabs=${String((insp.tabs || []).length).padStart(2)}${insp.container === "NOT-FOUND" ? "  NOT-FOUND" : ""}`
    );
  }

  writeFileSync(join(OUT, "inspector.json"), JSON.stringify({ ranAt: new Date().toISOString(), results }, null, 2));
  console.log(`\nwrote ${join(OUT, "inspector.json")}`);
  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
