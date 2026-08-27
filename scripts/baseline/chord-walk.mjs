#!/usr/bin/env node
/**
 * Press every chord the Keyboard Shortcuts sheet PRINTS and record what it does.
 *
 * The module walk opened panels through their doors — a rail click, a site-menu
 * row, a topbar button — and never through the chord printed beside them. A
 * printed chord is a contract: this repo has already found 11 of 23 right-click
 * shortcuts wrong, two of them running a different command than advertised.
 *
 * Each chord is pressed from a freshly reloaded shell, because the rail toggles
 * and the editor restores the last-open panel, so a chord pressed on top of the
 * previous result reads as whatever was already there.
 *
 * Usage: node chord-walk.mjs [--only A,I]
 *
 * @license BSD-3-Clause
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { login, openEditor, stripDevOverlays, readToasts, resetLoginRateLimit, BASE, FIXTURE_SITE } from "./editor-rig.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const only = args.includes("--only") ? (args[args.indexOf("--only") + 1] || "").split(",").filter(Boolean) : [];
const OUT = join(HERE, "..", "..", ".walk", "chords");

/* Exactly what the sheet prints, and exactly what it says each one opens. The
   expectation is the sheet's own promise — not what the code does. */
const CHORDS = [
  { key: "A",       press: "a",             promises: "Insert" },
  { key: "I",       press: "i",             promises: "AI" },
  { key: "T",       press: "t",             promises: "Templates" },
  { key: "M",       press: "m",             promises: "Media" },
  { key: "L",       press: "l",             promises: "Layers" },
  { key: "P",       press: "p",             promises: "Pages" },
  { key: "⇧A",      press: "Shift+A",       promises: "Components" },
  { key: "B",       press: "b",             promises: "Brand" },
  { key: "S",       press: "s",             promises: "Settings" },
  { key: "U",       press: "u",             promises: "Publish" },
  { key: "H",       press: "h",             promises: "History" },
  { key: "R",       press: "r",             promises: "Review" },
  { key: "D",       press: "d",             promises: "Content" },
  { key: "⌘K",      press: "Meta+k",        promises: "command palette" },
  { key: "?",       press: "Shift+Slash",   promises: "Keyboard Shortcuts" },
];

/** What is on screen: the visible drawer's heading, plus any modal or menu. */
const surface = (page) => page.evaluate(() => {
  const norm = (s) => (s || "").replace(/\s+/g, " ").trim();
  const vis = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const panel = [...document.querySelectorAll(".ls-panel")].find(vis);
  const overlays = [...document.querySelectorAll('[role=dialog],[role=menu],[aria-modal=true]')]
    .filter(vis).map((d) => norm(d.innerText).slice(0, 60));
  /* Settings is a FULLPAGE surface, not a drawer — reading only `.ls-panel`
     reported it as "nothing opened" when it had in fact replaced the canvas. */
  const canvas = document.querySelector(".layout-shell__canvas");
  let full = null;
  for (const el of document.querySelectorAll("div,section,main,aside")) {
    const r = el.getBoundingClientRect();
    if (r.width < 600 || r.height < 400 || r.left < 40) continue;
    if (canvas && (canvas === el || canvas.contains(el) || el.contains(canvas))) continue;
    if (!full || r.top < full.top) full = { top: r.top, text: norm(el.innerText).slice(0, 40) };
  }
  return {
    panel: panel ? norm(panel.innerText).split("✕")[0].trim().slice(0, 40) : null,
    fullpage: full ? full.text : null,
    overlays,
    all: norm(document.body.innerText).length,
  };
});

async function main() {
  mkdirSync(OUT, { recursive: true });
  const statePath = join(OUT, "state.json");
  await resetLoginRateLimit();
  await login({ statePath });
  const { browser, page, consoleErrors } = await openEditor({ statePath });
  const countEls = () => page.evaluate(() => document.querySelectorAll("[data-buildrick-id]").length);
  const baseline = await countEls();
  console.log(`fixture: ${baseline} elements\n`);
  console.log("chord   presses          promises        →  what actually opened");

  const list = only.length ? CHORDS.filter((c) => only.includes(c.key)) : CHORDS;
  const results = [];
  for (const c of list) {
    /* A reload, not Escape: the drawer is a drill-in stack and the editor
       restores the last-open panel, so a chord pressed on top of the previous
       result reports that result. */
    await page.goto(`${BASE}/edit/${FIXTURE_SITE}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(12000);
    await stripDevOverlays(page);
    const before = await surface(page);
    const errBefore = consoleErrors.length;

    /* Click the canvas shell first so the chord lands on the document and not
       on whatever the reload left focused. */
    await page.mouse.click(700, 60);
    await page.waitForTimeout(400);
    await page.keyboard.press(c.press);
    await page.waitForTimeout(3000);
    await stripDevOverlays(page);
    const after = await surface(page);

    const opened = after.overlays.length ? `overlay: ${after.overlays[0]}`
      : after.panel ? after.panel
      : after.fullpage ? `fullpage: ${after.fullpage}`
      : "(nothing)";
    const changed = after.panel !== before.panel || after.fullpage !== before.fullpage
      || after.overlays.length !== before.overlays.length;
    const keeps = new RegExp(c.promises, "i").test(opened);
    const now = await countEls();
    results.push({ ...c, before: before.panel, beforeFullpage: before.fullpage, opened, changed, keepsPromise: keeps,
                   mutated: now !== baseline, toasts: await readToasts(page),
                   newConsoleErrors: consoleErrors.slice(errBefore) });
    console.log(
      `${c.key.padEnd(7)} ${c.press.padEnd(16)} ${c.promises.padEnd(15)} →  ${opened.slice(0, 46)}` +
      `${keeps ? "  ✓" : changed ? "  ✗ DIFFERENT" : "  ✗ NOTHING"}` +
      `${now !== baseline ? `  !! elements ${baseline}->${now}` : ""}`
    );
  }

  const broken = results.filter((r) => !r.keepsPromise);
  writeFileSync(join(OUT, "chords.json"), JSON.stringify({ baseline, ranAt: new Date().toISOString(), results }, null, 2));
  console.log(`\n${results.length - broken.length}/${results.length} chords do what the sheet says.`);
  broken.forEach((b) => console.log(`   ${b.key} promises ${b.promises}, opened: ${b.opened}`));
  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
